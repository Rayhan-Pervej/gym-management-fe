import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { tones, type Tone } from './Badge'
import { Card } from './Card'
import { Skeleton } from './Feedback'

type Props = { label: string; value?: string; icon: LucideIcon; tone?: Tone; hint?: string; loading?: boolean }

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint, loading }: Props) {
  return (
    <Card className="flex items-center gap-3 p-3 sm:p-4">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11', tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-muted">{label}</p>
        {loading ? <Skeleton className="mt-1 h-6 w-20" /> : <p className="text-lg font-extrabold tracking-tight sm:text-xl">{value}</p>}
        {hint && <p className="line-clamp-2 text-xs leading-tight text-muted">{hint}</p>}
      </div>
    </Card>
  )
}
