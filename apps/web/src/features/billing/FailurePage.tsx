import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCcw, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function FailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center relative z-10 shadow-2xl"
      >
        <div className="relative inline-block mb-6">
          <motion.div
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="bg-rose-500/20 p-4 rounded-full"
          >
            <XCircle className="w-16 h-16 text-rose-400" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Algo salió mal
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          No pudimos procesar tu pago en este momento. No se ha realizado ningún cargo a tu cuenta.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Intentar de nuevo
          </button>
          
          <button
            onClick={() => window.open('mailto:soporte@bmbuildmanage.com')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            Contactar soporte
          </button>
        </div>

        <p className="mt-8 text-slate-500 text-sm">
          Si el problema persiste, verifica que tu tarjeta tenga fondos suficientes o contacta a tu banco.
        </p>
      </motion.div>
    </div>
  );
}
