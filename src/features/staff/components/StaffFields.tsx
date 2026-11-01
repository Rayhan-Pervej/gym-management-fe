import { useTranslation } from 'react-i18next'
import { useActiveBranches } from '@/core/auth/store'
import { cn } from '@/shared/lib/cn'
import { Select } from '@/shared/ui'
import { ASSIGNABLE_ROLES, type AssignableRole } from '../api/staff'

export function BranchPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useTranslation()
  const branches = useActiveBranches()
  if (branches.length < 2) return null
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{t('staff.branches')}</p>
      <div className="flex flex-wrap gap-2">
        {branches.map((b) => (
          <button key={b.id} type="button" onClick={() => toggle(b.id)} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition', value.includes(b.id) ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:bg-surface-2')}>
            {b.name}
          </button>
        ))}
      </div>
    </div>
  )
}

type RoleProps = {
  role: AssignableRole
  setRole: (r: AssignableRole) => void
  trainer: boolean
  setTrainer: (v: boolean) => void
  roles?: AssignableRole[]
}

export function RoleFields({ role, setRole, trainer, setTrainer, roles = ASSIGNABLE_ROLES }: RoleProps) {
  const { t } = useTranslation()
  return (
    <>
      <Select label={t('staff.role')} value={role} onChange={(e) => setRole(e.target.value as AssignableRole)} hint={t(`staff.roleHint_${role}`)}>
        {roles.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
      </Select>
      {role !== 'trainer' && (
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          {t('staff.isTrainer')}
          <input type="checkbox" role="switch" checked={trainer} onChange={(e) => setTrainer(e.target.checked)} className="size-5 accent-[var(--primary)]" />
        </label>
      )}
    </>
  )
}
