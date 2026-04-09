import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from './Card'
import { cn } from '../../../utils/cn'

export interface MetricCardProps {
  /** Metric title */
  title: string
  /** Main value to display */
  value: string | number
  /** Previous value for comparison */
  previousValue?: string | number
  /** Change percentage */
  change?: number
  /** Icon for the metric */
  icon?: LucideIcon
  /** Icon color variant */
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Loading state */
  loading?: boolean
  /** Additional description */
  description?: string
  /** Click handler */
  onClick?: () => void
  /** Custom className */
  className?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  change,
  icon: Icon,
  iconColor = 'primary',
  loading = false,
  description,
  onClick,
  className
}) => {
  const hasPositiveChange = change !== undefined && change > 0
  const hasNegativeChange = change !== undefined && change < 0
  
  const iconColorStyles = {
    primary: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    success: 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-100 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
    info: 'bg-info-100 dark:bg-info-900/20 text-info-600 dark:text-info-400'
  }

  return (
    <Card
      variant="default"
      hoverable={!!onClick}
      clickable={!!onClick}
      loading={loading}
      onClick={onClick}
      className={cn('group', className)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600" />
      </div>

      <div className="relative">
        {/* Header with Icon and Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className={cn(
                'flex items-center justify-center p-2 rounded-lg shrink-0',
                iconColorStyles[iconColor]
              )}>
                <Icon size={18} />
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground leading-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Value */}
        <div className="space-y-2">
          <p className="text-2xl font-bold text-card-foreground leading-none data-mono">
            {loading ? (
              <span className="animate-pulse bg-muted rounded h-8 w-24 inline-block" />
            ) : (
              value
            )}
          </p>

          {/* Change Indicator */}
          {change !== undefined && !loading && (
            <div className="flex items-center gap-1">
              {hasPositiveChange && (
                <TrendingUp size={14} className="text-success-600" />
              )}
              {hasNegativeChange && (
                <TrendingDown size={14} className="text-danger-600" />
              )}
              
              <span className={cn(
                'text-xs font-medium data-mono',
                hasPositiveChange && 'text-success-600',
                hasNegativeChange && 'text-danger-600',
                change === 0 && 'text-muted-foreground'
              )}>
                {hasPositiveChange && '+'}
                {change.toFixed(1)}%
              </span>
              
              {previousValue && (
                <span className="text-xs text-muted-foreground">
                  vs {previousValue}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </Card>
  )
}

export { MetricCard }