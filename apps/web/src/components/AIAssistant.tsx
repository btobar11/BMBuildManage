import { useState, useRef, useEffect } from 'react';
import { X, Send, Cpu, User, ChevronDown, Loader2, Zap, Command } from 'lucide-react';
import api from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionable?: boolean;
  suggestedActions?: string[];
  data?: any;
  type?: 'text' | 'chart' | 'table' | 'action';
}

interface AIResponse {
  answer: string;
  data?: any;
  confidence: number;
  actionable?: boolean;
  suggestedActions?: string[];
}

const QUICK_ACTIONS = [
  { label: 'Estado proyectos', prompt: '¿Cómo están todos mis proyectos?' },
  { label: 'Presupuesto total', prompt: 'Dame el presupuesto total de todos los proyectos' },
  { label: 'Workers', prompt: '¿Cuántos trabajadores tengo y cuáles son sus roles?' },
  { label: 'Predecir', prompt: '¿Hay algún proyecto en riesgo de retraso?' },
  { label: 'Recomendaciones', prompt: '¿Qué recomendaciones tienes para mis proyectos?' },
  { label: 'Gastos recientes', prompt: '¿Cuáles son los últimos gastos registrados?' },
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

export function VectorAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
// Auth context available via context if needed
// useAuth; // Evitar advertencia de variable no utilizada

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '¡Hola! Soy *Vector*, tu asistente de construcción inteligente.\n\nPuedo ayudarte a analizar proyectos, presupuestos, trabajadores y predecir resultados. ¿Qué necesitas saber?',
          timestamp: new Date(),
          type: 'text',
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'text',
    };

      setMessages((prev) => [...prev, userMessage]);
      if (!overrideInput) setInput('');
      setIsLoading(true);

      try {
        const response = await api.post<AIResponse>('/ai/query', {
          query: messageText,
        });

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
          actionable: response.data.actionable,
          suggestedActions: response.data.suggestedActions,
          data: response.data.data,
          type: 'text',
        };

        setMessages((prev) => [...prev, aiResponse]);
      } catch (error: any) {
        console.error('[Vector] Error:', error);
        let errorContent = 'Lo siento, tuve un problema al procesar tu solicitud. Por favor intenta de nuevo.';
        
        if (error.response?.status === 400) {
          const message = error.response?.data?.message;
          if (message?.includes('query')) {
            errorContent = 'Por favor ingresa una pregunta válida.';
          } else if (message) {
            errorContent = `Error: ${message}`;
          }
        } else if (error.response?.status === 401) {
          errorContent = 'Tu sesión ha expirado. Por favor, cierra sesión y vuelve a entrar.';
        } else if (error.response?.status === 403) {
          errorContent = 'No tienes permiso para acceder a esta función.';
        } else if (error.message?.includes('conexión')) {
          errorContent = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
          type: 'text',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all z-40 animate-pulse-slow"
        style={{
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
        }}
      >
        <Cpu size={28} className="animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-[420px] bg-card border border-border/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            style={{
              boxShadow: '0 0 20px rgba(255,255,255,0.3)',
            }}
          >
            <Cpu size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base">Vector</h3>
            <p className="text-xs text-white/70 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCapabilities(!showCapabilities);
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Capabilidades"
          >
            <Zap size={18} />
          </button>
          <ChevronDown
            size={18}
            className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Capabilities Panel */}
      {showCapabilities && !isMinimized && (
        <div className="bg-gradient-to-r from-indigo-600/10 to-pink-500/10 p-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Zap size={12} />
            Capacidades de Vector
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VECTOR_CAPABILITIES.map((cap, idx) => (
              <div key={idx} className="text-xs text-muted-foreground">
                {cap}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div 
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0"
                    style={{
                      boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Cpu size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                      : 'bg-muted/80 text-foreground rounded-bl-md border border-border/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  
                  {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Command size={12} />
                        Sugerencias:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(action)}
                            className="text-xs px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-foreground border border-indigo-500/20 rounded-full transition-all hover:scale-105"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div 
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Cpu size={16} className="text-white animate-pulse" />
                </div>
                <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    <span className="text-xs text-muted-foreground">Analizando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Zap size={12} className="text-indigo-500" />
              Acciones rápidas:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.slice(0, 3).map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="text-xs px-3 py-1.5 bg-card border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-full transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta a Vector..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                style={{
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
              <Cpu size={12} className="text-indigo-500" />
              Vector AI • BMBuildManage
            </p>
          </div>
        </>
      )}
    </div>
  );
}