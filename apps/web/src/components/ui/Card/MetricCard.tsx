import React, { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Card } from './Card'
import { cn } from '../../../utils/cn'

export type MetricCardProps = {
  /** Metric title */
  title: string
  /** Main value to display */
  value: string | number
  /** Previous value for comparison */
  previousValue?: string | number
  /** Change percentage */
  change?: number
  /** Icon for the metric */
  icon?: LucideIcon
  /** Icon color variant */
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Loading state */
  loading?: boolean
  /** Additional description */
  description?: string
  /** Click handler */
  onClick?: () => void
  /** Custom className */
  className?: string
}

// ─── Animated Counter ──────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => {
    if (Math.abs(v) >= 1_000_000) {
      return `$${(v / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(v) >= 1_000) {
      return `$${(v / 1_000).toFixed(0)}K`
    }
    return Math.round(v).toLocaleString('es-CL')
  })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    })

    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v))

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, motionValue, rounded])

  return <span>{displayValue}</span>
}

function AnimatedInteger({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v).toString())
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    })

    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v))

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, motionValue, rounded])

  return <span>{displayValue}</span>
}

// ─── Icon Glow Wrapper ─────────────────────────────────────────────────────
const iconColorStyles = {
  primary: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    bg: 'bg-sky-100 dark:bg-sky-900/20',
    text: 'text-sky-600 dark:text-sky-400',
    glow: 'rgba(14, 165, 233, 0.3)',
  },
}

// ─── Determine if value is numeric ─────────────────────────────────────────
function parseNumericValue(value: string | number): { isNumeric: boolean; num: number; prefix: string; isCurrency: boolean } {
  if (typeof value === 'number') {
    return { isNumeric: true, num: value, prefix: '', isCurrency: false }
  }
  // Match patterns like "$1.2M", "$500K", "$123"
  const currencyMatch = value.match(/^\$(.+)$/)
  if (currencyMatch) {
    const inner = currencyMatch[1]
    const multiplierMatch = inner.match(/^([\d.,]+)([MKB]?)$/)
    if (multiplierMatch) {
      let num = parseFloat(multiplierMatch[1].replace(/\./g, '').replace(',', '.'))
      const suffix = multiplierMatch[2]
      if (suffix === 'M') num *= 1_000_000
      else if (suffix === 'K') num *= 1_000
      else if (suffix === 'B') num *= 1_000_000_000
      return { isNumeric: true, num, prefix: '$', isCurrency: true }
    }
  }
  // Plain number
  const plainNum = parseFloat(String(value).replace(/\./g, '').replace(',', '.'))
  if (!isNaN(plainNum)) {
    return { isNumeric: true, num: plainNum, prefix: '', isCurrency: false }
  }
  return { isNumeric: false, num: 0, prefix: '', isCurrency: false }
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  change,
  icon: Icon,
  iconColor = 'primary',
  loading = false,
  description,
  onClick,
  className
}) => {
  const hasPositiveChange = change !== undefined && change > 0
  const hasNegativeChange = change !== undefined && change < 0
  const colorConfig = iconColorStyles[iconColor]
  const cardRef = useRef<HTMLDivElement>(null)
  const parsed = parseNumericValue(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        ref={cardRef}
        variant="default"
        hoverable={!!onClick}
        clickable={!!onClick}
        loading={loading}
        onClick={onClick}
        className={cn(
          'group relative overflow-hidden',
          'border border-slate-200 dark:border-slate-700/60',
          'hover:border-emerald-300/40 dark:hover:border-emerald-500/20',
          'transition-all duration-300',
          className
        )}
      >
        {/* Emerald gradient glow border effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, transparent 50%, rgba(16,185,129,0.02) 100%)',
          }}
        />

        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        <div className="relative">
          {/* Header with Icon and Title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {Icon && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className={cn(
                    'flex items-center justify-center p-2.5 rounded-xl shrink-0',
                    colorConfig.bg,
                    colorConfig.text,
                  )}
                  style={{
                    boxShadow: `0 0 0 0 ${colorConfig.glow}`,
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                </motion.div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground leading-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Value with Animation */}
          <div className="space-y-2">
            <div className="text-2xl font-bold text-card-foreground leading-none data-mono tracking-tight">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-7 w-28 rounded-lg bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
                </div>
              ) : parsed.isNumeric && parsed.isCurrency ? (
                <AnimatedNumber value={parsed.num} />
              ) : parsed.isNumeric ? (
                <AnimatedInteger value={parsed.num} />
              ) : (
                value
              )}
            </div>

            {/* Change Indicator */}
            {change !== undefined && !loading && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-center gap-1.5"
              >
                {hasPositiveChange && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                {hasNegativeChange && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrendingDown size={12} className="text-red-600 dark:text-red-400" />
                  </div>
                )}
                
                <span className={cn(
                  'text-xs font-semibold data-mono',
                  hasPositiveChange && 'text-emerald-600 dark:text-emerald-400',
                  hasNegativeChange && 'text-red-600 dark:text-red-400',
                  change === 0 && 'text-muted-foreground'
                )}>
                  {hasPositiveChange && '+'}
                  {change.toFixed(1)}%
                </span>
                
                {previousValue && (
                  <span className="text-xs text-muted-foreground/60">
                    vs {previousValue}
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export { MetricCard }