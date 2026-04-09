import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'
import type { ButtonProps } from './Button'

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'iconOnly'> {
  /** Icon component to display */
  icon: LucideIcon
  /** Accessible label for screen readers */
  label: string
}

/**
 * IconButton - A specialized button for icon-only interactions
 * Automatically handles accessibility and consistent sizing
 */
export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  label, 
  ...props 
}) => {
  return (
    <Button
      leftIcon={icon}
      iconOnly
      aria-label={label}
      title={label}
      {...props}
    />
  )
}

export type { IconButtonProps }