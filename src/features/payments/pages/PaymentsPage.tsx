import { CreditCard, Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCan } from '@/core/auth/store'
import { config } from '@/core/config'
import { downloadFile } from '@/shared/lib/csv'
import { Button, Card, Chips, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Pagination } from '@/shared/ui'
import { METHODS, usePayments, type Method } from '../api/payments'
import { PaymentItem } from '../components/PaymentItem'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const canExport = useCan('reports.view')
  const [method, setMethod] = useState<Method | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [voided, setVoided] = useState(false)
  const [page, setPage] = useState(1)
  const filters = { method, date_from: from || undefined, date_to: to || undefined, include_voided: voided, page }
  const list = usePayments(filters)

  const csv = () => downloadFile('/reports/payments', { format: 'csv', method: method || undefined, date_from: from, date_to: to }, 'payments.csv')

  return (
    <>
      <PageHeader title={t('nav.payments')} actions={canExport && <Button variant="outline" icon={<Download className="size-4" />} onClick={csv}>{t('common.exportCsv')}</Button>} />
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Input type="date" label={t('common.from')} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          <Input type="date" label={t('common.to')} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>
        <Chips value={method} onChange={(v) => { setMethod(v); setPage(1) }} options={[{ value: '' as Method | '', label: t('common.all') }, ...METHODS.map((m) => ({ value: m as Method | '', label: t(`methods.${m}`) }))]} />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={voided} onChange={(e) => setVoided(e.target.checked)} />
          {t('payments.showVoided')}
        </label>
      </div>
      <Card className="overflow-hidden">
        {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : list.data?.results.length === 0 ? (
          <EmptyState icon={CreditCard} title={t('payments.empty')} />
        ) : (
          <div className="divide-y divide-border">{list.data?.results.map((p) => <PaymentItem key={p.id} payment={p} showMember />)}</div>
        )}
        <Pagination page={page} count={list.data?.count ?? 0} pageSize={config.pageSize} onChange={setPage} />
      </Card>
    </>
  )
}
