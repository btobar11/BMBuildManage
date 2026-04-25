import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Analytics tracking could go here
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center relative z-10 shadow-2xl"
      >
        <div className="relative inline-block mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="bg-emerald-500/20 p-4 rounded-full relative z-10"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </motion.div>
          
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-400 rounded-full blur-xl"
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
          ¡Pago Exitoso! <PartyPopper className="text-yellow-400 w-8 h-8" />
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Tu suscripción ha sido activada correctamente. Ahora tienes acceso total a las herramientas premium de BMBuildManage.
        </p>

        {paymentId && (
          <div className="bg-slate-800/50 rounded-xl p-3 mb-8 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">ID de Transacción</p>
            <p className="text-slate-300 font-mono text-sm">{paymentId}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
          >
            Ir al Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-slate-500 text-sm">
            Hemos enviado un comprobante a tu correo electrónico.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
