import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockSeedService = {
  seedDemoData: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'NODE_ENV') return 'development';
    return null;
  }),
};

describe('SeedController', () => {
  let controller: SeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        { provide: SeedService, useValue: mockSeedService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
