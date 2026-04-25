import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_FEATURES_KEY } from '../decorators/require-feature.decorator';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { FeatureCode } from '../../modules/subscriptions/plan.constants';

/**
 * FeatureGuard — Validates that the company's subscription plan
 * includes the required feature(s) for the endpoint.
 *
 * Must be used AFTER SupabaseAuthGuard (needs request.user.company_id).
 *
 * Usage on controller:
 *   @UseGuards(SupabaseAuthGuard, FeatureGuard)
 *   @RequireFeature('bim_viewer')
 *   @Get()
 *   async getBimModels() { ... }
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<FeatureCode[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No features required → allow all authenticated users
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.company_id) {
      throw new ForbiddenException('User not associated with a company');
    }

    // Check each required feature against the subscription
    for (const feature of requiredFeatures) {
      const hasAccess = await this.subscriptionsService.hasFeature(
        user.company_id,
        feature,
      );

      if (!hasAccess) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'FEATURE_NOT_AVAILABLE',
          message: `Tu plan actual no incluye acceso a esta funcionalidad. Se requiere: ${feature}`,
          required_feature: feature,
          upgrade_url: '/pricing',
        });
      }
    }

    return true;
  }
}
