import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;
  let exportService: AnalyticsExportService;

  beforeEach(async () => {
    const mockService = {
      getDashboardSummary: jest.fn().mockResolvedValue({
        financial: [],
        physical: [],
        clash: [],
      }),
      getFinancialSummary: jest.fn().mockResolvedValue([]),
      getPhysicalProgress: jest.fn().mockResolvedValue([]),
      getClashHealth: jest.fn().mockResolvedValue([]),
      getCashflow: jest.fn().mockResolvedValue([]),
      getLaborProductivity: jest.fn().mockResolvedValue([]),
      getComplianceSummary: jest.fn().mockResolvedValue({}),
      getProjectFinancialDetails: jest.fn().mockResolvedValue(null),
      getProjectPhysicalDetails: jest.fn().mockResolvedValue(null),
      getProjectClashHealth: jest.fn().mockResolvedValue(null),
      getProjectCashflow: jest.fn().mockResolvedValue(null),
    };

    const mockExportService = {
      generateExcelReport: jest.fn().mockResolvedValue(Buffer.from('test')),
    };

    const mockGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockService },
        { provide: AnalyticsExportService, useValue: mockExportService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
    exportService = module.get<AnalyticsExportService>(AnalyticsExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      const result = await controller.getDashboardSummary('company-1');
      expect(result).toHaveProperty('financial');
      expect(result).toHaveProperty('physical');
      expect(result).toHaveProperty('clash');
    });
  });

  describe('getFinancialSummary', () => {
    it('should return financial summary', async () => {
      const result = await controller.getFinancialSummary('company-1');
      expect(result).toEqual([]);
    });
  });

  describe('getPhysicalProgress', () => {
    it('should return physical progress', async () => {
      const result = await controller.getPhysicalProgress('company-1');
      expect(result).toEqual([]);
    });
  });

  describe('getClashHealth', () => {
    it('should return clash health', async () => {
      const result = await controller.getClashHealth('company-1');
      expect(result).toEqual([]);
    });
  });

  describe('getCashflow', () => {
    it('should return cashflow data', async () => {
      const result = await controller.getCashflow('company-1');
      expect(result).toEqual([]);
    });
  });

  describe('getLaborProductivity', () => {
    it('should return labor productivity', async () => {
      const result = await controller.getLaborProductivity('company-1');
      expect(result).toEqual([]);
    });
  });

  describe('getComplianceSummary', () => {
    it('should return compliance summary', async () => {
      const result = await controller.getComplianceSummary('company-1');
      expect(result).toEqual({});
    });
  });

  describe('getProjectFinancialDetails', () => {
    it('should return financial details for project', async () => {
      const result = await controller.getProjectFinancialDetails('company-1', 'project-1');
      expect(result).toBeNull();
    });
  });

  describe('getProjectPhysicalDetails', () => {
    it('should return physical details for project', async () => {
      const result = await controller.getProjectPhysicalDetails('company-1', 'project-1');
      expect(result).toBeNull();
    });
  });

  describe('getProjectClashHealth', () => {
    it('should return clash health for project', async () => {
      const result = await controller.getProjectClashHealth('company-1', 'project-1');
      expect(result).toBeNull();
    });
  });

  describe('getProjectCashflow', () => {
    it('should return cashflow for project', async () => {
      const result = await controller.getProjectCashflow('company-1', 'project-1');
      expect(result).toBeNull();
    });
  });
});