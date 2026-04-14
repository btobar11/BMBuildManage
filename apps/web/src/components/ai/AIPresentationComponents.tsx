'use client';

import React from 'react';
import type { NLPQueryResult, AIInsight, BudgetAnalysisResult } from '../../hooks/useAIAssistant';

// =====================================================
// Componentes de Presentación - Separación de Concerns
// =====================================================

/**
 * Props para componentes de insight
 */
interface AIInsightCardProps {
  insight: AIInsight;
  onActionClick?: (action: string) => void;
}

/**
 * AIInsightCard - Presentación de un insight individual
 */
export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, onActionClick }) => {
  const typeStyles = {
    warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    opportunity: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    risk: 'bg-red-500/10 border-red-500/50 text-red-400',
    recommendation: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  };

  const typeIcons = {
    warning: '⚠️',
    opportunity: '💡',
    risk: '🚨',
    recommendation: '📋',
  };

  const impactStyles = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-slate-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${typeStyles[insight.type]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{typeIcons[insight.type]}</span>
          <span className="font-medium text-sm">{insight.title}</span>
        </div>
        {insight.impact && (
          <span className={`text-xs font-medium ${impactStyles[insight.impact]}`}>
            {insight.impact.toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-300 mb-2">{insight.description}</p>
      {insight.action && onActionClick && (
        <button
          onClick={() => onActionClick(insight.action!)}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {insight.action} →
        </button>
      )}
    </div>
  );
};

/**
 * AIResponseDisplay - Presentación de respuesta de chat
 */
export const AIResponseDisplay: React.FC<{ result: NLPQueryResult; onSuggestionClick?: (suggestion: string) => void }> = ({ 
  result, 
  onSuggestionClick 
}) => {
  return (
    <div className="space-y-4">
      {/* Respuesta principal */}
      <div className="text-sm text-slate-200 whitespace-pre-line">
        {result.answer}
      </div>

      {/* Fuentes */}
      {result.sources && result.sources.length > 0 && (
        <div className="text-xs text-slate-500">
          Fuentes: {result.sources.join(', ')}
        </div>
      )}

      {/* Confianza */}
      {result.confidence && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Confianza:</span>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
          <span>{Math.round(result.confidence * 100)}%</span>
        </div>
      )}

      {/* Sugerencias */}
      {result.suggestedActions && result.suggestedActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.suggestedActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick?.(action)}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * BudgetAnalysisDisplay - Presentación de análisis de presupuesto
 */
export const BudgetAnalysisDisplay: React.FC<{ analysis: BudgetAnalysisResult }> = ({ analysis }) => {
  const healthStyles = {
    healthy: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    critical: 'bg-red-500/10 border-red-500/50 text-red-400',
  };

  const healthLabels = {
    healthy: 'Saludable',
    warning: 'Advertencia',
    critical: 'Crítico',
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="text-sm text-slate-200">
        {analysis.summary}
      </div>

      {/* Estado de salud */}
      <div className={`p-3 rounded-lg border ${healthStyles[analysis.healthStatus]}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado: {healthLabels[analysis.healthStatus]}</span>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.keyInsights && analysis.keyInsights.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-500 mb-2 font-medium">Insights Clave</h4>
          <div className="space-y-2">
            {analysis.keyInsights.map((insight, idx) => (
              <AIInsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Variance Analysis */}
      {analysis.varianceAnalysis && (
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <h4 className="text-xs text-slate-500 mb-2 font-medium">Análisis de Desviación</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Desviación total:</span>
              <span className={`ml-2 font-medium ${
                analysis.varianceAnalysis.totalVariance > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {analysis.varianceAnalysis.totalVariance > 0 ? '+' : ''}
                {analysis.varianceAnalysis.totalVariance.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500">Items sobre presupuesto:</span>
              <span className="ml-2 text-red-400 font-medium">
                {analysis.varianceAnalysis.overBudgetItems}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Items bajo presupuesto:</span>
              <span className="ml-2 text-emerald-400 font-medium">
                {analysis.varianceAnalysis.underBudgetItems}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Budget Summary */}
      {analysis.budgetSummary && (
        <div className="p-3 bg-slate-800/30 rounded-lg">
          <h4 className="text-xs text-slate-500 mb-2 font-medium">Resumen del Presupuesto</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Proyecto:</span>
              <span className="ml-2 text-slate-200">{analysis.budgetSummary.projectName}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimado:</span>
              <span className="ml-2 text-slate-200">
                ${analysis.budgetSummary.totalEstimated.toLocaleString('es-CL')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Ejecutado:</span>
              <span className="ml-2 text-slate-200">
                ${analysis.budgetSummary.totalExecuted.toLocaleString('es-CL')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Variance:</span>
              <span className={`ml-2 font-medium ${
                analysis.budgetSummary.variance > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {analysis.budgetSummary.variance > 0 ? '+' : ''}
                {analysis.budgetSummary.variance.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-500 mb-2 font-medium">Recomendaciones</h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * AIMetricBadge - Badge para mostrar métricas de IA
 */
export const AIMetricBadge: React.FC<{ 
  label: string; 
  value: string | number; 
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ label, value, trend, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${variantStyles[variant]}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
      {trend && (
        <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}>
          {trendIcons[trend]}
        </span>
      )}
    </div>
  );
};