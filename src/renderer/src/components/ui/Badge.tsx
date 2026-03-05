import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'accent'
  children: ReactNode
  className?: string
}

const variants = {
  default: 'bg-orbit-surface text-orbit-text-secondary border-orbit-border',
  success: 'bg-orbit-success/10 text-orbit-success border-orbit-success/30',
  error: 'bg-orbit-error/10 text-orbit-error border-orbit-error/30',
  accent: 'bg-orbit-accent/10 text-orbit-accent border-orbit-accent/30',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
