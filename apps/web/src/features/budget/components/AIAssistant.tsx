'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Bot, Sparkles
} from 'lucide-react';
import { CHILEAN_COSTS, type CostItem } from '../costLibrary';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  costItems?: CostItem[];
  analysis?: BudgetAnalysis;
}

interface BudgetAnalysis {
  totalCost: number;
  totalPrice: number;
  itemsCount: number;
  stagesCount: number;
  avgUnitPrice: number;
  topCategories: Array<{ category: string; total: number }>;
  recommendations: string[];
}

interface AIAssistantProps {
  budgetId?: string;
  projectContext?: {
    name: string;
    location?: string;
    stages?: Array<{ name: string; items?: Array<{ name: string; quantity: number; unit: string; unit_price?: number; unit_cost?: number }> }>;
  };
}

function analyzeBudget(context: AIAssistantProps['projectContext']): BudgetAnalysis | null {
  if (!context?.stages || context.stages.length === 0) return null;
  
  let totalCost = 0;
  let totalPrice = 0;
  let itemsCount = 0;
  const categoryTotals: Record<string, number> = {};
  
  for (const stage of context.stages) {
    for (const item of stage.items || []) {
      const cost = (item.quantity || 0) * (item.unit_cost || 0);
      const price = (item.quantity || 0) * (item.unit_price || 0);
      totalCost += cost;
      totalPrice += price;
      itemsCount++;
      
      const category = item.name.toLowerCase().includes('fierro') ? 'acero' :
                       item.name.toLowerCase().includes('hormón') || item.name.toLowerCase().includes('concreto') ? 'hormigon' :
                       item.name.toLowerCase().includes('cerámica') || item.name.toLowerCase().includes('piso') ? 'terminaciones' :
                       item.name.toLowerCase().includes('pintura') || item.name.toLowerCase().includes('estuco') ? 'muro' :
                       item.name.toLowerCase().includes('madera') || item.name.toLowerCase().includes('tabla') ? 'madera' :
                       'otros';
      categoryTotals[category] = (categoryTotals[category] || 0) + price;
    }
  }
  
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, total]) => ({ category, total }));
  
  const recommendations: string[] = [];
  if (totalPrice > 50000000) {
    recommendations.push('Considera pedir cotizaciones de proveedores para mejores precios');
  }
  if (itemsCount < 10) {
    recommendations.push('El presupuesto parece muy pequeño, revisa que no falten partidas');
  }
  if (!topCategories.find(c => c.category === 'hormigon')) {
    recommendations.push('No detected gastos de hormón, verifica si corresponde');
  }
  
  return {
    totalCost,
    totalPrice,
    itemsCount,
    stagesCount: context.stages.length,
    avgUnitPrice: itemsCount > 0 ? totalPrice / itemsCount : 0,
    topCategories,
    recommendations,
  };
}

