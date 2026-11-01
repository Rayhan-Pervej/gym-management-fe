import { Banknote, Download, PackageX, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFmt } from '@/shared/hooks/useFmt'
import { downloadFile } from '@/shared/lib/csv'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, Input, StatCard } from '@/shared/ui'
import { useShopReport } from '../api/shop'

export function ShopReport() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const report = useShopReport(from, to)
  const d = report.data

  if (report.isError) return <ErrorState onRetry={() => report.refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input type="date" label={t('common.from')} value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label={t('common.to')} value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="outline" icon={<Download className="size-4" />} onClick={() => downloadFile('/reports/shop', { format: 'csv', date_from: from, date_to: to }, 'shop.csv')}>{t('common.exportCsv')}</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard loading={report.isLoading} icon={Banknote} tone="success" label={t('shop.takings')} value={d && money(d.summary.total_minor)} />
        <StatCard loading={report.isLoading} icon={ShoppingBag} label={t('shop.salesCount')} value={d && num(d.summary.sales_count)} />
        <StatCard loading={report.isLoading} icon={PackageX} tone="warning" label={t('shop.itemsSold')} value={d && num(d.summary.items_sold)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title={t('shop.byProduct')} />
          <div className="mt-2 divide-y divide-border">
            {d?.by_product.length === 0 && <EmptyState icon={ShoppingBag} title={t('shop.noSales')} />}
            {d?.by_product.map((r) => (
              <div key={r.product_id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0"><p className="truncate font-semibold">{r.name}</p><p className="text-xs text-muted">{t('shop.unitsSold', { count: r.quantity })}</p></div>
                <span className="font-bold">{money(r.revenue_minor)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title={t('shop.lowStock')} />
          <div className="mt-2 divide-y divide-border">
            {d?.low_stock.length === 0 && <EmptyState icon={PackageX} title={t('shop.noLowStock')} />}
            {d?.low_stock.map((r) => (
              <div key={r.product_id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="truncate font-semibold">{r.name}</p>
                <Badge tone={r.stock_qty <= 0 ? 'danger' : 'warning'}>{t('shop.inStock', { count: r.stock_qty })}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
