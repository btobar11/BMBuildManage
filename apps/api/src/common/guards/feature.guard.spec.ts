import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { FeatureGuard } from './feature.guard';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';

describe('FeatureGuard', () => {
  let guard: FeatureGuard;
  let subscriptionsService: { hasFeature: jest.Mock };
  let reflector: Reflector;

  const createMockContext = (
    user: { company_id?: string } = { company_id: 'company-1' },
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    subscriptionsService = {
      hasFeature: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureGuard,
        Reflector,
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
      ],
    }).compile();

    guard = module.get<FeatureGuard>(FeatureGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow when no features required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const result = await guard.canActivate(createMockContext());
    expect(result).toBe(true);
  });

  it('should allow when empty features array', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const result = await guard.canActivate(createMockContext());
    expect(result).toBe(true);
  });

  it('should allow when feature is available', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['bim_viewer']);
    subscriptionsService.hasFeature.mockResolvedValue(true);
    const result = await guard.canActivate(createMockContext());
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when feature not available', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['bim_viewer']);
    subscriptionsService.hasFeature.mockResolvedValue(false);

    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should include feature info in error response', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ai_assistant']);
    subscriptionsService.hasFeature.mockResolvedValue(false);

    try {
      await guard.canActivate(createMockContext());
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse();
      expect(response).toHaveProperty('required_feature', 'ai_assistant');
      expect(response).toHaveProperty('upgrade_url', '/pricing');
    }
  });

  it('should throw when user has no company_id', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['projects']);
    const ctx = createMockContext({ company_id: undefined });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should check multiple features', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['apu', 'invoices_sii']);
    subscriptionsService.hasFeature
      .mockResolvedValueOnce(true) // apu
      .mockResolvedValueOnce(false); // invoices_sii

    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      ForbiddenException,
    );
  });
});
