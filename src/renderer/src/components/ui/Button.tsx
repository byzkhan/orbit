import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-orbit-accent text-orbit-bg hover:bg-orbit-accent-hover',
  secondary: 'bg-orbit-surface text-orbit-text border border-orbit-border hover:bg-orbit-border',
  ghost: 'text-orbit-text-secondary hover:text-orbit-text hover:bg-orbit-surface',
  danger: 'bg-orbit-error/10 text-orbit-error border border-orbit-error/30 hover:bg-orbit-error/20',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
