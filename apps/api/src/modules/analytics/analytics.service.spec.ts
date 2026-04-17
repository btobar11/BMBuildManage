import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFinancialSummary', () => {
    it('should return financial summary for company', async () => {
      const mockResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          total_budgeted: 1000000,
          total_spent: 500000,
          variance: 500000,
          percent_executed: 50,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getFinancialSummary('company-1');

      expect(result).toEqual(mockResult);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('bi_financial_summary'),
        ['company-1'],
      );
    });

    it('should return empty array when no data', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getFinancialSummary('company-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPhysicalProgress', () => {
    it('should return physical progress for company', async () => {
      const mockResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          total_quantity_budgeted: 1000,
          total_quantity_executed: 500,
          physical_progress_percent: 50,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getPhysicalProgress('company-1');

      expect(result).toEqual(mockResult);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('bi_physical_progress'),
        ['company-1'],
      );
    });
  });

  describe('getClashHealth', () => {
    it('should return clash health for company', async () => {
      const mockResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          total_clashes: 100,
          pending_clashes: 20,
          resolved_clashes: 80,
          resolution_rate_percent: 80,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getClashHealth('company-1');

      expect(result).toEqual(mockResult);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('bi_clash_health'),
        ['company-1'],
      );
    });
  });

  describe('getProjectFinancialDetails', () => {
    it('should return financial details for specific project', async () => {
      const mockResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          total_budgeted: 1000000,
          total_spent: 500000,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getProjectFinancialDetails('company-1', 'project-1');

      expect(result).toEqual(mockResult[0]);
    });

    it('should return null when no project found', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getProjectFinancialDetails('company-1', 'project-1');

      expect(result).toBeNull();
    });
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary with all metrics', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 5 }]) // projects
        .mockResolvedValueOnce([{ total: 1000000 }]) // budget
        .mockResolvedValueOnce([{ total: 500000 }]) // spent
        .mockResolvedValueOnce([{ count: 10 }]); // workers

      const result = await service.getDashboardSummary('company-1');

      expect(result).toHaveProperty('totalProjects');
      expect(result).toHaveProperty('totalBudget');
      expect(result).toHaveProperty('totalSpent');
      expect(result).toHaveProperty('activeWorkers');
    });
  });

  describe('getCashflow', () => {
    it('should return cashflow data for company', async () => {
      const mockResult = [
        {
          project_id: 'project-1',
          month: '2024-01',
          income: 100000,
          expenses: 50000,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getCashflow('company-1');

      expect(result).toEqual(mockResult);
    });
  });

  describe('getLaborProductivity', () => {
    it('should return labor productivity data', async () => {
      const mockResult = [
        {
          worker_id: 'worker-1',
          productivity: 85.5,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getLaborProductivity('company-1');

      expect(result).toEqual(mockResult);
    });
  });

  describe('getComplianceSummary', () => {
    it('should return compliance summary', async () => {
      const mockResult = {
        rfis_compliance: 95,
        submittals_compliance: 90,
        documents_compliance: 85,
      };
      mockDataSource.query.mockResolvedValueOnce([mockResult]);

      const result = await service.getComplianceSummary('company-1');

      expect(result).toEqual(mockResult);
    });
  });
});