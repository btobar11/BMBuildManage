import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { ExportService } from './export.service';
import { PDFExportService } from './pdf-export.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockBudgetsService = {
  create: jest.fn(),
  findAllByProject: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  setActiveVersion: jest.fn(),
  getSummary: jest.fn(),
  createRevision: jest.fn(),
  bulkCreateItems: jest.fn(),
};

const mockExportService = {
  exportBudgetToExcel: jest.fn().mockResolvedValue(Buffer.from('test')),
};

const mockPdfExportService = {
  generateBudgetPDF: jest.fn().mockResolvedValue(Buffer.from('test')),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('BudgetsController', () => {
  let controller: BudgetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        { provide: BudgetsService, useValue: mockBudgetsService },
        { provide: ExportService, useValue: mockExportService },
        { provide: PDFExportService, useValue: mockPdfExportService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BudgetsController>(BudgetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return budgets by project_id', async () => {
      const mockBudgets = [{ id: 'budget-1' }, { id: 'budget-2' }];
      mockBudgetsService.findAllByProject.mockResolvedValue(mockBudgets);

      const result = await controller.findAll('project-1');

      expect(mockBudgetsService.findAllByProject).toHaveBeenCalledWith(
        'project-1',
      );
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('create', () => {
    it('should create a budget', async () => {
      const createDto = { project_id: 'project-1', name: 'Test Budget' };
      const mockBudget = { id: 'budget-1', ...createDto };
      mockBudgetsService.create.mockResolvedValue(mockBudget);

      const result = await controller.create(createDto, {
        user: { id: 'user-1' },
      });

      expect(mockBudgetsService.create).toHaveBeenCalledWith(
        createDto,
        'user-1',
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('findOne', () => {
    it('should return a budget by id', async () => {
      const mockBudget = { id: 'budget-1', name: 'Test Budget' };
      mockBudgetsService.findOne.mockResolvedValue(mockBudget);

      const result = await controller.findOne('budget-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const updateDto = { name: 'Updated Budget' } as any;
      const mockBudget = { id: 'budget-1', ...updateDto };
      mockBudgetsService.update.mockResolvedValue(mockBudget);

      const result = await controller.update('budget-1', updateDto, {
        user: { id: 'user-1' },
      });

      expect(mockBudgetsService.update).toHaveBeenCalledWith(
        'budget-1',
        updateDto,
        'user-1',
        undefined,
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('remove', () => {
    it('should remove a budget', async () => {
      mockBudgetsService.remove.mockResolvedValue({ id: 'budget-1' });

      const result = await controller.remove('budget-1');

      expect(mockBudgetsService.remove).toHaveBeenCalledWith('budget-1');
      expect(result).toEqual({ id: 'budget-1' });
    });
  });

  describe('setActive', () => {
    it('should activate budget version', async () => {
      mockBudgetsService.setActiveVersion.mockResolvedValue({
        id: 'budget-1',
        is_active: true,
      });

      const result = await controller.setActive('budget-1', {
        user: { id: 'user-1' },
      });

      expect(mockBudgetsService.setActiveVersion).toHaveBeenCalledWith(
        'budget-1',
        'user-1',
        undefined,
      );
      expect(result).toEqual({ id: 'budget-1', is_active: true });
    });
  });

  describe('getSummary', () => {
    it('should return budget summary', async () => {
      const summary = { total: 1000, items: 10 };
      mockBudgetsService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary('project-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockBudgetsService.getSummary).toHaveBeenCalledWith(
        'project-1',
        'company-1',
      );
      expect(result).toEqual(summary);
    });
  });

  describe('exportPdf', () => {
    it('should export budget as PDF with safe name', async () => {
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      mockBudgetsService.findOne.mockResolvedValue({
        id: 'budget-1',
        version: 2,
        project: { name: 'Test Project' },
      });
      mockPdfExportService.generateBudgetPDF.mockResolvedValue(
        Buffer.from('PDF content'),
      );

      await controller.exportPdf(
        'budget-1',
        { user: { company_id: 'company-1' } },
        mockRes as any,
      );

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(mockPdfExportService.generateBudgetPDF).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining(
            'Presupuesto_Test_Project_v2.pdf',
          ),
        }),
      );
    });

    it('should use fallback name when project name is null', async () => {
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      mockBudgetsService.findOne.mockResolvedValue({
        id: 'budget-1',
        version: 1,
        project: null,
      });
      mockPdfExportService.generateBudgetPDF.mockResolvedValue(
        Buffer.from('PDF'),
      );

      await controller.exportPdf(
        'budget-1',
        { user: { company_id: 'company-1' } },
        mockRes as any,
      );

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining(
            'Presupuesto_presupuesto_v1.pdf',
          ),
        }),
      );
    });

    it('should sanitize special characters in project name', async () => {
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      mockBudgetsService.findOne.mockResolvedValue({
        id: 'budget-1',
        version: 3,
        project: { name: 'Test Project 2024!@#$' },
      });
      mockPdfExportService.generateBudgetPDF.mockResolvedValue(
        Buffer.from('X'),
      );

      await controller.exportPdf(
        'budget-1',
        { user: { company_id: 'company-1' } },
        mockRes as any,
      );

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': expect.stringContaining(
            'Presupuesto_Test_Project_2024_____v3.pdf',
          ),
        }),
      );
    });
  });

  describe('exportExcel', () => {
    it('should export budget as Excel with safe name', async () => {
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      mockBudgetsService.findOne.mockResolvedValue({
        id: 'budget-1',
        version: 2,
        project: { name: 'My Budget' },
      });
      mockExportService.exportBudgetToExcel.mockResolvedValue(
        Buffer.from('excel'),
      );

      await controller.exportExcel(
        'budget-1',
        { user: { company_id: 'company-1' } },
        mockRes as any,
      );

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(mockExportService.exportBudgetToExcel).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining(
            'Presupuesto_My_Budget_v2.xlsx',
          ),
        }),
      );
    });

    it('should use fallback name when project name is null', async () => {
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
      mockBudgetsService.findOne.mockResolvedValue({
        id: 'budget-1',
        version: 1,
        project: null,
      });
      mockExportService.exportBudgetToExcel.mockResolvedValue(
        Buffer.from('XLS'),
      );

      await controller.exportExcel(
        'budget-1',
        { user: { company_id: 'company-1' } },
        mockRes as any,
      );

      expect(mockBudgetsService.findOne).toHaveBeenCalledWith(
        'budget-1',
        'company-1',
      );
      expect(mockExportService.exportBudgetToExcel).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining(
            'Presupuesto_presupuesto_v1.xlsx',
          ),
        }),
      );
    });
  });

  describe('createRevision', () => {
    it('should create a budget revision', async () => {
      const revision = { id: 'rev-1', budget_id: 'budget-1' };
      mockBudgetsService.createRevision.mockResolvedValue(revision);

      const result = await controller.createRevision('budget-1', {
        user: { id: 'user-1', company_id: 'company-1' },
      });

      expect(mockBudgetsService.createRevision).toHaveBeenCalledWith(
        'budget-1',
        'user-1',
        'company-1',
      );
      expect(result).toEqual(revision);
    });

    it('should throw HttpException on error with stack trace', async () => {
      const error = new Error('Revision failed');
      mockBudgetsService.createRevision.mockRejectedValue(error);

      try {
        await controller.createRevision('budget-1', {
          user: { id: 'user-1', company_id: 'company-1' },
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(500);
        expect(e.getResponse().error).toContain('Revision failed');
      }
    });

    it('should handle non-Error exceptions', async () => {
      mockBudgetsService.createRevision.mockRejectedValue('Unknown error');

      try {
        await controller.createRevision('budget-1', {
          user: { id: 'user-1', company_id: 'company-1' },
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e.status).toBe(500);
      }
    });
  });

  describe('bulkCreateItems', () => {
    it('should bulk create items', async () => {
      const items = [
        {
          stage_id: 'stage-1',
          name: 'Item 1',
          quantity: 10,
          unit: 'm2',
          unit_cost: 100,
          unit_price: 150,
          position: 1,
        },
      ];
      mockBudgetsService.bulkCreateItems.mockResolvedValue([{ id: 'item-1' }]);

      const result = await controller.bulkCreateItems('budget-1', {
        items,
      } as any);

      expect(mockBudgetsService.bulkCreateItems).toHaveBeenCalledWith(
        'budget-1',
        items,
      );
      expect(result).toEqual([{ id: 'item-1' }]);
    });
  });
});
