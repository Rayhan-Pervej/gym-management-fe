import { useTranslation } from 'react-i18next'
import { useFmt } from '@/shared/hooks/useFmt'
import { Card, CardBody, CardHeader, Skeleton } from '@/shared/ui'
import { useMonthlyCollection } from '../api/dashboard'

export function CollectionChart() {
  const { t } = useTranslation()
  const { money, lang } = useFmt()
  const { data, isLoading } = useMonthlyCollection()
  const rows = Array.isArray(data) ? data : (data?.results ?? [])
  const max = Math.max(1, ...rows.map((r) => r.collected_minor))
  const label = (m: string) => new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en', { month: 'short' }).format(new Date(`${m.slice(0, 7)}-01T00:00:00`))

  return (
    <Card className="mt-5">
      <CardHeader title={t('dashboard.monthly')} />
      <CardBody>
        {isLoading ? <Skeleton className="h-44" /> : (
          <div className="flex h-44 items-end gap-1.5 sm:gap-3" role="img" aria-label={t('dashboard.monthly')}>
            {rows.map((r) => (
              <div key={r.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={money(r.collected_minor)}>
                <div className="w-full rounded-t-lg bg-primary/80 transition group-hover:bg-primary" style={{ height: `${Math.max(3, (r.collected_minor / max) * 100)}%` }} />
                <span className="text-[10px] font-medium text-muted sm:text-xs">{label(r.month)}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
