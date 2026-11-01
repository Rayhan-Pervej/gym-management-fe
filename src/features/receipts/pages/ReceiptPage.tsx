import { CheckCircle2, Printer, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { LanguageSwitch, Logo, ThemeToggle } from '@/shared/components/Preferences'
import { formatDate, formatDateTime, formatMoney } from '@/shared/lib/format'
import { useLang } from '@/core/i18n'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/shared/ui'
import { useReceipt } from '@/features/payments/api/payments'

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4 py-2.5 text-sm"><span className="text-muted">{k}</span><span className="text-end font-semibold">{v}</span></div>
)

export default function ReceiptPage() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const { data: r, isLoading, isError } = useReceipt(token)
  const valid = r?.status === 'valid'

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-md items-center justify-between p-4 print:hidden">
        <Logo />
        <div className="flex"><LanguageSwitch /><ThemeToggle /></div>
      </div>
      <div className="mx-auto max-w-md px-4 pb-10">
        {isLoading ? <Skeleton className="h-96 rounded-3xl" /> : isError || !r ? (
          <Card><EmptyState icon={XCircle} title={t('receipt.notFound')} /></Card>
        ) : (
          <Card className="overflow-hidden">
            <div className={`flex flex-col items-center gap-2 px-6 py-8 text-center ${valid ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
              {valid ? <CheckCircle2 className="size-10" /> : <XCircle className="size-10" />}
              <p className="text-3xl font-extrabold">{formatMoney(r.amount_minor, r.currency, lang)}</p>
              <Badge tone={valid ? 'success' : 'danger'}>{t(valid ? 'receipt.valid' : 'receipt.void')}</Badge>
            </div>
            <div className="divide-y divide-border px-6 py-2">
              <Row k={t('receipt.gym')} v={r.gym_name} />
              <Row k={t('receipt.no')} v={r.receipt_no} />
              <Row k={t('members.name')} v={`${r.member_name} (${r.member_code})`} />
              <Row k={t('receipt.plan')} v={r.plan_name} />
              <Row k={t('receipt.period')} v={`${formatDate(r.period.start, lang)} → ${formatDate(r.period.end, lang)}`} />
              <Row k={t('payments.method')} v={t(`methods.${r.method}`)} />
              <Row k={t('receipt.date')} v={formatDateTime(r.paid_at, lang)} />
              <Row k={t('members.due')} v={formatMoney(r.membership_due_minor, r.currency, lang)} />
            </div>
            <div className="p-4 print:hidden"><Button variant="outline" className="w-full" icon={<Printer className="size-4" />} onClick={() => window.print()}>{t('receipt.print')}</Button></div>
          </Card>
        )}
      </div>
    </div>
  )
}
