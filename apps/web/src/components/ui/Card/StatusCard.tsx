import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Card } from './Card'
import { CardHeader } from './CardHeader'
import { CardContent } from './CardContent'
import { cn } from '../../../utils/cn'

export interface StatusCardProps {
  /** Card title */
  title: string
  /** Status text */
  status: string
  /** Status variant */
  statusVariant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** Icon for the card */
  icon?: LucideIcon
  /** Additional content */
  children?: React.ReactNode
  /** Description text */
  description?: string
  /** Progress value (0-100) */
  progress?: number
  /** Loading state */
  loading?: boolean
  /** Click handler */
  onClick?: () => void
  /** Custom className */
  className?: string
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  statusVariant = 'default',
  icon: Icon,
  children,
  description,
  progress,
  loading = false,
  onClick,
  className
}) => {
  const statusStyles = {
    success: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
    info: 'bg-info-100 text-info-800 dark:bg-info-900/20 dark:text-info-400',
    default: 'bg-muted text-muted-foreground'
  }

  const progressColor = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
    default: 'bg-primary-500'
  }

  return (
    <Card
      hoverable={!!onClick}
      clickable={!!onClick}
      loading={loading}
      onClick={onClick}
      className={cn('group', className)}
    >
      <CardHeader
        icon={Icon}
        title={title}
        subtitle={description}
        actions={
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            statusStyles[statusVariant]
          )}>
            {status}
          </div>
        }
        noBorder={!children && progress === undefined}
      />

      {children && (
        <CardContent spacing="sm">
          {children}
        </CardContent>
      )}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progreso</span>
            <span className="data-mono">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                progressColor[statusVariant]
              )}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Hover Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </Card>
  )
}

export { StatusCard }