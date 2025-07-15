import { cn } from '@/lib/utils'
import { BaseComponentProps } from '@/types'

interface CardProps extends BaseComponentProps {
  hover?: boolean
}

export function Card({ className, children, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends BaseComponentProps {
  border?: boolean
}

export function CardHeader({ className, children, border = false }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'p-6',
        border && 'border-b border-gray-200',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: BaseComponentProps) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900',
        className
      )}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }: BaseComponentProps) {
  return (
    <p
      className={cn(
        'mt-1 text-sm text-gray-500',
        className
      )}
    >
      {children}
    </p>
  )
}

export function CardContent({ className, children }: BaseComponentProps) {
  return (
    <div
      className={cn(
        'p-6 pt-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: BaseComponentProps) {
  return (
    <div
      className={cn(
        'p-6 pt-0 flex items-center',
        className
      )}
    >
      {children}
    </div>
  )
} 