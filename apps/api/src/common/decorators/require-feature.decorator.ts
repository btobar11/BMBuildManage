import { SetMetadata } from '@nestjs/common';
import { FeatureCode } from '../../modules/subscriptions/plan.constants';

export const REQUIRED_FEATURES_KEY = 'required_features';

/**
 * Decorator to restrict endpoint access by feature code.
 * Works with FeatureGuard to check subscription plan.
 *
 * Usage:
 *   @RequireFeature('bim_viewer')
 *   @RequireFeature('invoices_sii', 'purchase_orders')
 */
export const RequireFeature = (...features: FeatureCode[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);
