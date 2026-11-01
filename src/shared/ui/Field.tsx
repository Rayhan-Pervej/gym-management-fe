import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const base =
  'w-full rounded-xl border bg-surface px-3.5 text-sm text-fg placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)] disabled:opacity-60'

type FieldProps = { label?: string; error?: string; hint?: string; wrapperClass?: string }

function Wrap({ label, error, hint, id, children, wrapperClass }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', wrapperClass)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps & { icon?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, className, wrapperClass, ...p }, ref) => {
  const id = useId()
  return (
    <Wrap id={id} label={label} error={error} hint={hint} wrapperClass={wrapperClass}>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">{icon}</span>}
        <input ref={ref} id={id} className={cn(base, 'h-11', error ? 'border-danger' : 'border-border', icon && 'ps-10', className)} {...p} />
      </div>
    </Wrap>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  ({ label, error, hint, className, wrapperClass, children, ...p }, ref) => {
    const id = useId()
    return (
      <Wrap id={id} label={label} error={error} hint={hint} wrapperClass={wrapperClass}>
        <div className="relative">
          <select ref={ref} id={id} className={cn(base, 'h-11 cursor-pointer appearance-none pe-10', error ? 'border-danger' : 'border-border', className)} {...p}>
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
      </Wrap>
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  ({ label, error, hint, className, wrapperClass, ...p }, ref) => {
    const id = useId()
    return (
      <Wrap id={id} label={label} error={error} hint={hint} wrapperClass={wrapperClass}>
        <textarea ref={ref} id={id} rows={3} className={cn(base, 'py-2.5', error ? 'border-danger' : 'border-border', className)} {...p} />
      </Wrap>
    )
  },
)
