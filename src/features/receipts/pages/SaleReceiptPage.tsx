import { CheckCircle2, Printer, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useLang } from '@/core/i18n'
import { useSaleReceipt } from '@/features/shop/api/shop'
import { LanguageSwitch, Logo, ThemeToggle } from '@/shared/components/Preferences'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/shared/ui'

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4 py-2.5 text-sm"><span className="text-muted">{k}</span><span className="text-end font-semibold">{v}</span></div>
)

export default function SaleReceiptPage() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const lang = useLang()
  const { data: r, isLoading, isError } = useSaleReceipt(token)
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
              <p className="text-3xl font-extrabold">{formatMoney(r.total_minor, r.currency, lang)}</p>
              <Badge tone={valid ? 'success' : 'danger'}>{t(valid ? 'receipt.valid' : 'receipt.void')}</Badge>
            </div>
            <div className="divide-y divide-border px-6 py-2">
              <Row k={t('receipt.gym')} v={r.gym_name} />
              <Row k={t('receipt.no')} v={r.receipt_no} />
              {r.member_name && <Row k={t('members.name')} v={r.member_name} />}
              <Row k={t('payments.method')} v={t(`methods.${r.method}`)} />
              <Row k={t('receipt.date')} v={formatDateTime(r.sold_at, lang)} />
            </div>
            <div className="border-t border-border px-6 py-3">
              {r.items.map((i, n) => (
                <div key={n} className="flex justify-between gap-4 py-1.5 text-sm">
                  <span>{i.name} <span className="text-muted">× {i.quantity}</span></span>
                  <span className="font-semibold">{formatMoney(i.line_total_minor, r.currency, lang)}</span>
                </div>
              ))}
            </div>
            <div className="p-4 print:hidden"><Button variant="outline" className="w-full" icon={<Printer className="size-4" />} onClick={() => window.print()}>{t('receipt.print')}</Button></div>
          </Card>
        )}
      </div>
    </div>
  )
}
