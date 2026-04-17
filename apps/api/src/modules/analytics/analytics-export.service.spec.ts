import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AnalyticsExportService } from './analytics-export.service';

describe('AnalyticsExportService', () => {
  let service: AnalyticsExportService;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsExportService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AnalyticsExportService>(AnalyticsExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExcelReport', () => {
    it('should generate Excel buffer for company', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          {
            project_id: 'p1',
            project_name: 'Project 1',
            total_budgeted: 1000000,
            total_spent: 500000,
            variance: 500000,
            percent_executed: 50,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.generateExcelReport(
        'company-1',
        'Test Company',
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate Excel with specific project filter', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          {
            project_id: 'p1',
            project_name: 'Project 1',
            total_budgeted: 1000000,
            total_spent: 500000,
            variance: 500000,
            percent_executed: 50,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.generateExcelReport(
        'company-1',
        'Test Company',
        'p1',
      );

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle empty data gracefully', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.generateExcelReport(
        'company-1',
        'Test Company',
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
