import React from 'react'
import { cn } from '../../utils/cn'

export interface LoadingScreenProps {
  /** Loading message */
  message?: string
  /** Show logo */
  showLogo?: boolean
  /** Full screen or contained */
  fullScreen?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
}

/**
 * LoadingScreen - Premium full-page loading component with animated cube
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  showLogo = true,
  fullScreen = true,
  size = 'md',
  className
}) => {
  const sizeConfig = {
    sm: {
      cube: 'w-12 h-12',
      dot: 'w-1.5 h-1.5',
      message: 'text-sm'
    },
    md: {
      cube: 'w-16 h-16',
      dot: 'w-2 h-2',
      message: 'text-base'
    },
    lg: {
      cube: 'w-24 h-24',
      dot: 'w-2.5 h-2.5',
      message: 'text-lg'
    }
  }

  const config = sizeConfig[size]

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-6',
      className
    )}>
      {/* Animated Cube Logo */}
      {showLogo && (
        <div className="relative">
          {/* Cube 3D Animation */}
          <div className={cn(
            'relative',
            config.cube
          )}>
            {/* Top Face */}
            <div className="absolute inset-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-sm transform rotate-6 translate-y-1 animate-pulse" />
            {/* Front Face */}
            <div className="absolute inset-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }} />
            {/* Side Face */}
            <div className="absolute inset-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-sm transform -rotate-6 -translate-y-1 animate-pulse" style={{ animationDelay: '0.2s' }} />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-sm" />
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-primary-500 rounded-full animate-dot-flashing',
                  config.dot
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className={cn(
          'text-muted-foreground font-medium animate-pulse',
          config.message
        )}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  )
}