import React, { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea label */
  label?: string
  /** Textarea size */
  size?: 'sm' | 'md' | 'lg'
  /** Textarea visual variant */
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
  /** Auto-resize based on content */
  autoResize?: boolean
  /** Show character count */
  showCount?: boolean
  /** Maximum character count */
  maxLength?: number
  /** Full width textarea */
  fullWidth?: boolean
}

const TextareaStatusIcon: React.FC<{ loading?: boolean; error?: string; success?: boolean; iconSize: number }> = ({ loading, error, success, iconSize }) => {
  if (loading) return <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
  if (error) return <AlertCircle size={iconSize} className="text-danger-500" />
  if (success) return <Check size={iconSize} className="text-success-500" />
  return null
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    size = 'md',
    variant = 'default',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    error,
    helperText,
    success,
    loading,
    autoResize = false,
    showCount = false,
    maxLength,
    fullWidth = false,
    disabled,
    value,
    onChange,
    children,
    rows = 3,
    ...props
  }, ref) => {
    const charCount = value ? String(value).length : 0
    const isOverLimit = maxLength ? charCount > maxLength : false

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Auto-resize functionality
      if (autoResize && e.target) {
        e.target.style.height = 'auto'
        e.target.style.height = `${e.target.scrollHeight}px`
      }
      onChange?.(e)
    }

    const baseContainerStyles = `
      relative
      ${fullWidth ? 'w-full' : 'w-auto'}
    `

    const sizeStyles = {
      sm: {
        textarea: 'p-2 text-sm min-h-[80px]',
        icon: 14,
        label: 'text-sm',
      },
      md: {
        textarea: 'p-3 text-sm min-h-[100px]',
        icon: 16,
        label: 'text-sm',
      },
      lg: {
        textarea: 'p-4 text-base min-h-[120px]',
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

    const textareaStyles = cn(
      'w-full font-medium resize-vertical',
      'text-foreground placeholder:text-muted-foreground',
      'outline-none transition-all duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'minimal' ? 'rounded-none' : 'rounded-lg',
      sizeStyles[size].textarea,
      variantStyles[variant],
      // Icon padding adjustments
      LeftIcon && 'pl-10',
      (RightIcon || loading || success || error) && 'pr-10',
      autoResize && 'resize-none overflow-hidden'
    )

    const labelStyles = cn(
      'block font-medium mb-1.5 transition-colors duration-200',
      sizeStyles[size].label,
      error ? 'text-danger-600 dark:text-danger-400' : 'text-foreground'
    )

    const iconContainerStyles = `
      absolute 
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

        {/* Textarea Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className={cn(iconContainerStyles, 'top-3 left-3')}>
              <LeftIcon size={sizeStyles[size].icon} />
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={ref}
            className={cn(textareaStyles, className)}
            disabled={disabled || loading}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            rows={rows}
            maxLength={maxLength}
            {...props}
          />

          {/* Right Icons */}
          {(RightIcon || loading || error || success) && (
            <div className={cn(iconContainerStyles, 'top-3 right-3')}>
              <div className="flex items-center gap-1">
                {/* Status Icon */}
                <TextareaStatusIcon loading={loading} error={error} success={success} iconSize={sizeStyles[size].icon} />
                
                {/* Custom Right Icon */}
                {RightIcon && !loading && !error && !success && (
                  <RightIcon size={sizeStyles[size].icon} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Helper Text / Error Message / Character Count */}
        <div className="flex justify-between items-start mt-1.5">
          <div>
            {(error || helperText) && (
              <p className={cn(
                'text-xs',
                error ? 'text-danger-600 dark:text-danger-400' : 'text-muted-foreground'
              )}>
                {error || helperText}
              </p>
            )}
          </div>
          
          {showCount && (
            <p className={cn(
              'text-xs tabular-nums',
              isOverLimit ? 'text-danger-600 dark:text-danger-400' : 'text-muted-foreground'
            )}>
              {charCount}{maxLength && ` / ${maxLength}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }