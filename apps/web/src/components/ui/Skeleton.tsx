import React from 'react'
import { cn } from '../../utils/cn'

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /** Custom width */
  width?: string | number
  /** Custom height */
  height?: string | number
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none'
  /** Number of items (for list) */
  count?: number
  /** Custom className */
  className?: string
}

/**
 * Skeleton - Premium loading skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  count = 1,
  className
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  const defaultHeights = {
    text: '1rem',
    circular: '3rem',
    rectangular: '4rem',
    rounded: '3rem'
  }

  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <>
      {items.map((index) => (
        <div
          key={index}
          className={cn(
            'bg-muted dark:bg-slate-700/50',
            variantStyles[variant],
            animationStyles[animation],
            className
          )}
          style={{
            width: width || (variant === 'circular' ? '3rem' : '100%'),
            height: height || defaultHeights[variant]
          }}
        />
      ))}
    </>
  )
}

/**
 * SkeletonCard - Pre-styled skeleton for cards
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="rounded" width="5rem" height="1.5rem" />
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
      </div>
      <Skeleton variant="text" width="70%" height="1.5rem" className="mb-2" />
      <Skeleton variant="text" width="40%" height="1rem" className="mb-4" />
      <Skeleton variant="rounded" width="100%" height="0.5rem" className="mb-2" />
      <div className="flex justify-between pt-4 border-t border-border">
        <Skeleton variant="text" width="30%" height="1rem" />
        <Skeleton variant="rounded" width="4rem" height="1.5rem" />
      </div>
    </div>
  )
}

/**
 * SkeletonTable - Pre-styled skeleton for tables
 */
export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5,
  className 
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-t-lg">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="text" width="80%" height="1rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div 
          key={i} 
          className="grid grid-cols-4 gap-4 p-4 border-b border-border"
        >
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} variant="text" width="60%" height="1rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonList - Pre-styled skeleton for lists
 */
export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5,
  className 
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height="1rem" />
            <Skeleton variant="text" width="40%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonMetric - Pre-styled skeleton for metric cards
 */
export const SkeletonMetric: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-6',
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="rounded" width="2.5rem" height="2.5rem" />
        <Skeleton variant="text" width="40%" height="1rem" />
      </div>
      <Skeleton variant="text" width="50%" height="2rem" className="mb-2" />
      <Skeleton variant="text" width="30%" height="0.875rem" />
    </div>
  )
}