function generateResponse(query: string, projectContext?: AIAssistantProps['projectContext']): { content: string; suggestions: string[]; costItems?: CostItem[]; analysis?: BudgetAnalysis } {
  const q = query.toLowerCase();
  
  if (q.includes('hormón') || q.includes('hormigon') || q.includes('concreto')) {
    const items = CHILEAN_COSTS.filter(i => i.name.toLowerCase().includes('hormón'));
    return {
      content: 'Para obra gruesa te recomiendo:\n• Hormón G25: $105.000/m3 (resistencia estándar)\n• Hormón G30: $120.000/m3 (mayor resistencia)\n\nPara calcular el volumen: largo × ancho × alto = m3 necesarios. ¿Necesitas ayuda con la cubicación?',
      suggestions: ['Calcular volumen de hormón', 'Precios de cemento', 'Costo.foundation'],
      costItems: items,
    };
  }
  
  if (q.includes('fierro') || q.includes('acero') || q.includes('barras')) {
    const items = CHILEAN_COSTS.filter(i => i.category === 'material' && i.name.toLowerCase().includes('fierro'));
    return {
      content: 'Precios de fierrería:\n• Ø10mm: $1.050/kg\n• Ø12mm: $1.020/kg\n• Ø16mm: $1.000/kg\n\nPara losa de entrepiso usa Ø10mm cada 20cm. Para columnas, Ø12mm mínimo.',
      suggestions: ['Calcular peso de fierro', 'Mallas electrosoldadas', 'Estribos'],
      costItems: items,
    };
  }
  
  if (q.includes('piso') || q.includes('cerámica') || q.includes('porcelanato') || q.includes('pavimento')) {
    const items = CHILEAN_COSTS.filter(i => 
      i.name.toLowerCase().includes('piso') || 
      i.name.toLowerCase().includes('cerámica') ||
      i.name.toLowerCase().includes('porcelanato')
    );
    return {
      content: 'Opciones de pavimento:\n• Cerámica 30x30: $10.500/m2 (económica)\n• Cerámica 40x40: $12.000/m2\n• Porcelanato 60x60: $18.000/m2 (premium)\n• Piso flotante: $15.500/m2\n\nConsidera +10% por pérdida de corte.',
      suggestions: ['Calcular m2 por ambiente', 'Pegamento para cerámica', 'Porcelanato importado'],
      costItems: items,
    };
  }
  
  if (q.includes('techumbre') || q.includes('techo') || q.includes('cubierta')) {
    const items = CHILEAN_COSTS.filter(i => 
      i.name.toLowerCase().includes('teja') || 
      i.name.toLowerCase().includes('plancha') ||
      i.name.toLowerCase().includes('techumbre')
    );
    return {
      content: 'Sistemas de techumbre:\n• Teja asfáltica: $10.500/m2\n• Plancha zinc 3x1m: $34.000/un\n• Fibrolit 6mm: $22.000/un\n\nIncluye aislación térmica y barreras de humedad.',
      suggestions: ['Calcular pendiente techo', 'Bajadas pluviales', 'Aislación'],
      costItems: items,
    };
  }
  
  if (q.includes('pintura') || q.includes('muro') || q.includes('pared')) {
    const items = CHILEAN_COSTS.filter(i => 
      i.name.toLowerCase().includes('pintura') || 
      i.name.toLowerCase().includes('estuco') ||
      i.name.toLowerCase().includes('cerámica mural')
    );
    return {
      content: 'Sistemas de terminación mural:\n• Pintura látex interior: $15.000/galón (rinde 35m2)\n• Pintura látex exterior: $18.500/galón\n• Estuco interior: $8.000/saco 25kg\n• Cerámica mural 20x30: $8.500/m2\n\nRendimiento: 1 galón ≈ 35m2 por mano.',
      suggestions: ['Calcular pintura por m2', 'Estuco exterior', 'Sellador'],
      costItems: items,
    };
  }
  
  if (q.includes('calcul') || q.includes('cuánto') || q.includes('cuanto')) {
    const numbers = query.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        content: `Según los números que mencionas (${numbers.join(', ')}), puedo ayudarte a calcular. ¿Qué tipo de cálculo necesitas?\n\n• Cubicación (m³): largo × ancho × alto\n• Área (m²): largo × ancho\n• Peso de materiales: volumen × densidad\n\nDime específicamente qué necesitas calcular.`,
        suggestions: ['Calcular hormón', 'Calcular fierro', 'Calcular pintura'],
      };
    }
    return {
      content: 'Puedo ayudarte a calcular:\n• Cubicaciones de hormón, excavación, relleno\n• Áreas de pintura, cerámica, piso\n• Cantidades de materiales por m2\n• Costos totales con markups\n\n¿ Qué necesitas calcular?',
      suggestions: ['Costo total obra', 'Cantidad de ladrillos', 'Presupuesto rápido'],
    };
  }
  
  if (q.includes('presupuesto') || q.includes('costo') || q.includes('precio') || q.includes('analiz')) {
    const analysis = projectContext ? analyzeBudget(projectContext) : null;
    
    if (analysis) {
      return {
        content: `Análisis de tu presupuesto "${projectContext?.name}":\n\n📊 **Resumen:**\n• ${analysis.itemsCount} partidas en ${analysis.stagesCount} etapas\n• Costo total: $${analysis.totalCost.toLocaleString('es-CL')}\n• Precio total: $${analysis.totalPrice.toLocaleString('es-CL')}\n\n📈 **Por categoría:**\n${analysis.topCategories.map(c => `• ${c.category}: $${c.total.toLocaleString('es-CL')}`).join('\n')}\n\n💡 **Recomendaciones:**\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}`,
        suggestions: ['Calcular margen', 'Comparar con mercado', 'Optimizar costos'],
        analysis,
      };
    }
    
    return {
      content: 'Para presupuestos en Chile uso esta estructura:\n\n**Costo Directo** (materiales + mano de obra)\n**Gastos Generales** (12-15%): oficinas, permisos, imprevistos\n**Utilidad** (10-18%): margen del constructor\n**IVA** (19%): se suma al final\n\n¿Te gustaría que calcule un presupuesto o que revise el actual?',
      suggestions: ['Calcular presupuesto', 'Markups típicos', 'Margen de utilidad'],
    };
  }
  
  if (q.includes('recomiend') || q.includes('suger') || q.includes('mejor')) {
    const items = CHILEAN_COSTS.slice(0, 8);
    return {
      content: 'Estos son los materiales más usados en construcción chilena:',
      suggestions: ['Materiales obra gruesa', 'Terminaciones piso', 'Techumbre'],
      costItems: items,
    };
  }
  
  return {
    content: `Entendido: "${query}"\n\nSoy tu asistente de construcción. Puedo ayudarte con:\n\n• **Precios de materiales** - Consulta cualquier item de construcción\n• **Cálculos** - Cubicaciones, áreas, cantidades\n• **Presupuestos** - Estructura de costos chilena\n• **Recomendaciones** - Mejores materiales según uso\n\n¿En qué puedo ayudarte hoy?`,
    suggestions: ['Precios de hormón', 'Costos de terminaciones', 'Calcular presupuesto'],
  };
}

export function AIAssistant({ budgetId: _budgetId, projectContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: '¡Hola! Soy tu asistente de construcción de BM Build Manage. ¿En qué puedo ayudarte hoy?\n\nPuedo darte información sobre precios de materiales, ayudarte con cálculos de cubicación, o recomendarte materiales para tu proyecto.',
    suggestions: ['Precios de materiales', 'Calcular presupuesto', 'Recomendaciones'],
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      const response = generateResponse(input, projectContext);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        suggestions: response.suggestions,
        costItems: response.costItems,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-110"
        title="Asistente IA"
      >
        <Sparkles size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-emerald-600 to-emerald-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Asistente IA</h3>
                  <p className="text-xs text-white/70">Construcción Chile</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-br-sm' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    
                    {msg.costItems && msg.costItems.length > 0 && (
                      <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Precios de referencia:</p>
                        <div className="space-y-1">
                          {msg.costItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-slate-300">{item.name}</span>
                              <span className="text-emerald-400 font-mono">${item.unitPrice.toLocaleString('es-CL')}/{item.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(sug)}
                            className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregunta sobre materiales, costos..."
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-full transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAssistant;
