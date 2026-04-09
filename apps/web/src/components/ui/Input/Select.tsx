import React, { forwardRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, AlertCircle, Check } from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select label */
  label?: string
  /** Select size */
  size?: 'sm' | 'md' | 'lg'
  /** Select visual variant */
  variant?: 'default' | 'filled' | 'minimal'
  /** Left icon component */
  leftIcon?: LucideIcon
  /** Options for the select */
  options?: SelectOption[]
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Success state */
  success?: boolean
  /** Loading state */
  loading?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Full width select */
  fullWidth?: boolean
}

const SelectStatusIcon: React.FC<{ loading?: boolean; error?: string; success?: boolean; iconSize: number }> = ({ loading, error, success, iconSize }) => {
  if (loading) return <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
  if (error) return <AlertCircle size={iconSize} className="text-danger-500" />
  if (success) return <Check size={iconSize} className="text-success-500" />
  return null
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    size = 'md',
    variant = 'default',
    leftIcon: LeftIcon,
    options = [],
    error,
    helperText,
    success,
    loading,
    placeholder,
    fullWidth = false,
    disabled,
    value,
    onChange,
    children,
    ...props
  }, ref) => {
    const [focused, setFocused] = useState(false)

    const baseContainerStyles = `
      relative
      ${fullWidth ? 'w-full' : 'w-auto'}
    `

    const sizeStyles: Record<'sm' | 'md' | 'lg', {
      select: string
      icon: number
      label: string
    }> = {
      sm: {
        select: 'h-8 px-3 text-sm',
        icon: 14,
        label: 'text-sm',
      },
      md: {
        select: 'h-10 px-3 text-sm',
        icon: 16,
        label: 'text-sm',
      },
      lg: {
        select: 'h-12 px-4 text-base',
        icon: 18,
        label: 'text-base',
      }
    }

    const variantStyles = {
      default: `
        bg-background border border-border
        hover:border-primary-300 dark:hover:border-primary-600
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0
        ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}
        ${success ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20' : ''}
      `,
      filled: `
        bg-muted border border-transparent
        hover:bg-muted/80 hover:border-border
        focus:bg-background focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0
        ${error ? 'bg-danger-50 dark:bg-danger-950/20 border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}
        ${success ? 'bg-success-50 dark:bg-success-950/20 border-success-500 focus:border-success-500 focus:ring-success-500/20' : ''}
      `,
      minimal: `
        bg-transparent border-0 border-b-2 border-border rounded-none
        hover:border-primary-300 dark:hover:border-primary-600
        focus:border-primary-500 focus:ring-0 focus:ring-offset-0
        ${error ? 'border-danger-500 focus:border-danger-500' : ''}
        ${success ? 'border-success-500 focus:border-success-500' : ''}
      `
    }

    const selectStyles = cn(
      'w-full font-medium appearance-none cursor-pointer',
      'text-foreground',
      'outline-none transition-all duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'minimal' ? 'rounded-none' : 'rounded-lg',
      sizeStyles[size].select,
      variantStyles[variant],
      // Icon padding adjustments
      LeftIcon && 'pl-10',
      'pr-10' // Always add right padding for chevron
    )

    const labelStyles = cn(
      'block font-medium mb-1.5 transition-colors duration-200',
      sizeStyles[size].label,
      error ? 'text-danger-600 dark:text-danger-400' : 'text-foreground'
    )

    const iconContainerStyles = `
      absolute top-1/2 -translate-y-1/2 
      flex items-center justify-center
      text-muted-foreground
      transition-colors duration-150
      pointer-events-none
    `

    return (
      <div className={baseContainerStyles}>
        {/* Label */}
        {label && (
          <label className={labelStyles}>
            {label}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className={cn(iconContainerStyles, 'left-3')}>
              <LeftIcon size={sizeStyles[size].icon} />
            </div>
          )}

          {/* Select */}
          <select
            ref={ref}
            className={cn(selectStyles, className)}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            
            {/* Custom children options */}
            {children}
          </select>

          {/* Right Icons */}
          <div className={cn(iconContainerStyles, 'right-3')}>
            <div className="flex items-center gap-1">
              {/* Status Icon */}
              <SelectStatusIcon loading={loading} error={error} success={success} iconSize={sizeStyles[size].icon} />
              
              {/* Chevron (always present) */}
              <ChevronDown 
                size={sizeStyles[size].icon} 
                className={cn(
                  'transition-transform duration-150',
                  focused && 'rotate-180'
                )}
              />
            </div>
          </div>
        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <p className={cn(
            'mt-1.5 text-xs',
            error ? 'text-danger-600 dark:text-danger-400' : 'text-muted-foreground'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }