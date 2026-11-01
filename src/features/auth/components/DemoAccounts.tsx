import { Zap } from 'lucide-react'

const PASSWORD = 'Demo-Passw0rd!'

const ACCOUNTS = [
  { role: 'Owner', email: 'owner@ironpulse.test', branches: 'Both' },
  { role: 'Manager', email: 'manager@ironpulse.test', branches: 'Both' },
  { role: 'Staff', email: 'staff.dhanmondi@ironpulse.test', branches: 'Dhanmondi' },
  { role: 'Staff', email: 'staff.uttara@ironpulse.test', branches: 'Uttara' },
  { role: 'Trainer', email: 'trainer.dhanmondi@ironpulse.test', branches: 'Dhanmondi' },
  { role: 'Trainer', email: 'trainer.uttara@ironpulse.test', branches: 'Uttara' },
  { role: 'Trainer', email: 'trainer.both@ironpulse.test', branches: 'Both' },
]

type Props = { onPick: (v: { identifier: string; password: string }) => void; disabled?: boolean }

export function DemoAccounts({ onPick, disabled }: Props) {
  if (!import.meta.env.DEV) return null
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Zap className="size-3.5 text-primary" /> Demo accounts (dev only)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            disabled={disabled}
            onClick={() => onPick({ identifier: a.email, password: PASSWORD })}
            className="rounded-xl bg-surface-2 px-3 py-2 text-start transition hover:bg-border disabled:opacity-50"
          >
            <span className="block text-sm font-semibold">{a.role}</span>
            <span className="block truncate text-xs text-muted">{a.branches}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
