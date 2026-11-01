import { Banknote, Download, GitBranch, ShoppingBag, TrendingUp, UserCheck, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { downloadFile } from '@/shared/lib/csv'
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Input, PageHeader, Segmented, Skeleton, StatCard } from '@/shared/ui'
import { useOrgCollection, useOrgDashboard, useOrgDues } from '../api/overview'

function useOpenBranch() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const setBranch = useAuthStore((s) => s.setBranch)
  return (id: string, to = '/') => {
    setBranch(id)
    qc.resetQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    nav(to)
  }
}

function Line({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-extrabold' : 'font-semibold'}>{value}</span>
    </div>
  )
}

function Overview() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const open = useOpenBranch()
  const q = useOrgDashboard()
  const d = q.data
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />

  return (
    <div className="space-y-5">
      {d && !d.totals && <p className="rounded-2xl bg-warning-soft p-3 text-sm text-warning">{t('overview.mixedCurrency')}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard loading={q.isLoading} icon={Banknote} tone="success" label={t('dashboard.today')} value={d?.totals ? money(d.totals.todays_collection_minor) : undefined} />
        <StatCard loading={q.isLoading} icon={TrendingUp} label={t('dashboard.month')} value={d?.totals ? money(d.totals.month_collection_minor) : undefined} />
        <StatCard loading={q.isLoading} icon={ShoppingBag} tone="info" label={t('dashboard.shopToday')} value={d?.totals ? money(d.totals.todays_shop_sales_minor) : undefined} hint={d?.totals ? `${t('dashboard.shopMonth')} ${money(d.totals.month_shop_sales_minor)}` : undefined} />
        <StatCard loading={q.isLoading} icon={Wallet} tone="danger" label={t('dashboard.dues')} value={d?.totals ? money(d.totals.total_dues_minor) : undefined} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {q.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        {d?.branches.map((b) => (
          <Card key={b.branch_id}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-bold"><GitBranch className="size-4 text-primary" />{b.branch_name}</h3>
                <Button size="sm" variant="ghost" onClick={() => open(b.branch_id)}>{t('overview.open')}</Button>
              </div>
              <div className="divide-y divide-border">
                <Line label={t('dashboard.active')} value={<span className="inline-flex items-center gap-1.5"><UserCheck className="size-3.5 text-success" />{num(b.active_members)}</span>} />
                <Line label={t('dashboard.expiring')} value={num(b.expiring_soon_members)} />
                <Line label={t('dashboard.expired')} value={num(b.expired_last_30d_members)} />
                <Line label={t('dashboard.today')} value={money(b.todays_collection_minor)} />
                <Line label={t('dashboard.month')} value={money(b.month_collection_minor)} strong />
                <Line label={t('dashboard.shopToday')} value={money(b.todays_shop_sales_minor)} />
                <Line label={t('dashboard.dues')} value={<span className={b.total_dues_minor > 0 ? 'text-danger' : ''}>{money(b.total_dues_minor)}</span>} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Table({ head, rows, total }: { head: string[]; rows: ReactNode[][]; total?: ReactNode[] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="border-b border-border text-xs text-muted">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-semibold' : ''}`}>{c}</td>)}</tr>)}
        </tbody>
        {total && <tfoot className="border-t-2 border-border bg-surface-2 font-extrabold"><tr>{total.map((c, j) => <td key={j} className="px-4 py-3">{c}</td>)}</tr></tfoot>}
      </table>
    </Card>
  )
}

function Collection() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const q = useOrgCollection(from, to)
  const d = q.data
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input type="date" label={t('common.from')} value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label={t('common.to')} value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="outline" icon={<Download className="size-4" />} onClick={() => downloadFile('/org/reports/collection', { format: 'csv', date_from: from, date_to: to }, 'collection-by-branch.csv')}>{t('common.exportCsv')}</Button>
      </div>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : (
        <Table
          head={[t('overview.branch'), t('overview.memberships'), t('overview.payments'), t('overview.shop'), t('overview.sales'), t('overview.total')]}
          rows={(d?.branches ?? []).map((b) => [b.branch_name, money(b.membership_collected_minor), num(b.payments_count), money(b.shop_sales_minor), num(b.sales_count), <b key="t">{money(b.total_minor)}</b>])}
          total={d?.totals ? [t('overview.total'), money(d.totals.membership_collected_minor), num(d.totals.payments_count), money(d.totals.shop_sales_minor), num(d.totals.sales_count), money(d.totals.total_minor)] : undefined}
        />
      )}
    </div>
  )
}

function Dues() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const q = useOrgDues()
  const d = q.data
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="outline" icon={<Download className="size-4" />} onClick={() => downloadFile('/org/reports/dues', { format: 'csv' }, 'dues-by-branch.csv')}>{t('common.exportCsv')}</Button></div>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : d?.branches.length === 0 ? <Card><EmptyState icon={Wallet} title={t('dashboard.noDues')} /></Card> : (
        <Table
          head={[t('overview.branch'), t('overview.owed'), t('overview.membersOwing')]}
          rows={(d?.branches ?? []).map((b) => [b.branch_name, <Badge key="o" tone={b.total_dues_minor > 0 ? 'danger' : 'success'}>{money(b.total_dues_minor)}</Badge>, num(b.members_with_dues)])}
          total={d?.totals ? [t('overview.total'), money(d.totals.total_dues_minor), num(d.totals.members_with_dues)] : undefined}
        />
      )}
    </div>
  )
}

export default function OverviewPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'overview' | 'collection' | 'dues'>('overview')
  return (
    <>
      <PageHeader title={t('nav.overview')} subtitle={t('overview.subtitle')} />
      <div className="mb-4 overflow-x-auto">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'overview', label: t('overview.tabOverview') }, { value: 'collection', label: t('overview.tabCollection') }, { value: 'dues', label: t('overview.tabDues') }]} />
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'collection' && <Collection />}
      {tab === 'dues' && <Dues />}
    </>
  )
}
