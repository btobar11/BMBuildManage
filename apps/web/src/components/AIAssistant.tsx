'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Zap, User, ChevronDown, Loader2 } from 'lucide-react';
import { useAIChat } from '../hooks/useAIAssistant';
import { useAuth } from '../context/AuthContext';

// =====================================================
// Types
// =====================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionable?: boolean;
  suggestedActions?: string[];
  data?: unknown;
  type?: 'text' | 'chart' | 'table' | 'action';
  isLoading?: boolean;
  error?: string;
}

interface AIAssistantProps {
  budgetId?: string;
  projectContext?: {
    id?: string;
    name: string;
    location?: string;
  };
}

// =====================================================
// Constants
// =====================================================

const QUICK_ACTIONS = [
  { label: 'Estado proyectos', prompt: '¿Cómo están todos mis proyectos?' },
  { label: 'Presupuesto total', prompt: 'Dame el presupuesto total de todos los proyectos' },
  { label: 'Workers', prompt: '¿Cuántos trabajadores tengo y cuáles son sus roles?' },
  { label: 'Predecir', prompt: '¿Hay algún proyecto en riesgo de retraso?' },
  { label: 'Recomendaciones', prompt: '¿Qué recomendaciones tienes para mis proyectos?' },
];

const VECTOR_CAPABILITIES = [
  '📊 Análisis de proyectos y presupuestos',
  '💰 Control de costos y desviaciones',
  '👷 Gestión de trabajadores',
  '📅 Cronogramas y retrasos',
  '🔮 Predicciones con AI',
  '📈 Reportes ejecutivos',
  '⚡ Recomendaciones automáticas',
  '🎯 Optimización de recursos',
];

// =====================================================
// Emerald Thinking Indicator
// =====================================================

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-9 h-9">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        {/* Inner icon */}
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Bot size={16} className="text-white" />
        </div>
      </div>
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl rounded-bl-md px-4 py-3 border border-emerald-500/10">
        <div className="flex items-center gap-2">
          {/* Emerald wave dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <span className="text-xs text-emerald-400/80 font-medium ml-1">Analizando...</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function VectorAI({ budgetId, projectContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { company } = useAuth();

  const chatMutation = useAIChat({
    companyId: company?.id || '',
    projectId: projectContext?.id,
    budgetId,
  });

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy Vector, tu asistente de construcción inteligente.\n\nPuedo ayudarte a analizar proyectos, presupuestos, trabajadores y predecir resultados. ¿Qué necesitas saber?',
        timestamp: new Date(),
        type: 'text',
        suggestedActions: ['Estado de proyectos', 'Análisis de presupuesto', 'Recomendaciones'],
      }]);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || chatMutation.isPending) return;
    if (!company?.id) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Por favor inicia sesión para usar el asistente de IA.',
        timestamp: new Date(),
        error: 'No autenticado',
      }]);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');

    try {
      const result = await chatMutation.mutateAsync(messageText);

      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        actionable: result.actionable,
        suggestedActions: result.suggestedActions,
        data: result.data,
        type: 'text',
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, tuve un problema al procesar tu solicitud. Por favor intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [input, chatMutation, company?.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const isLoading = chatMutation.isPending;

  // ─── Floating Button ───────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl group-hover:bg-emerald-500/40 transition-colors" />
          {/* Button */}
          <div
            className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center text-white"
          >
            <Sparkles size={24} />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
      </motion.button>
    );
  }

  // ─── Chat Panel ────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-6 right-6 w-[420px] z-50 flex flex-col overflow-hidden transition-all duration-300 rounded-2xl ${
          isMinimized ? 'h-16' : 'h-[600px]'
        }`}
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(16, 185, 129, 0.12)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.06), 0 0 40px rgba(16, 185, 129, 0.05)',
        }}
      >
        {/* Header — Emerald Gradient */}
        <div
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none"
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Vector</h3>
              <p className="text-[11px] text-emerald-400/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Online • BM Build Manage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCapabilities(!showCapabilities);
              }}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-emerald-400/60 hover:text-emerald-400"
              title="Capacidades"
            >
              <Zap size={16} />
            </button>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Capabilities Panel */}
        <AnimatePresence>
          {showCapabilities && !isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="px-4 py-3"
                style={{
                  background: 'rgba(16, 185, 129, 0.04)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
                }}
              >
                <p className="text-[10px] font-semibold text-emerald-400/60 mb-2.5 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap size={10} />
                  Capacidades
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {VECTOR_CAPABILITIES.map((cap, idx) => (
                    <div key={idx} className="text-[11px] text-slate-400 px-2 py-1 rounded-md hover:bg-white/[0.03] transition-colors">
                      {cap}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant avatar */}
                  {msg.role === 'assistant' && !msg.isLoading && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-md text-white'
                        : 'rounded-bl-md text-slate-200'
                    } ${msg.error ? 'border-red-500/20' : ''}`}
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                          }
                        : {
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(51, 65, 85, 0.4)',
                            backdropFilter: 'blur(8px)',
                          }
                    }
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Suggested actions */}
                    {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06]">
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">
                          Sugerencias
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(action)}
                              className="text-[11px] px-3 py-1.5 rounded-lg text-emerald-400 transition-all duration-150 hover:scale-[1.02]"
                              style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                              }}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-slate-300" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div
              className="px-4 py-2.5"
              style={{
                borderTop: '1px solid rgba(51, 65, 85, 0.3)',
                background: 'rgba(15, 23, 42, 0.4)',
              }}
            >
              <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-medium">
                <Zap size={10} className="text-emerald-500/60" />
                Acciones rápidas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.slice(0, 3).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                    className="text-[11px] px-3 py-1.5 rounded-lg text-slate-400 transition-all duration-150 disabled:opacity-30 hover:text-emerald-400"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(51, 65, 85, 0.4)',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div
              className="p-4"
              style={{
                borderTop: '1px solid rgba(51, 65, 85, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
              }}
            >
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Pregunta a Vector..."
                  disabled={isLoading || !company?.id}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(51, 65, 85, 0.4)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || !company?.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%)',
                    boxShadow: input.trim() ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-600 mt-2.5 text-center flex items-center justify-center gap-1.5">
                <Bot size={10} className="text-emerald-500/50" />
                Vector AI • BMBuildManage
              </p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default VectorAI;