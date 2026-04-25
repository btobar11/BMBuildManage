import { type ReactNode, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { UpgradeModal } from './UpgradeModal';
import type { FeatureCode } from '../lib/plan.constants';

interface FeatureGateProps {
  feature: FeatureCode;
  children: ReactNode;
  /**
   * What to render when the feature is locked.
   * - 'hide': render nothing
   * - 'blur': render children with blur overlay
   * - 'replace': render fallback instead
   */
  mode?: 'hide' | 'blur' | 'replace';
  fallback?: ReactNode;
}

/**
 * FeatureGate — Declarative component to gate UI sections by feature.
 *
 * Usage:
 *   <FeatureGate feature="bim_viewer" mode="blur">
 *     <BimViewer />
 *   </FeatureGate>
 *
 *   <FeatureGate feature="ai_assistant" mode="hide">
 *     <AIButton />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  mode = 'hide',
  fallback,
}: FeatureGateProps) {
  const { hasFeature } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const allowed = hasFeature(feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  if (mode === 'replace' && fallback) {
    return <>{fallback}</>;
  }

  // mode === 'blur'
  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-lg">
          <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Desbloquear
            </span>
          </div>
        </div>
      </div>
      {showModal && (
        <UpgradeModal feature={feature} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
