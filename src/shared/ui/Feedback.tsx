import { AlertTriangle, Inbox, RotateCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-lg', className)} />

export const ListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-4 p-4">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

type EmptyProps = { icon?: LucideIcon; title: string; hint?: string; action?: ReactNode }

export function EmptyState({ icon: Icon = Inbox, title, hint, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon className="size-7" />
      </span>
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-7" />
      </span>
      <p className="font-semibold">{t('common.error')}</p>
      {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" icon={<RotateCw className="size-4" />} onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
