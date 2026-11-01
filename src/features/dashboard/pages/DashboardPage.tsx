import { AlertTriangle, CalendarClock, MessageSquareWarning, TrendingUp, UserCheck, UserCog, UserX, Wallet, Banknote, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/store'
import { useMe } from '@/features/auth/api/auth'
import { DashboardRow } from '../components/DashboardRow'
import { useFmt } from '@/shared/hooks/useFmt'
import { Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, StatCard } from '@/shared/ui'
import { useDashboard } from '../api/dashboard'
import { CollectionChart } from '../components/CollectionChart'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { money, num } = useFmt()
  const gym = useAuthStore((s) => s.gym)
  const pendingRequests = useMe().data?.pending_staff_requests ?? 0
  const { data: d, isLoading, isError, refetch } = useDashboard()

  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <>
      <PageHeader title={t('dashboard.greeting', { gym: gym?.name ?? '' })} subtitle={t('dashboard.subtitle')} />

      {pendingRequests > 0 && (
        <Link to="/staff" className="mb-4 flex items-center gap-3 rounded-2xl bg-info-soft p-4 text-sm font-medium text-info">
          <UserCog className="size-5 shrink-0" />
          {t('dashboard.pendingRequests', { count: pendingRequests })}
        </Link>
      )}

      {d?.sms_credits_low && (
        <Link to="/reminders" className="mb-4 flex items-center gap-3 rounded-2xl bg-warning-soft p-4 text-sm font-medium text-warning">
          <MessageSquareWarning className="size-5 shrink-0" />
          {t('dashboard.smsLow', { n: num(d.sms_credits_balance) })}
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard loading={isLoading} icon={Banknote} tone="success" label={t('dashboard.today')} value={d && money(d.todays_collection_minor)} />
        <StatCard loading={isLoading} icon={TrendingUp} tone="primary" label={t('dashboard.month')} value={d && money(d.month_collection_minor)} />
        <StatCard loading={isLoading} icon={ShoppingBag} tone="info" label={t('dashboard.shopToday')} value={d && money(d.todays_shop_sales_minor ?? 0)} hint={d && `${t('dashboard.shopMonth')} ${money(d.month_shop_sales_minor ?? 0)}`} />
        <StatCard loading={isLoading} icon={Wallet} tone="danger" label={t('dashboard.dues')} value={d && money(d.total_dues_minor)} />
        <StatCard loading={isLoading} icon={UserCheck} tone="info" label={t('dashboard.active')} value={d && num(d.active_members)} />
        <StatCard loading={isLoading} icon={CalendarClock} tone="warning" label={t('dashboard.expiring')} value={d && num(d.expiring_soon_members)} />
        <StatCard loading={isLoading} icon={UserX} tone="neutral" label={t('dashboard.expired')} value={d && num(d.expired_last_30d_members)} hint={t('dashboard.last30')} />
        <StatCard loading={isLoading} icon={MessageSquareWarning} tone={d?.sms_credits_low ? 'warning' : 'neutral'} label={t('dashboard.sms')} value={d && num(d.sms_credits_balance)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title={<span className="flex items-center gap-2"><CalendarClock className="size-4 text-warning" />{t('dashboard.expiringList')}</span>} action={<Link to="/members" className="text-sm font-medium text-primary">{t('common.viewAll')}</Link>} />
          <div className="mt-2 divide-y divide-border">
            {d?.expiring_soon_list.length === 0 && <EmptyState icon={UserCheck} title={t('dashboard.noneExpiring')} />}
            {d?.expiring_soon_list.map((m) => <DashboardRow key={m.member_id} m={m} />)}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title={<span className="flex items-center gap-2"><AlertTriangle className="size-4 text-danger" />{t('dashboard.topDues')}</span>} action={d && <Badge tone="danger">{money(d.total_dues_minor)}</Badge>} />
          <div className="mt-2 divide-y divide-border">
            {d?.top_dues_list.length === 0 && <EmptyState icon={Wallet} title={t('dashboard.noDues')} />}
            {d?.top_dues_list.map((m) => <DashboardRow key={m.member_id} m={m} />)}
          </div>
        </Card>
      </div>

      <CollectionChart />
    </>
  )
}
