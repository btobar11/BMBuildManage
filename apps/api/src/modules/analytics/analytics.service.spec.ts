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

      const result = await service.getProjectFinancialDetails(
        'company-1',
        'project-1',
      );

      expect(result).toEqual(mockResult[0]);
    });

    it('should return null when no project found', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getProjectFinancialDetails(
        'company-1',
        'project-1',
      );

      expect(result).toBeNull();
    });
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary with all metrics', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: 5 }]) // financial
        .mockResolvedValueOnce([{ total: 1000000 }]) // physical
        .mockResolvedValueOnce([{ total: 500000 }]); // clash

      const result = await service.getDashboardSummary('company-1');

      expect(result).toHaveProperty('financial');
      expect(result).toHaveProperty('physical');
      expect(result).toHaveProperty('clash');
      expect(Array.isArray(result.financial)).toBe(true);
      expect(Array.isArray(result.physical)).toBe(true);
      expect(Array.isArray(result.clash)).toBe(true);
    });
  });

  describe('getProjectPhysicalDetails', () => {
    it('should return physical progress for specific project', async () => {
      const mockResult = [
        {
          project_id: 'project-1',
          project_name: 'Test Project',
          total_quantity_budgeted: 1000,
          total_quantity_executed: 500,
          physical_progress_percent: 50,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getProjectPhysicalDetails(
        'company-1',
        'project-1',
      );

      expect(result).toEqual(mockResult[0]);
    });

    it('should return null when no project found', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getProjectPhysicalDetails(
        'company-1',
        'project-1',
      );

      expect(result).toBeNull();
    });
  });

  describe('getProjectClashHealth', () => {
    it('should return clash health for specific project', async () => {
      const mockResult = [
        {
          project_id: 'project-1',
          total_clashes: 100,
          pending_clashes: 20,
          resolved_clashes: 80,
          resolution_rate_percent: 80,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockResult);

      const result = await service.getProjectClashHealth(
        'company-1',
        'project-1',
      );

      expect(result).toEqual(mockResult[0]);
    });

    it('should return null when no project found', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getProjectClashHealth(
        'company-1',
        'project-1',
      );

      expect(result).toBeNull();
    });
  });

  describe('getCashflow', () => {
    it('should return cashflow data for company with empty results', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getCashflow('company-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return cashflow with time series', async () => {
      const mockProjectResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          total_budgeted: 100000,
          total_expenses: 30000,
          total_worker_payments: 20000,
          total_spent: 50000,
          available: 50000,
          utilization_percent: 50,
          calculated_at: new Date(),
        },
      ];
      const mockTimeSeries: any[] = [];

      mockDataSource.query
        .mockResolvedValueOnce(mockProjectResult)
        .mockResolvedValueOnce(mockTimeSeries);

      const result = await service.getCashflow('company-1');

      expect(result).toHaveLength(1);
      expect(result[0].project_name).toBe('Test Project');
      expect(result[0].time_series).toEqual(mockTimeSeries);
    });
  });

  describe('getProjectCashflow', () => {
    it('should return cashflow for specific project', async () => {
      const mockResult = [
        {
          company_id: 'company-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          total_budgeted: 100000,
          total_expenses: 30000,
          total_worker_payments: 20000,
          total_spent: 50000,
          available: 50000,
          utilization_percent: 50,
          calculated_at: new Date(),
        },
      ];
      mockDataSource.query
        .mockResolvedValueOnce(mockResult)
        .mockResolvedValueOnce([]);

      const result = await service.getProjectCashflow('company-1', 'project-1');

      expect(result).not.toBeNull();
      expect(result?.project_name).toBe('Test Project');
    });

    it('should return null when no project found', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      const result = await service.getProjectCashflow('company-1', 'project-1');

      expect(result).toBeNull();
    });
  });

  describe('getLaborProductivity', () => {
    it('should return empty array on error', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.getLaborProductivity('company-1');

      expect(result).toEqual([]);
    });
  });

  describe('getComplianceSummary', () => {
    it('should return default values on error', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.getComplianceSummary('company-1');

      expect(result.total_subcontractors).toBe(0);
      expect(result.compliance_rate_percent).toBe(0);
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
