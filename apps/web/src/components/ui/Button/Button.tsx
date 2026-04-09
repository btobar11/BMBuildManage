import React, { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Loading state */
  loading?: boolean
  /** Left icon component */
  leftIcon?: LucideIcon
  /** Right icon component */
  rightIcon?: LucideIcon
  /** Full width button */
  fullWidth?: boolean
  /** Icon only button (for icon buttons) */
  iconOnly?: boolean
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin">
    <svg 
      className="h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    iconOnly = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium
      border border-transparent
      focus:outline-none focus:ring-2 focus:ring-offset-2
      transition-all duration-150 cubic-bezier(0.16, 1, 0.3, 1)
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
      relative overflow-hidden
    `

    const variantStyles = {
      primary: `
        bg-primary-600 hover:bg-primary-700 
        text-white 
        shadow-sm shadow-primary-500/20
        hover:shadow-md hover:shadow-primary-500/25
        focus:ring-primary-500/30 focus:ring-offset-0
        border-primary-700
        hover:-translate-y-0.5
      `,
      secondary: `
        bg-secondary-500 hover:bg-secondary-600
        text-white
        shadow-sm shadow-secondary-500/20
        hover:shadow-md hover:shadow-secondary-500/25
        focus:ring-secondary-500/30 focus:ring-offset-0
        border-secondary-600
        hover:-translate-y-0.5
      `,
      outline: `
        bg-transparent hover:bg-primary-50 dark:hover:bg-primary-950/50
        text-primary-700 dark:text-primary-300 
        border-primary-300 dark:border-primary-600
        hover:border-primary-400 dark:hover:border-primary-500
        focus:ring-primary-500/30 focus:ring-offset-0
        shadow-sm hover:shadow-md
      `,
      ghost: `
        bg-transparent hover:bg-muted
        text-foreground hover:text-foreground
        border-transparent
        focus:ring-muted-foreground/20 focus:ring-offset-0
      `,
      danger: `
        bg-danger-500 hover:bg-danger-600
        text-white
        shadow-sm shadow-danger-500/20
        hover:shadow-md hover:shadow-danger-500/25
        focus:ring-danger-500/30 focus:ring-offset-0
        border-danger-600
        hover:-translate-y-0.5
      `,
      success: `
        bg-success-500 hover:bg-success-600
        text-white
        shadow-sm shadow-success-500/20
        hover:shadow-md hover:shadow-success-500/25
        focus:ring-success-500/30 focus:ring-offset-0
        border-success-600
        hover:-translate-y-0.5
      `
    }

    const sizeStyles = {
      xs: iconOnly ? 'h-6 w-6 rounded text-xs' : 'h-6 px-2 rounded text-xs',
      sm: iconOnly ? 'h-8 w-8 rounded-md text-sm' : 'h-8 px-3 rounded-md text-sm',
      md: iconOnly ? 'h-10 w-10 rounded-lg text-sm' : 'h-10 px-4 rounded-lg text-sm',
      lg: iconOnly ? 'h-12 w-12 rounded-lg text-base' : 'h-12 px-6 rounded-lg text-base',
      xl: iconOnly ? 'h-14 w-14 rounded-xl text-lg' : 'h-14 px-8 rounded-xl text-lg'
    }

    const iconSizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            {!iconOnly && <span className="opacity-70">{children}</span>}
          </>
        ) : (
          <>
            {LeftIcon && !iconOnly && (
              <LeftIcon size={iconSizes[size]} className="shrink-0" />
            )}
            {iconOnly && LeftIcon ? (
              <LeftIcon size={iconSizes[size]} />
            ) : (
              <span>{children}</span>
            )}
            {RightIcon && !iconOnly && (
              <RightIcon size={iconSizes[size]} className="shrink-0" />
            )}
          </>
        )}
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out opacity-0 hover:opacity-100" />
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }