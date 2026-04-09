import React, { forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header title */
  title?: string
  /** Header subtitle/description */
  subtitle?: string
  /** Left icon */
  icon?: LucideIcon
  /** Right content (usually actions) */
  actions?: React.ReactNode
  /** Remove bottom border */
  noBorder?: boolean
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({
    className,
    title,
    subtitle,
    icon: Icon,
    actions,
    noBorder = false,
    children,
    ...props
  }, ref) => {
    const hasContent = title || subtitle || Icon || actions || children

    if (!hasContent) return null

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-4',
          !noBorder && 'border-b border-border pb-4 mb-4',
          className
        )}
        {...props}
      >
        {/* Left content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Icon */}
          {Icon && (
            <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Icon size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
          )}
          
          {/* Text content */}
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="font-semibold text-lg text-card-foreground leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>

        {/* Right actions */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

export { CardHeader }