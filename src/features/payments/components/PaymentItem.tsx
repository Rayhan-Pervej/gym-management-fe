import { Ban, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCan } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { cn } from '@/shared/lib/cn'
import { errorMessage } from '@/shared/lib/errors'
import { Badge, Button, IconButton, Input, Modal } from '@/shared/ui'
import { useVoidPayment, type Payment } from '../api/payments'
import { METHOD_ICON } from './methodIcons'

export function PaymentItem({ payment: p, showMember }: { payment: Payment; showMember?: boolean }) {
  const { t } = useTranslation()
  const { money, dateTime } = useFmt()
  const canVoid = useCan('payments.void')
  const [voiding, setVoiding] = useState(false)
  const [reason, setReason] = useState('')
  const voidIt = useVoidPayment()
  const Icon = METHOD_ICON[p.method]

  const share = async () => {
    try {
      navigator.share ? await navigator.share({ url: p.receipt_url }) : await navigator.clipboard.writeText(p.receipt_url).then(() => toast.success(t('payments.linkCopied')))
    } catch { /* dismissed */ }
  }

  const confirm = () =>
    voidIt.mutate({ id: p.id, reason: reason.trim() }, { onSuccess: () => { toast.success(t('payments.voided')); setVoiding(false) }, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', p.is_void ? 'bg-surface-2 text-muted' : 'bg-success-soft text-success')}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('font-bold', p.is_void && 'text-muted line-through')}>{money(p.amount_minor)}</p>
        <p className="truncate text-xs text-muted">
          {showMember && p.member_name && `${p.member_name} · `}{t(`methods.${p.method}`)} · {dateTime(p.paid_at)}
        </p>
        {p.is_void && <p className="truncate text-xs text-danger">{t('payments.voidReason')}: {p.void_reason}</p>}
      </div>
      {p.is_void ? (
        <Badge tone="danger">{t('payments.void')}</Badge>
      ) : (
        <>
          <IconButton label={t('payments.shareReceipt')} onClick={share}><Share2 className="size-4" /></IconButton>
          {canVoid && <IconButton label={t('payments.voidAction')} onClick={() => setVoiding(true)}><Ban className="size-4" /></IconButton>}
        </>
      )}
      <Modal open={voiding} onClose={() => setVoiding(false)} title={t('payments.voidAction')} description={t('payments.voidHint')}>
        <div className="space-y-4">
          <Input label={t('payments.voidReason')} value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVoiding(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" disabled={reason.trim().length < 3} loading={voidIt.isPending} onClick={confirm}>{t('payments.voidAction')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
