import { Ban, Receipt, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCan } from '@/core/auth/store'
import { config } from '@/core/config'
import { METHOD_ICON } from '@/features/payments/components/methodIcons'
import { useFmt } from '@/shared/hooks/useFmt'
import { cn } from '@/shared/lib/cn'
import { errorMessage } from '@/shared/lib/errors'
import { shareLink } from '@/shared/lib/share'
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, Input, ListSkeleton, Modal, Pagination } from '@/shared/ui'
import { useSales, useVoidSale, type Sale } from '../api/shop'

function SaleRow({ sale: s }: { sale: Sale }) {
  const { t } = useTranslation()
  const { money, dateTime } = useFmt()
  const canVoid = useCan('shop.manage')
  const voidIt = useVoidSale()
  const [voiding, setVoiding] = useState(false)
  const [reason, setReason] = useState('')
  const Icon = METHOD_ICON[s.method]
  const summary = s.items.map((i) => `${i.product_name} × ${i.quantity}`).join(', ')

  const confirm = () =>
    voidIt.mutate({ id: s.id, reason: reason.trim() }, { onSuccess: () => { toast.success(t('shop.saleVoided')); setVoiding(false) }, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', s.is_void ? 'bg-surface-2 text-muted' : 'bg-success-soft text-success')}><Icon className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className={cn('font-bold', s.is_void && 'text-muted line-through')}>{money(s.total_minor)}</p>
        <p className="truncate text-xs text-muted">{summary}</p>
        <p className="truncate text-xs text-muted">{s.member ? `${s.member.name} · ` : ''}{t(`methods.${s.method}`)} · {dateTime(s.sold_at)}</p>
        {s.is_void && <p className="truncate text-xs text-danger">{t('payments.voidReason')}: {s.void_reason}</p>}
      </div>
      {s.is_void ? <Badge tone="danger">{t('payments.void')}</Badge> : (
        <>
          <IconButton label={t('payments.shareReceipt')} onClick={() => shareLink(s.receipt_url)}><Share2 className="size-4" /></IconButton>
          {canVoid && <IconButton label={t('payments.voidAction')} onClick={() => setVoiding(true)}><Ban className="size-4" /></IconButton>}
        </>
      )}
      {voiding && (
        <Modal open onClose={() => setVoiding(false)} title={t('payments.voidAction')} description={t('shop.voidHint')}>
          <div className="space-y-4">
            <Input label={t('payments.voidReason')} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVoiding(false)}>{t('common.cancel')}</Button>
              <Button variant="danger" disabled={reason.trim().length < 3} loading={voidIt.isPending} onClick={confirm}>{t('payments.voidAction')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function SalesList() {
  const { t } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [voided, setVoided] = useState(false)
  const [page, setPage] = useState(1)
  const list = useSales({ date_from: from || undefined, date_to: to || undefined, include_voided: voided, page })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input type="date" label={t('common.from')} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        <Input type="date" label={t('common.to')} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        <label className="flex h-11 items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={voided} onChange={(e) => setVoided(e.target.checked)} />
          {t('payments.showVoided')}
        </label>
      </div>
      <Card className="overflow-hidden">
        {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : list.data?.results.length === 0 ? (
          <EmptyState icon={Receipt} title={t('shop.noSales')} />
        ) : (
          <div className="divide-y divide-border">{list.data?.results.map((s) => <SaleRow key={s.id} sale={s} />)}</div>
        )}
        <Pagination page={page} count={list.data?.count ?? 0} pageSize={config.pageSize} onChange={setPage} />
      </Card>
    </div>
  )
}
