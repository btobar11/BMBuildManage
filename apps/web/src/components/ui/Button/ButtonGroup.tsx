import React from 'react'
import { cn } from '../../../utils/cn'

interface ButtonGroupProps {
  /** Children buttons */
  children: React.ReactNode
  /** Size for all buttons in group */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Orientation of the button group */
  orientation?: 'horizontal' | 'vertical'
  /** Additional CSS classes */
  className?: string
}

/**
 * ButtonGroup - Groups related buttons together with connected styling
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  size = 'md',
  orientation = 'horizontal',
  className
}) => {
  const isHorizontal = orientation === 'horizontal'
  
  return (
    <div 
      className={cn(
        'inline-flex',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        
        const isFirst = index === 0
        const isLast = index === React.Children.count(children) - 1
        const isMiddle = !isFirst && !isLast
        
        return React.cloneElement(child, {
          ...child.props,
          size: child.props.size || size,
          className: cn(
            child.props.className,
            // Remove individual rounded corners and borders for connected look
            isHorizontal ? [
              isFirst && 'rounded-r-none border-r-0',
              isMiddle && 'rounded-none border-r-0',
              isLast && 'rounded-l-none',
            ] : [
              isFirst && 'rounded-b-none border-b-0',
              isMiddle && 'rounded-none border-b-0', 
              isLast && 'rounded-t-none',
            ],
            // Add focus ring that doesn't interfere with grouping
            'focus:z-10 relative'
          )
        })
      })}
    </div>
  )
}

export type { ButtonGroupProps }