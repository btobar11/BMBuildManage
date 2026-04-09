import React, { forwardRef } from 'react'
import { cn } from '../../../utils/cn'

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content spacing */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({
    className,
    spacing = 'none',
    children,
    ...props
  }, ref) => {
    const spacingStyles = {
      none: '',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'text-card-foreground',
          spacingStyles[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

export { CardContent }