import { Test, TestingModule } from '@nestjs/testing';
import { BimApuLinkController } from './bim-apu-link.controller';
import { BimApuLinkService } from './bim-apu-link.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockService = {
  linkElement: jest.fn(),
  getLinksByProject: jest.fn(),
  getLinksByItem: jest.fn(),
};

const mockAuthGuard = { canActivate: () => true };

describe('BimApuLinkController', () => {
  let controller: BimApuLinkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BimApuLinkController],
      providers: [{ provide: BimApuLinkService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BimApuLinkController>(BimApuLinkController);
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should link element', async () => {
      const dto = {
        project_id: 'proj-1',
        item_id: 'item-1',
        ifc_global_id: 'ifc-1',
      };
      mockService.linkElement.mockResolvedValue({ id: 'link-1' });

      const user = { company_id: 'company-1', id: 'user-1' };
      const result = await controller.linkElement(user, dto);

      expect(mockService.linkElement).toHaveBeenCalledWith(
        'company-1',
        dto,
        'user-1',
      );
      expect(result.success).toBe(true);
    });

    it('should handle link error', async () => {
      mockService.linkElement.mockRejectedValue(new Error('Duplicate'));
      const user = { company_id: 'company-1', id: 'user-1' };
      await expect(
        controller.linkElement(user, {
          project_id: 'p1',
          item_id: 'i1',
          ifc_global_id: 'i1',
        } as any),
      ).rejects.toThrow();
    });
  });

  describe('GET /project/:project_id', () => {
    it('should get links by project', async () => {
      mockService.getLinksByProject.mockResolvedValue([{ id: 'link-1' }]);

      const user = { company_id: 'company-1' };
      const result = await controller.getLinksByProject(user, 'proj-1');

      expect(mockService.getLinksByProject).toHaveBeenCalledWith(
        'company-1',
        'proj-1',
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle get project links error', async () => {
      mockService.getLinksByProject.mockRejectedValue(new Error('Not found'));
      const user = { company_id: 'company-1' };
      await expect(
        controller.getLinksByProject(user, 'proj-1'),
      ).rejects.toThrow();
    });
  });

  describe('GET /item/:item_id', () => {
    it('should get links by item', async () => {
      mockService.getLinksByItem.mockResolvedValue([{ id: 'link-1' }]);

      const user = { company_id: 'company-1' };
      const result = await controller.getLinksByItem(user, 'item-1');

      expect(mockService.getLinksByItem).toHaveBeenCalledWith(
        'company-1',
        'item-1',
      );
      expect(result.success).toBe(true);
    });
  });
});
