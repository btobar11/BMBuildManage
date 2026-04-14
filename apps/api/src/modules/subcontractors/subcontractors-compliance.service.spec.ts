import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcontractorsService } from './subcontractors.service';
import {
  Subcontractor,
  SubcontractorContract,
  SubcontractorPayment,
  SubcontractorRAM,
} from './subcontractor.entity';
import { Document, DocumentType } from '../documents/document.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SubcontractorsService — Compliance Blocking', () => {
  let service: SubcontractorsService;
  let contractRepo: jest.Mocked<Repository<SubcontractorContract>>;
  let paymentRepo: jest.Mocked<Repository<SubcontractorPayment>>;
  let documentRepo: jest.Mocked<Repository<Document>>;

  const mockSubcontractorId = 'sub-uuid-1';
  const mockContractId = 'contract-uuid-1';

  beforeEach(async () => {
    const mockRepoFactory = () => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubcontractorsService,
        {
          provide: getRepositoryToken(Subcontractor),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(SubcontractorContract),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(SubcontractorPayment),
          useFactory: mockRepoFactory,
        },
        {
          provide: getRepositoryToken(SubcontractorRAM),
          useFactory: mockRepoFactory,
        },
        { provide: getRepositoryToken(Document), useFactory: mockRepoFactory },
      ],
    }).compile();

    service = module.get<SubcontractorsService>(SubcontractorsService);
    contractRepo = module.get(getRepositoryToken(SubcontractorContract));
    paymentRepo = module.get(getRepositoryToken(SubcontractorPayment));
    documentRepo = module.get(getRepositoryToken(Document));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment — compliance validation', () => {
    const mockContract = {
      id: mockContractId,
      subcontractor_id: mockSubcontractorId,
      subcontractor: { name: 'Electricidad Express Ltda.' },
      paid_amount: 0,
      contract_amount: 5000000,
    };

    it('should BLOCK payment when F30-1 document is MISSING for the period', async () => {
      contractRepo.findOne.mockResolvedValue(mockContract as any);
      documentRepo.findOne.mockResolvedValue(null);

      const paymentData = {
        amount: 1500000,
        payment_date: new Date('2024-06-15'),
        payment_period: '2024-06',
      };

      await expect(
        service.createPayment(mockContractId, paymentData as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createPayment(mockContractId, paymentData as any),
      ).rejects.toThrow(/BLOQUEO DE PAGO/);
    });

    it('should ALLOW payment when F30-1 document EXISTS for the period', async () => {
      contractRepo.findOne.mockResolvedValue(mockContract as any);

      const mockComplianceDoc = {
        id: 'doc-uuid-1',
        subcontractor_id: mockSubcontractorId,
        type: DocumentType.LABOR_COMPLIANCE,
        period: '2024-06',
        name: 'F30-1 Junio 2024',
        file_url: 'https://storage.example.com/f30-1-junio.pdf',
      };
      documentRepo.findOne.mockResolvedValue(mockComplianceDoc as any);

      const savedPayment = {
        id: 'payment-uuid-1',
        contract_id: mockContractId,
        amount: 1500000,
        compliance_verified: true,
        compliance_document_id: 'doc-uuid-1',
        payment_period: '2024-06',
      };
      paymentRepo.create.mockReturnValue(savedPayment as any);
      paymentRepo.save.mockResolvedValue(savedPayment as any);
      contractRepo.save.mockResolvedValue({
        ...mockContract,
        paid_amount: 1500000,
      } as any);

      const result = await service.createPayment(mockContractId, {
        amount: 1500000,
        payment_date: new Date('2024-06-15'),
        payment_period: '2024-06',
      } as any);

      expect(result.compliance_verified).toBe(true);
      expect(result.compliance_document_id).toBe('doc-uuid-1');
      expect(result.payment_period).toBe('2024-06');
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      contractRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment('fake-contract', { amount: 100000 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate against the CORRECT period format (YYYY-MM)', async () => {
      contractRepo.findOne.mockResolvedValue(mockContract as any);
      documentRepo.findOne.mockResolvedValue(null);

      const paymentData = {
        amount: 1000000,
        payment_date: new Date(),
        payment_period: '2024-07',
      };

      await expect(
        service.createPayment(mockContractId, paymentData as any),
      ).rejects.toThrow(BadRequestException);

      expect(documentRepo.findOne).toHaveBeenCalledWith({
        where: {
          subcontractor_id: mockSubcontractorId,
          type: DocumentType.LABOR_COMPLIANCE,
          period: '2024-07',
        },
      });
    });

    it('should use current period when payment_period is not provided', async () => {
      contractRepo.findOne.mockResolvedValue(mockContract as any);
      documentRepo.findOne.mockResolvedValue(null);

      const now = new Date();
      const expectedPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const paymentData = {
        amount: 500000,
        payment_date: new Date(),
      };

      await expect(
        service.createPayment(mockContractId, paymentData as any),
      ).rejects.toThrow(BadRequestException);

      expect(documentRepo.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          period: expectedPeriod,
        }),
      });
    });

    it('should update contract paid_amount atomically after successful payment', async () => {
      contractRepo.findOne.mockResolvedValue({
        ...mockContract,
        paid_amount: 2000000,
      } as any);

      documentRepo.findOne.mockResolvedValue({
        id: 'doc-2',
        type: DocumentType.LABOR_COMPLIANCE,
        period: '2024-08',
      } as any);

      const savedPayment = {
        id: 'pay-2',
        amount: 800000,
        compliance_verified: true,
        compliance_document_id: 'doc-2',
        payment_period: '2024-08',
      };
      paymentRepo.create.mockReturnValue(savedPayment as any);
      paymentRepo.save.mockResolvedValue(savedPayment as any);
      contractRepo.save.mockResolvedValue({ paid_amount: 2800000 } as any);

      await service.createPayment(mockContractId, {
        amount: 800000,
        payment_period: '2024-08',
      } as any);

      expect(contractRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paid_amount: 2800000,
        }),
      );
    });
  });
});
