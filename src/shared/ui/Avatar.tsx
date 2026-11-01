import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'

export const Avatar = ({ name, src, className }: { name: string; src?: string | null; className?: string }) =>
  src ? (
    <img src={src} alt={name} className={cn('size-10 shrink-0 rounded-full object-cover', className)} />
  ) : (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary', className)}>
      {initials(name)}
    </span>
  )
