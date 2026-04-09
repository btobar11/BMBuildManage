import React, { forwardRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string
  /** Input size */
  size?: 'sm' | 'md' | 'lg'
  /** Input visual variant */
  variant?: 'default' | 'filled' | 'minimal'
  /** Left icon component */
  leftIcon?: LucideIcon
  /** Right icon component */
  rightIcon?: LucideIcon
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Success state */
  success?: boolean
  /** Loading state */
  loading?: boolean
  /** Floating label (label animates when focused/filled) */
  floatingLabel?: boolean
  /** Full width input */
  fullWidth?: boolean
}

const StatusIcon: React.FC<{ loading?: boolean; error?: string; success?: boolean; iconSize: number }> = ({ loading, error, success, iconSize }) => {
  if (loading) return <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
  if (error) return <AlertCircle size={iconSize} className="text-danger-500" />
  if (success) return <Check size={iconSize} className="text-success-500" />
  return null
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    size = 'md',
    variant = 'default',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    error,
    helperText,
    success,
    loading,
    floatingLabel = false,
    fullWidth = false,
    disabled,
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    
    // Calculate if field has value for floating label
    const hasValue = value !== undefined ? String(value).length > 0 : false
    const shouldFloatLabel = floatingLabel && (focused || hasValue)

    // Determine input type for password toggle
    const inputType = isPasswordType && showPassword ? 'text' : type

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      onBlur?.(e)
    }

    const baseContainerStyles = `
      relative
      ${fullWidth ? 'w-full' : 'w-auto'}
    `

    const sizeStyles: Record<'sm' | 'md' | 'lg', {
      input: string
      icon: number
      label: string
      spacing: string
    }> = {
      sm: {
        input: 'h-8 px-3 text-sm',
        icon: 14,
        label: 'text-sm',
        spacing: floatingLabel ? 'pt-4 pb-1' : 'py-1.5'
      },
      md: {
        input: 'h-10 px-3 text-sm',
        icon: 16,
        label: 'text-sm',
        spacing: floatingLabel ? 'pt-5 pb-2' : 'py-2.5'
      },
      lg: {
        input: 'h-12 px-4 text-base',
        icon: 18,
        label: 'text-base',
        spacing: floatingLabel ? 'pt-6 pb-2' : 'py-3'
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

    const inputStyles = cn(
      'w-full font-medium',
      'text-foreground placeholder:text-muted-foreground',
      'outline-none transition-all duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'minimal' ? 'rounded-none' : 'rounded-lg',
      sizeStyles[size].input,
      sizeStyles[size].spacing,
      variantStyles[variant],
      // Icon padding adjustments
      LeftIcon && 'pl-10',
      (RightIcon || isPasswordType || loading || success || error) && 'pr-10'
    )

    const labelStyles = cn(
      'block font-medium transition-all duration-200',
      sizeStyles[size].label,
      error ? 'text-danger-600 dark:text-danger-400' : 'text-foreground',
      floatingLabel ? [
        'absolute pointer-events-none',
        shouldFloatLabel 
          ? 'top-1 left-3 text-xs text-muted-foreground' 
          : `top-1/2 left-3 -translate-y-1/2 ${sizeStyles[size].label}`,
        variant === 'minimal' && 'left-0'
      ] : 'mb-1.5'
    )

    const iconContainerStyles = `
      absolute top-1/2 -translate-y-1/2 
      flex items-center justify-center
      text-muted-foreground
      transition-colors duration-150
    `

    return (
      <div className={baseContainerStyles}>
        {/* Label */}
        {label && (
          <label className={labelStyles}>
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className={cn(iconContainerStyles, 'left-3')}>
              <LeftIcon size={sizeStyles[size].icon} />
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={cn(inputStyles, className)}
            placeholder={floatingLabel ? undefined : placeholder}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Right Icons */}
          <div className={cn(iconContainerStyles, 'right-3')}>
            <div className="flex items-center gap-1">
              {/* Status Icon (loading, error, success) */}
              <StatusIcon loading={loading} error={error} success={success} iconSize={sizeStyles[size].icon} />
              
              {/* Password Toggle */}
              {isPasswordType && !loading && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={sizeStyles[size].icon} />
                  ) : (
                    <Eye size={sizeStyles[size].icon} />
                  )}
                </button>
              )}
              
              {/* Custom Right Icon */}
              {RightIcon && !loading && !error && !success && (
                <RightIcon size={sizeStyles[size].icon} />
              )}
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

Input.displayName = 'Input'

export { Input }