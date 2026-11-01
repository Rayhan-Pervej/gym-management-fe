import type { TFunction } from 'i18next'
import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useFmt } from '@/shared/hooks/useFmt'
import { Avatar, Badge } from '@/shared/ui'
import type { Member } from '../types'
import { StatusBadge } from './StatusBadge'

export function expiryText(m: Member, t: TFunction, num: (n: number) => string, date: (d?: string | null) => string) {
  if (m.status === 'expired') return t('members.expiredOn', { date: date(m.expired_since) })
  if (m.status === 'upcoming') return t('members.startsOn', { date: date(m.current_membership?.start_date) })
  if (m.days_left === null || m.days_left === undefined) return ''
  return m.days_left === 0 ? t('members.endsToday') : t('members.daysLeft', { n: num(m.days_left) })
}

export function MemberRow({ member: m, action }: { member: Member; action?: React.ReactNode }) {
  const { t } = useTranslation()
  const { money, num, date } = useFmt()
  const sub = expiryText(m, t, num, date)
  return (
    <div className="flex items-center gap-1 pe-2">
      <Link to={`/members/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition hover:bg-surface-2/60">
        <Avatar name={m.name} src={m.photo_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{m.name}</p>
          <p className="truncate text-xs text-muted">{m.member_code} · {m.phone}</p>
        </div>
        <div className="hidden min-w-32 text-sm text-muted md:block">
          <p className="truncate text-fg">{m.current_membership?.plan_name ?? '—'}</p>
          {sub && <p className="flex items-center gap-1 text-xs"><CalendarClock className="size-3.5" />{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={m.status} />
          {m.has_dues ? <Badge tone="danger">{t('members.due')} {money(m.due_minor ?? 0)}</Badge> : <span className="text-xs text-muted md:hidden">{sub}</span>}
        </div>
      </Link>
      {action}
    </div>
  )
}
