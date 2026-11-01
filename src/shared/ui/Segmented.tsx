import { cn } from '@/shared/lib/cn'

type Props<T extends string> = { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }

export function Segmented<T extends string>({ value, onChange, options, className }: Props<T>) {
  return (
    <div className={cn('inline-flex rounded-xl bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition', value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chips<T extends string>({ value, onChange, options }: Props<T>) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
            value === o.value ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-surface text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
