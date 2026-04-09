import React, { forwardRef } from 'react'
import { cn } from '../../../utils/cn'

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Footer alignment */
  align?: 'left' | 'center' | 'right' | 'between'
  /** Remove top border */
  noBorder?: boolean
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({
    className,
    align = 'right',
    noBorder = false,
    children,
    ...props
  }, ref) => {
    const alignmentStyles = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3',
          alignmentStyles[align],
          !noBorder && 'border-t border-border pt-4 mt-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { CardFooter }