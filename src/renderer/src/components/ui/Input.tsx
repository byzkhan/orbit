import { cn } from '../../lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-orbit-surface border border-orbit-border rounded-lg text-orbit-text placeholder:text-orbit-text-secondary focus:outline-none focus:border-orbit-accent transition-colors text-sm',
        className
      )}
      {...props}
    />
  )
}
