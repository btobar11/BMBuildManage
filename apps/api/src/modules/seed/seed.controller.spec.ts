import { Test, TestingModule } from '@nestjs/testing';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

const mockSeedService = {
  seedDemoData: jest.fn(),
};

describe('SeedController', () => {
  let controller: SeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [{ provide: SeedService, useValue: mockSeedService }],
    }).compile();

    controller = module.get<SeedController>(SeedController);
    jest.clearAllMocks();
  });

  describe('seed', () => {
    it('should call seedDemoData', async () => {
      mockSeedService.seedDemoData.mockResolvedValue({ seeded: true });
      const result = await controller.seed();
      expect(mockSeedService.seedDemoData).toHaveBeenCalled();
      expect(result).toEqual({ seeded: true });
    });
  });

  describe('status', () => {
    it('should return ready status', async () => {
      const result = await controller.status();
      expect(result).toEqual({ status: 'Seed system ready' });
    });
  });
});