import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('overflow-y-auto', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'
