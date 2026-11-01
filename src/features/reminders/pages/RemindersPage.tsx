import { BellRing, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, ListSkeleton, Modal, PageHeader, Segmented, Skeleton, Textarea, type Tone } from '@/shared/ui'
import { useNotifications, usePreviewRule, useRules, useSmsCredits, useUpdateRule, type ReminderRule } from '../api/reminders'

const statusTone: Record<string, Tone> = { sent: 'success', failed: 'danger', pending: 'info', skipped: 'neutral' }

function RuleModal({ rule, onClose }: { rule: ReminderRule; onClose: () => void }) {
  const { t } = useTranslation()
  const update = useUpdateRule()
  const preview = usePreviewRule()
  const [lang, setLang] = useState<'bn' | 'en'>('bn')
  const [f, setF] = useState({ offset_days: rule.offset_days, template_bn: rule.template_bn, template_en: rule.template_en })
  const key = `template_${lang}` as const
  const fixed = rule.trigger === 'on_expiry' || rule.trigger === 'payment_received'

  const save = () => update.mutate({ id: rule.id, ...f }, { onSuccess: () => { toast.success(t('common.saved')); onClose() }, onError: (e) => toast.error(errorMessage(e)) })
  const show = () => preview.mutate({ id: rule.id, [key]: f[key] }, { onError: (e) => toast.error(errorMessage(e)) })

  return (
    <Modal open onClose={onClose} title={t(`triggers.${rule.trigger}`)} description={t('reminders.variables')}>
      <div className="space-y-4">
        {!fixed && <Input label={t('reminders.offsetDays')} type="number" min={0} max={30} value={f.offset_days} onChange={(e) => setF({ ...f, offset_days: Number(e.target.value) })} />}
        <Segmented value={lang} onChange={setLang} options={[{ value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' }]} />
        <Textarea label={t('reminders.template')} rows={4} maxLength={320} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} hint="{member_name} {gym_name} {expiry_date} {due_amount}" />
        <Button variant="secondary" size="sm" loading={preview.isPending} onClick={show}>{t('reminders.preview')}</Button>
        {preview.data && (
          <div className="rounded-xl bg-surface-2 p-3 text-sm">
            <p>{preview.data.message}</p>
            <p className="mt-2 text-xs text-muted">{preview.data.encoding} · {preview.data.length} · {t('reminders.segments', { count: preview.data.segments })}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={update.isPending} onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function RemindersPage() {
  const { t } = useTranslation()
  const { num, dateTime } = useFmt()
  const rulesQ = useRules()
  const credits = useSmsCredits()
  const update = useUpdateRule()
  const [page, setPage] = useState(1)
  const logs = useNotifications(page)
  const [editing, setEditing] = useState<ReminderRule>()
  const rules = Array.isArray(rulesQ.data) ? rulesQ.data : (rulesQ.data?.results ?? [])

  return (
    <>
      <PageHeader title={t('nav.reminders')} />
      <Card className="mb-5">
        <CardBody className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><MessageSquare className="size-6" /></span>
          <div className="flex-1">
            <p className="text-sm text-muted">{t('dashboard.sms')}</p>
            {credits.isLoading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-extrabold">{num(credits.data?.balance ?? 0)}</p>}
          </div>
          {credits.data?.low && <Badge tone="warning">{t('reminders.low')}</Badge>}
        </CardBody>
        <p className="border-t border-border px-5 py-3 text-xs text-muted">{t('reminders.topUpHint')}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('reminders.rules')} />
          {rulesQ.isLoading ? <ListSkeleton rows={4} /> : (
            <div className="mt-2 divide-y divide-border">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <button className="min-w-0 flex-1 text-start" onClick={() => setEditing(r)}>
                    <p className="font-semibold">{t(`triggers.${r.trigger}`)}</p>
                    <p className="truncate text-xs text-muted">{r.template_bn || r.template_en}</p>
                  </button>
                  <button
                    role="switch"
                    aria-checked={r.is_active}
                    aria-label={t(`triggers.${r.trigger}`)}
                    onClick={() => update.mutate({ id: r.id, is_active: !r.is_active }, { onError: (e) => toast.error(errorMessage(e)) })}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${r.is_active ? 'bg-primary' : 'bg-border'}`}
                  >
                    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${r.is_active ? 'start-[1.375rem]' : 'start-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title={t('reminders.log')} />
          {logs.isLoading ? <ListSkeleton rows={4} /> : logs.data?.results.length === 0 ? <EmptyState icon={BellRing} title={t('reminders.logEmpty')} /> : (
            <div className="mt-2 divide-y divide-border">
              {logs.data?.results.map((n) => (
                <div key={n.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{n.member_name ?? '—'}</p>
                    <p className="text-xs text-muted">{t(`triggers.${n.trigger}`)} · {dateTime(n.created_at)}</p>
                  </div>
                  <Badge tone={statusTone[n.status]}>{t(`notifStatus.${n.status}`)}</Badge>
                </div>
              ))}
              <div className="flex justify-between p-3">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.prev')}</Button>
                <Button size="sm" variant="ghost" disabled={!logs.data?.next} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      {editing && <RuleModal rule={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}
