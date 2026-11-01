import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { useCan } from '@/core/auth/store'
import { toMinor } from '@/shared/lib/format'
import { Button, EmptyState, Input, Modal, Segmented, Select, Skeleton } from '@/shared/ui'
import { usePlans } from '@/features/plans/api/plans'
import { asList, useTrainers } from '@/features/staff/api/staff'
import { ApiError } from '@/core/api/client'
import { useAssignMembership } from '../api/members'
import type { Member } from '../types'

type Props = { open: boolean; onClose: () => void; member: Member; initialKind?: 'access' | 'pt' }

export function AssignPlanModal({ open, onClose, member, initialKind = 'access' }: Props) {
  const { t } = useTranslation()
  const { money, date } = useFmt()
  const plans = usePlans(true)
  const assign = useAssignMembership(member.id)
  const [planId, setPlanId] = useState('')
  const [kind, setKind] = useState<'access' | 'pt'>(initialKind)
  const [trainerId, setTrainerId] = useState(member.assigned_trainer?.id ?? '')
  const trainers = asList(useTrainers(kind === 'pt').data)
  const isPt = kind === 'pt'
  const [startFrom, setStartFrom] = useState<'today' | 'previous_end'>('today')
  const canDiscount = useCan('discounts.apply')
  const [giveDiscount, setGiveDiscount] = useState(false)
  const [mode, setMode] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const lapsed = member.status === 'expired' && !isPt
  const hasPrior = member.status !== 'no_membership'

  const plan = plans.data?.results.find((p) => p.id === planId)
  const base = plan ? plan.price_minor + (hasPrior || isPt ? 0 : plan.admission_fee_minor) : 0
  const raw = Number(value) || 0
  const discount = !giveDiscount || !plan ? 0 : mode === 'percent' ? Math.round((base * raw) / 100) : toMinor(raw)
  const discountOk = !giveDiscount || (raw > 0 && discount <= base && reason.trim().length >= 2 && (mode !== 'percent' || raw <= 100))

  const submit = () =>
    assign.mutate(
      {
        plan_id: planId,
        ...(lapsed ? { start_from: startFrom } : {}),
        ...(isPt ? { trainer_id: trainerId } : {}),
        ...(giveDiscount && discount > 0 ? { ...(mode === 'percent' ? { discount_percent: value } : { discount_minor: discount }), discount_reason: reason.trim() } : {}),
      },
      {
        onSuccess: (r) => {
          toast.success(t('members.planAssigned'))
          r.warnings?.includes('membership_already_expired') && toast.warning(t('warnings.membership_already_expired'))
          r.warnings?.includes('no_active_membership') && toast.warning(t('warnings.no_active_membership'))
          onClose()
        },
        onError: (e) => {
          if (e instanceof ApiError && e.code === 'membership_overlap')
            return toast.error(t('errors.membership_overlap', { date: date(e.details.earliest_allowed_start as string) }))
          if (e instanceof ApiError && e.code === 'discount_exceeds_charge')
            return toast.error(t('errors.discount_exceeds_charge', { max: money(Number(e.details.max_allowed_minor)) }))
          toast.error(errorMessage(e))
        },
      },
    )

  const list = (plans.data?.results ?? []).filter((p) => (p.kind ?? 'access') === kind)

  return (
    <Modal open={open} onClose={onClose} title={isPt ? t('training.addPackage') : hasPrior ? t('members.renew') : t('members.assignPlan')} description={member.name}>
      <div className="space-y-4">
        <Segmented value={kind} onChange={(k) => { setKind(k); setPlanId('') }} options={[{ value: 'access', label: t('plans.kind_access') }, { value: 'pt', label: t('plans.kind_pt') }]} />
        {plans.isLoading && <Skeleton className="h-40" />}
        {plans.isSuccess && list.length === 0 && <EmptyState title={t('plans.empty')} hint={t('plans.emptyHint')} />}
        <div className="grid gap-2.5">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlanId(p.id)}
              className={cn('flex items-center justify-between rounded-2xl border p-4 text-start transition', planId === p.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2')}
            >
              <span>
                <span className="block font-semibold">{p.name}</span>
                <span className="text-xs text-muted">{t(`plans.unit_${p.duration_unit}`, { count: p.duration_value })}{isPt && ` · ${t('plans.sessionsCount', { count: p.sessions ?? 0 })}`}{!hasPrior && !isPt && p.admission_fee_minor > 0 && ` · ${t('plans.admission')} ${money(p.admission_fee_minor)}`}</span>
              </span>
              <span className="text-lg font-extrabold">{money(p.price_minor)}</span>
            </button>
          ))}
        </div>
        {isPt && planId && (
          <Select label={t('training.trainer')} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            <option value="">{t('training.chooseTrainer')}</option>
            {trainers.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
          </Select>
        )}
        {canDiscount && planId && (
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              {t('discount.give')}
              <input type="checkbox" role="switch" checked={giveDiscount} onChange={(e) => setGiveDiscount(e.target.checked)} className="size-5 accent-[var(--primary)]" />
            </label>
            {giveDiscount && (
              <>
                <Segmented value={mode} onChange={setMode} options={[{ value: 'percent', label: t('discount.percent') }, { value: 'amount', label: t('discount.amount') }]} />
                <Input label={mode === 'percent' ? t('discount.percent') : t('discount.amount')} type="number" min={0} step={mode === 'percent' ? '0.01' : '1'} value={value} onChange={(e) => setValue(e.target.value)} error={discount > base ? t('errors.discount_exceeds_charge', { max: money(base) }) : undefined} />
                <Input label={t('discount.reason')} placeholder={t('discount.reasonHint')} maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} />
                {discount > 0 && discount <= base && (
                  <p className="flex justify-between rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
                    <span>{t('discount.youPay', { off: money(discount) })}</span>
                    <span>{money(base - discount)}</span>
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {lapsed && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t('members.startFrom')}</p>
            <Segmented value={startFrom} onChange={setStartFrom} options={[{ value: 'today', label: t('members.fromToday') }, { value: 'previous_end', label: t('members.fromPrevEnd') }]} />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!planId || !discountOk || (isPt && !trainerId)} loading={assign.isPending} onClick={submit}>{t('common.confirm')}</Button>
        </div>
      </div>
    </Modal>
  )
}
