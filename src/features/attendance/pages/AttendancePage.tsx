import { CalendarCheck, LogIn, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCan } from '@/core/auth/store'
import { useMembers } from '@/features/members/api/members'
import { StatusBadge } from '@/features/members/components/StatusBadge'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { todayIn } from '@/shared/lib/format'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, ListSkeleton, PageHeader } from '@/shared/ui'
import { useAttendance, useCheckIn } from '../api/attendance'

export default function AttendancePage() {
  const { t } = useTranslation()
  const { tz, dateTime } = useFmt()
  const [date, setDate] = useState(() => todayIn(tz))
  const [q, setQ] = useState('')
  const canCheckIn = useCan('attendance.manage')
  const search = useDebounce(q, 250)
  const found = useMembers({ q: search }, canCheckIn)
  const log = useAttendance(date)
  const checkIn = useCheckIn()
  const rows = Array.isArray(log.data) ? log.data : (log.data?.results ?? [])

  const go = (id: string) =>
    checkIn.mutate(id, {
      onSuccess: (r) => {
        r.already_checked_in ? toast.info(t('attendance.already')) : toast.success(t('attendance.checkedIn'))
        r.warnings.forEach((w) => toast.warning(t(`warnings.${w}`, { defaultValue: w })))
        setQ('')
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  return (
    <>
      <PageHeader title={t('nav.attendance')} subtitle={t('attendance.count', { count: rows.length })} />
      <div className={canCheckIn ? 'grid gap-5 lg:grid-cols-2' : ''}>
        {canCheckIn && <Card>
          <CardHeader title={t('attendance.quickCheckIn')} />
          <CardBody className="space-y-3">
            <Input icon={<Search className="size-4" />} placeholder={t('members.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            {search.length >= 2 && (
              <div className="-mx-2 divide-y divide-border">
                {found.isLoading ? <ListSkeleton rows={3} /> : found.data?.results.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-2 py-2.5">
                    <Avatar name={m.name} src={m.photo_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5"><StatusBadge status={m.status} />{m.has_dues && <Badge tone="danger">{t('members.hasDues')}</Badge>}</div>
                    </div>
                    <Button size="sm" icon={<LogIn className="size-4" />} loading={checkIn.isPending && checkIn.variables === m.id} onClick={() => go(m.id)}>{t('attendance.checkIn')}</Button>
                  </div>
                ))}
                {found.data?.results.length === 0 && <p className="py-4 text-center text-sm text-muted">{t('members.empty')}</p>}
              </div>
            )}
          </CardBody>
        </Card>}

        <Card>
          <CardHeader title={t('attendance.today')} action={<input type="date" value={date} max={todayIn(tz)} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm" />} />
          {log.isLoading ? <ListSkeleton rows={4} /> : rows.length === 0 ? <EmptyState icon={CalendarCheck} title={t('attendance.empty')} /> : (
            <div className="mt-2 divide-y divide-border">
              {rows.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Avatar name={a.member_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.member_name}</p>
                    <p className="text-xs text-muted">{a.member_code} · {dateTime(a.checked_in_at)}</p>
                  </div>
                  <StatusBadge status={a.status_at_checkin} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
