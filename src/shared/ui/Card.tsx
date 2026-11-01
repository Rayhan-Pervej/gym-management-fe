import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-2xl border border-border bg-surface shadow-card', className)} {...p} />
)

export const CardHeader = ({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-between gap-3 px-4 pt-4 sm:px-5', className)}>
    <h3 className="font-semibold">{title}</h3>
    {action}
  </div>
)

export const CardBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('p-4 sm:p-5', className)} {...p} />
