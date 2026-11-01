import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ApiError } from '@/core/api/client'
import { useFmt } from '@/shared/hooks/useFmt'
import { cn } from '@/shared/lib/cn'
import { errorMessage } from '@/shared/lib/errors'
import { toMajor, toMinor } from '@/shared/lib/format'
import { Button, Input, Modal } from '@/shared/ui'
import type { Membership } from '@/features/members/types'
import { METHODS, useRecordPayment, type Method } from '../api/payments'
import { METHOD_ICON } from './methodIcons'

type Props = { open: boolean; onClose: () => void; membership: Membership }

export function RecordPaymentModal({ open, onClose, membership }: Props) {
  const { t } = useTranslation()
  const { money } = useFmt()
  const record = useRecordPayment()
  const [amount, setAmount] = useState(String(toMajor(membership.due_minor)))
  const [method, setMethod] = useState<Method>('cash')
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [requestId] = useState(() => crypto.randomUUID())
  const minor = toMinor(amount || 0)
  const valid = minor >= 1 && minor <= membership.due_minor

  const submit = () =>
    record.mutate(
      { membership_id: membership.id, amount_minor: minor, method, transaction_ref: ref.trim() || undefined, note: note.trim() || undefined, client_request_id: requestId },
      {
        onSuccess: (p) => {
          toast.success(t('payments.recorded'))
          p.warnings?.includes('duplicate_transaction_ref') && toast.warning(t('warnings.duplicate_transaction_ref'))
          onClose()
        },
        onError: (e) =>
          toast.error(e instanceof ApiError && e.code === 'payment_exceeds_due' ? t('errors.payment_exceeds_due', { max: money(Number(e.details.max_allowed_minor)) }) : errorMessage(e)),
      },
    )

  return (
    <Modal open={open} onClose={onClose} title={t('payments.record')} description={`${membership.plan_name} · ${t('members.due')} ${money(membership.due_minor)}`}>
      <div className="space-y-4">
        <Input label={t('payments.amount')} type="number" inputMode="decimal" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-bold" error={amount && !valid ? t('payments.amountRange', { max: money(membership.due_minor) }) : undefined} />
        <div className="flex gap-2">
          {[0.5, 1].map((r) => (
            <Button key={r} type="button" size="sm" variant="secondary" onClick={() => setAmount(String(toMajor(Math.round(membership.due_minor * r))))}>
              {r === 1 ? t('payments.full') : t('payments.half')}
            </Button>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('payments.method')}</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const Icon = METHOD_ICON[m]
              return (
                <button key={m} type="button" onClick={() => setMethod(m)} className={cn('flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition', method === m ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:bg-surface-2')}>
                  <Icon className="size-5" />
                  {t(`methods.${m}`)}
                </button>
              )
            })}
          </div>
        </div>
        {method !== 'cash' && <Input label={t('payments.txRef')} value={ref} maxLength={64} onChange={(e) => setRef(e.target.value)} />}
        <Input label={t('payments.note')} value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!valid} loading={record.isPending} onClick={submit}>{t('payments.record')}</Button>
        </div>
      </div>
    </Modal>
  )
}
