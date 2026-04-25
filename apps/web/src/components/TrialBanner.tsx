import { useSubscription } from '../context/SubscriptionContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TrialBanner() {
  const { subscription, isTrialActive } = useSubscription();

  if (!isTrialActive || !subscription?.trial_ends_at) return null;

  const daysLeft = formatDistanceToNow(new Date(subscription.trial_ends_at), {
    locale: es,
    addSuffix: false,
  });

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between sm:px-6 lg:px-8">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-5 w-5 text-yellow-300" />
        <p className="text-sm font-medium">
          Estás en tu periodo de prueba Enterprise. Quedan {daysLeft} de acceso ilimitado.
        </p>
      </div>
      <Link
        to="/pricing"
        className="flex items-center space-x-2 text-sm font-semibold hover:text-blue-100 transition-colors"
      >
        <span>Ver Planes</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
