import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function PendingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center relative z-10 shadow-2xl"
      >
        <div className="relative inline-block mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="bg-blue-500/20 p-4 rounded-full relative z-10"
          >
            <Clock className="w-16 h-16 text-blue-400" />
          </motion.div>
          
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-blue-500 rounded-full blur-2xl"
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Pago en proceso
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Estamos esperando la confirmación de tu pago. Esto puede tardar unos minutos dependiendo de tu método de pago.
        </p>

        <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700/50 flex items-center gap-4 text-left">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin shrink-0" />
          <p className="text-sm text-slate-300">
            No es necesario que te quedes en esta página. Te notificaremos por correo una vez que se complete.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  );
}
