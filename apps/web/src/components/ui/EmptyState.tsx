import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button/Button'
import { cn } from '../../utils/cn'

export interface EmptyStateProps {
  /** Icon component */
  icon?: LucideIcon
  /** Empty state title */
  title: string
  /** Description text */
  description?: string
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
}

/**
 * EmptyState - Premium empty state component with professional styling
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className
}) => {
  const sizeConfig = {
    sm: {
      icon: 'w-12 h-12',
      iconSize: 24,
      title: 'text-lg',
      description: 'text-sm',
      padding: 'py-8'
    },
    md: {
      icon: 'w-16 h-16',
      iconSize: 32,
      title: 'text-xl',
      description: 'text-base',
      padding: 'py-12'
    },
    lg: {
      icon: 'w-20 h-20',
      iconSize: 40,
      title: 'text-2xl',
      description: 'text-lg',
      padding: 'py-16'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center px-4',
      config.padding,
      className
    )}>
      {/* Icon Container */}
      {Icon && (
        <div className={cn(
          'flex items-center justify-center rounded-2xl mb-6',
          config.icon,
          'bg-emerald-100 dark:bg-emerald-900/30'
        )}>
          <Icon 
            size={config.iconSize} 
            className="text-emerald-600 dark:text-emerald-400" 
          />
        </div>
      )}

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-foreground mb-2',
        config.title
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn(
          'text-muted-foreground mb-6 max-w-md',
          config.description
        )}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick} 
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Decorative Elements */}
      <div className="mt-8 flex items-center gap-1 opacity-30">
        <div className="w-2 h-2 rounded-full bg-primary-400" />
        <div className="w-2 h-2 rounded-full bg-primary-300" />
        <div className="w-2 h-2 rounded-full bg-primary-200" />
      </div>
    </div>
  )
}