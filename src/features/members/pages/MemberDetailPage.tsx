import { Archive, ArrowLeft, ArrowRightLeft, CalendarCheck, CreditCard, Dumbbell, Pencil, Phone, RefreshCw, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useActiveBranches, useCan } from '@/core/auth/store'
import { useCheckIn } from '@/features/attendance/api/attendance'
import { useMemberPayments } from '@/features/payments/api/payments'
import { SessionsModal } from '@/features/training/components/SessionsModal'
import { PaymentItem } from '@/features/payments/components/PaymentItem'
import { RecordPaymentModal } from '@/features/payments/components/RecordPaymentModal'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, ErrorState, ListSkeleton, Skeleton } from '@/shared/ui'
import { useMember, useMemberships, useUpdateMember } from '../api/members'
import { AssignPlanModal } from '../components/AssignPlanModal'
import { TransferModal } from '../components/TransferModal'
import { MemberFormModal } from '../components/MemberFormModal'
import { expiryText } from '../components/MemberRow'
import { StatusBadge } from '../components/StatusBadge'
import type { Membership } from '../types'

const stateTone = { active: 'success', upcoming: 'info', expired: 'neutral' } as const

export default function MemberDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { money, num, date } = useFmt()
  const member = useMember(id)
  const memberships = useMemberships(id)
  const payments = useMemberPayments(id)
  const update = useUpdateMember(id)
  const checkIn = useCheckIn()
  const [editing, setEditing] = useState(false)
  const [assigning, setAssigning] = useState<'access' | 'pt'>()
  const [sessionsFor, setSessionsFor] = useState<{ id: string; title: string }>()
  const [paying, setPaying] = useState<Membership>()
  const [archiving, setArchiving] = useState(false)
  const canManage = useCan('members.manage')
  const canTransfer = useCan('members.transfer') && useActiveBranches().length > 1
  const [transferring, setTransferring] = useState(false)
  const canMemberships = useCan('memberships.manage')
  const canPay = useCan('payments.record')
  const canCheckIn = useCan('attendance.manage')

  if (member.isLoading) return <Skeleton className="h-64" />
  if (member.isError || !member.data) return <ErrorState onRetry={() => member.refetch()} />
  const m = member.data
  const history = memberships.data?.results ?? []
  const hasMoney = m.due_minor !== undefined
  const payable = history.find((x) => x.due_minor > 0)

  const doCheckIn = () =>
    checkIn.mutate(m.id, {
      onSuccess: (r) => {
        r.already_checked_in ? toast.info(t('attendance.already')) : toast.success(t('attendance.checkedIn'))
        r.warnings.forEach((w) => toast.warning(t(`warnings.${w}`, { defaultValue: w })))
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  const toggleArchive = () =>
    update.mutate({ is_archived: !m.is_archived } as never, { onSuccess: () => { setArchiving(false); toast.success(t('common.saved')) }, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div className="space-y-5">
      <Link to="/members" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t('nav.members')}
      </Link>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <Avatar name={m.name} src={m.photo_url} className="size-16 text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold">{m.name}</h1>
              <StatusBadge status={m.status} />
              {m.is_archived && <Badge>{t('members.archived')}</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">{m.member_code}</p>
            <a href={`tel:${m.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary"><Phone className="size-4" />{m.phone}</a>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {canCheckIn && <Button icon={<CalendarCheck className="size-4" />} loading={checkIn.isPending} onClick={doCheckIn}>{t('attendance.checkIn')}</Button>}
            {canManage && <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
            {canTransfer && !m.is_archived && <Button variant="outline" icon={<ArrowRightLeft className="size-4" />} onClick={() => setTransferring(true)}>{t('transfer.action')}</Button>}
            {canManage && <Button variant="ghost" icon={m.is_archived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />} onClick={() => setArchiving(true)}>{m.is_archived ? t('members.restore') : t('members.archive')}</Button>}
          </div>
        </CardBody>
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border rtl:divide-x-reverse sm:grid-cols-3">
          <Info label={t('members.currentPlan')} value={m.current_membership?.plan_name ?? '—'} />
          <Info label={t('members.validity')} value={expiryText(m, t, num, date) || '—'} />
          {hasMoney ? <Info label={t('members.due')} value={money(m.due_minor ?? 0)} danger={m.has_dues} className="col-span-2 border-t border-border sm:col-span-1 sm:border-t-0" /> : <Info label={t('members.trainer')} value={m.assigned_trainer?.name ?? '—'} className="col-span-2 border-t border-border sm:col-span-1 sm:border-t-0" />}
        </div>
      </Card>

      {(canMemberships || canPay) && <div className="flex flex-wrap gap-2">
        {canMemberships && <Button icon={<RefreshCw className="size-4" />} onClick={() => setAssigning('access')} disabled={m.is_archived}>{m.status === 'no_membership' ? t('members.assignPlan') : t('members.renew')}</Button>}
        {canMemberships && <Button variant="outline" icon={<Dumbbell className="size-4" />} onClick={() => setAssigning('pt')} disabled={m.is_archived}>{t('training.addPackage')}</Button>}
        {canPay && payable && <Button variant="secondary" icon={<CreditCard className="size-4" />} onClick={() => setPaying(payable)}>{t('payments.record')}</Button>}
      </div>}

      {canMemberships && <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('members.memberships')} />
          {memberships.isLoading ? <ListSkeleton rows={3} /> : history.length === 0 ? <EmptyState title={t('members.noMemberships')} /> : (
            <div className="mt-2 divide-y divide-border">
              {history.map((ms) => (
                <div key={ms.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{ms.plan_name} {ms.kind === 'pt' && <Badge tone="info">{t('plans.kind_pt')}</Badge>} <Badge tone={stateTone[ms.state]}>{t(`membershipState.${ms.state}`)}</Badge></p>
                    {ms.kind === 'pt' && <p className="text-xs text-muted">{ms.trainer?.name} · {t('training.sessionsLeft', { count: ms.sessions_left ?? 0 })} / {ms.sessions_total}</p>}
                    <p className="text-xs text-muted">{date(ms.start_date)} → {date(ms.end_date)}</p>
                    {!!ms.discount_minor && <p className="text-xs font-medium text-success">{t('discount.applied', { amount: money(ms.discount_minor) })}{ms.discount_reason && ` · ${ms.discount_reason}`}</p>}
                    <p className="text-xs text-muted">{t('payments.paid')} {money(ms.paid_minor)} / {money(ms.charged_minor)}</p>
                  </div>
                  {ms.kind === 'pt' && <Button size="sm" variant="secondary" icon={<Dumbbell className="size-4" />} onClick={() => setSessionsFor({ id: ms.id, title: ms.plan_name })}>{t('training.sessions')}</Button>}
                  {ms.due_minor > 0 ? (canPay ? <Button size="sm" onClick={() => setPaying(ms)}>{money(ms.due_minor)}</Button> : <Badge tone="danger">{money(ms.due_minor)}</Badge>) : <Badge tone="success">{t('payments.settled')}</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {canPay && <Card>
          <CardHeader title={t('nav.payments')} />
          {payments.isLoading ? <ListSkeleton rows={3} /> : payments.data?.results.length === 0 ? <EmptyState title={t('payments.empty')} /> : (
            <div className="mt-2 divide-y divide-border">{payments.data?.results.map((p) => <PaymentItem key={p.id} payment={p} />)}</div>
          )}
        </Card>}
      </div>}

      {!canMemberships && !!m.pt_packages?.length && (
        <Card>
          <CardHeader title={t('training.packages')} />
          <div className="mt-2 divide-y divide-border">
            {m.pt_packages.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.plan_name}</p>
                  <p className="text-xs text-muted">{p.trainer.name} · {t('training.sessionsLeft', { count: p.sessions_left })} / {p.sessions_total} · {date(p.end_date)}</p>
                </div>
                <Button size="sm" variant="secondary" icon={<Dumbbell className="size-4" />} onClick={() => setSessionsFor({ id: p.id, title: p.plan_name })}>{t('training.sessions')}</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(m.address || m.notes || m.emergency_contact_name || m.assigned_trainer) && (

        <Card>
          <CardBody className="grid gap-3 text-sm sm:grid-cols-3">
            {m.assigned_trainer && hasMoney && <Info plain label={t('members.trainer')} value={m.assigned_trainer.name} />}
            {m.address && <Info plain label={t('members.address')} value={m.address} />}
            {m.emergency_contact_name && <Info plain label={t('members.emergencyName')} value={`${m.emergency_contact_name} ${m.emergency_contact_phone}`} />}
            {m.notes && <Info plain label={t('members.notes')} value={m.notes} />}
          </CardBody>
        </Card>
      )}

      {editing && <MemberFormModal open onClose={() => setEditing(false)} member={m} />}
      {transferring && <TransferModal member={m} onClose={() => setTransferring(false)} />}
      {assigning && <AssignPlanModal open onClose={() => setAssigning(undefined)} member={m} initialKind={assigning} />}
      {sessionsFor && <SessionsModal membershipId={sessionsFor.id} title={sessionsFor.title} description={m.name} onClose={() => setSessionsFor(undefined)} />}
      {paying && <RecordPaymentModal open onClose={() => setPaying(undefined)} membership={paying} />}
      <ConfirmDialog open={archiving} title={m.is_archived ? t('members.restore') : t('members.archive')} message={m.is_archived ? t('members.restoreConfirm') : t('members.archiveConfirm')} loading={update.isPending} onConfirm={toggleArchive} onClose={() => setArchiving(false)} />
    </div>
  )
}

function Info({ label, value, danger, plain, className }: { label: string; value: string; danger?: boolean; plain?: boolean; className?: string }) {
  return (
    <div className={`${plain ? '' : 'p-4'} ${className ?? ''}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-0.5 font-semibold ${danger ? 'text-danger' : ''}`}>{value}</p>
    </div>
  )
}
