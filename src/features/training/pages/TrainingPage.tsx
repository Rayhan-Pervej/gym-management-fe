import { Download, Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCan } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { downloadFile } from '@/shared/lib/csv'
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Pagination, Segmented, StatCard } from '@/shared/ui'
import { Banknote } from 'lucide-react'
import { usePtPackages, useTrainerReport, type PtPackage } from '../api/training'
import { SessionsModal } from '../components/SessionsModal'

function PackageCard({ p, onOpen }: { p: PtPackage; onOpen: () => void }) {
  const { t } = useTranslation()
  const { date, num } = useFmt()
  const pct = p.sessions_total ? Math.round((p.sessions_used / p.sessions_total) * 100) : 0
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/members/${p.member.id}`} className="block truncate font-semibold hover:text-primary">{p.member.name}</Link>
          <p className="truncate text-xs text-muted">{p.member.member_code} · {p.plan_name}</p>
        </div>
        <Badge tone={p.state === 'active' ? 'success' : p.state === 'upcoming' ? 'info' : 'neutral'}>{t(`membershipState.${p.state}`)}</Badge>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium">
          <span>{t('training.sessionsLeft', { count: p.sessions_left })}</span>
          <span className="text-muted">{num(p.sessions_used)} / {num(p.sessions_total)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
      </div>
      <p className="mt-3 text-xs text-muted">{p.trainer.name} · {date(p.start_date)} → {date(p.end_date)}</p>
      <Button size="sm" variant="secondary" className="mt-3 w-full" icon={<Dumbbell className="size-4" />} onClick={onOpen}>{t('training.sessions')}</Button>
    </Card>
  )
}

function Packages() {
  const { t } = useTranslation()
  const [active, setActive] = useState(true)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<PtPackage>()
  const list = usePtPackages(active, page)
  const items = list.data?.results ?? []

  return (
    <>
      <Segmented className="mb-4" value={active ? 'active' : 'all'} onChange={(v) => { setActive(v === 'active'); setPage(1) }} options={[{ value: 'active', label: t('training.activeOnly') }, { value: 'all', label: t('common.all') }]} />
      {list.isLoading ? <Card><ListSkeleton rows={3} /></Card> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : items.length === 0 ? (
        <Card><EmptyState icon={Dumbbell} title={t('training.empty')} hint={t('training.emptyHint')} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PackageCard key={p.id} p={p} onOpen={() => setOpen(p)} />)}</div>
      )}
      <Pagination page={page} count={list.data?.count ?? 0} pageSize={25} onChange={setPage} />
      {open && <SessionsModal membershipId={open.id} title={open.member.name} description={`${open.plan_name} · ${open.trainer.name}`} onClose={() => setOpen(undefined)} />}
    </>
  )
}

function Report() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const report = useTrainerReport(from, to)
  const rows = report.data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input type="date" label={t('common.from')} value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label={t('common.to')} value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="outline" icon={<Download className="size-4" />} onClick={() => downloadFile('/reports/trainers', { format: 'csv', date_from: from, date_to: to }, 'trainers.csv')}>{t('common.exportCsv')}</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard loading={report.isLoading} icon={Dumbbell} label={t('training.totalSessions')} value={report.data && num(report.data.total_sessions)} />
        <StatCard loading={report.isLoading} icon={Banknote} tone="success" label={t('training.ptRevenue')} value={report.data && money(report.data.total_pt_revenue_minor)} />
      </div>
      <Card className="overflow-x-auto">
        {report.isError ? <ErrorState onRetry={() => report.refetch()} /> : (
          <CardBody className="p-0">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="border-b border-border text-start text-xs text-muted">
                <tr>{['trainer', 'sessions', 'clients', 'revenue', 'assigned'].map((k) => <th key={k} className="px-4 py-3 text-start font-medium">{t(`training.col_${k}`)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.trainer_id}>
                    <td className="px-4 py-3 font-semibold">{r.trainer_name}</td>
                    <td className="px-4 py-3">{num(r.sessions_delivered)}</td>
                    <td className="px-4 py-3">{num(r.clients_served)}</td>
                    <td className="px-4 py-3">{money(r.pt_revenue_minor)}</td>
                    <td className="px-4 py-3">{num(r.assigned_members)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report.isLoading && rows.length === 0 && <EmptyState icon={Dumbbell} title={t('training.noTrainers')} />}
          </CardBody>
        )}
      </Card>
    </div>
  )
}

export default function TrainingPage() {
  const { t } = useTranslation()
  const canReport = useCan('reports.view')
  const [tab, setTab] = useState<'packages' | 'report'>('packages')
  return (
    <>
      <PageHeader title={t('nav.training')} />
      {canReport && <Segmented className="mb-4" value={tab} onChange={setTab} options={[{ value: 'packages', label: t('training.packages') }, { value: 'report', label: t('training.report') }]} />}
      {tab === 'report' && canReport ? <Report /> : <Packages />}
    </>
  )
}
