import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/features/members/components/StatusBadge'
import { useFmt } from '@/shared/hooks/useFmt'
import { Avatar, Badge } from '@/shared/ui'
import type { DashboardMember } from '../api/dashboard'

export function DashboardRow({ m }: { m: DashboardMember }) {
  const { t } = useTranslation()
  const { money, num, date } = useFmt()
  const sub = m.days_left === null ? '' : m.days_left === 0 ? t('members.endsToday') : t('members.daysLeft', { n: num(m.days_left) })
  return (
    <Link to={`/members/${m.member_id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/60 sm:px-5">
      <Avatar name={m.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{m.name}</p>
        <p className="truncate text-xs text-muted">{m.member_code} · {m.end_date ? date(m.end_date) : m.phone}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={m.status} />
        {m.due_minor > 0 ? <Badge tone="danger">{t('members.due')} {money(m.due_minor)}</Badge> : <span className="text-xs text-muted">{sub}</span>}
      </div>
    </Link>
  )
}
