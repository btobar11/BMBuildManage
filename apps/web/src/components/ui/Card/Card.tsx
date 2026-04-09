import React, { forwardRef } from 'react'
import { cn } from '../../../utils/cn'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Card visual variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost' | 'gradient'
  /** Card size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Add padding to card */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Hover effects */
  hoverable?: boolean
  /** Make card clickable */
  clickable?: boolean
  /** Loading state */
  loading?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    padding = 'md',
    hoverable = false,
    clickable = false,
    loading = false,
    children,
    ...props
  }, ref) => {
    const baseStyles = `
      relative overflow-hidden
      transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)
      ${clickable ? 'cursor-pointer' : ''}
      ${loading ? 'pointer-events-none' : ''}
    `

    const variantStyles = {
      default: `
        bg-card border border-border
        shadow-sm
        ${hoverable || clickable ? 'hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700' : ''}
      `,
      outlined: `
        bg-transparent border-2 border-border
        ${hoverable || clickable ? 'hover:border-primary-300 dark:hover:border-primary-600 hover:bg-card/50' : ''}
      `,
      elevated: `
        bg-card border border-border/50
        shadow-lg shadow-black/5
        ${hoverable || clickable ? 'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1' : ''}
      `,
      ghost: `
        bg-transparent border-0
        ${hoverable || clickable ? 'hover:bg-muted/50' : ''}
      `,
      gradient: `
        bg-gradient-to-br from-card via-card to-muted/30
        border border-border/50 backdrop-blur-sm
        shadow-md
        ${hoverable || clickable ? 'hover:shadow-lg hover:from-card hover:to-muted/50' : ''}
      `
    }

    const sizeStyles = {
      sm: 'rounded-lg',
      md: 'rounded-xl', 
      lg: 'rounded-xl',
      xl: 'rounded-2xl'
    }

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}
        
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }