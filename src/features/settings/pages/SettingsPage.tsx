import { Globe2, Moon, Palette } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore, useCan } from '@/core/auth/store'
import { useOrganization, useUpdateOrganization } from '@/features/branches/api/branches'
import { setLanguage, useLang } from '@/core/i18n'
import { useTheme } from '@/core/theme/theme'
import { errorMessage } from '@/shared/lib/errors'
import { Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, Segmented, Select, Skeleton } from '@/shared/ui'
import { useGymSettings, useUpdateGym, useUpdateGymSettings, type GymSettings } from '../api/settings'

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 text-sm font-medium">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--primary)]" />
    </label>
  )
}

function Preferences() {
  const { t } = useTranslation()
  const lang = useLang()
  const { theme, setTheme } = useTheme()
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><Palette className="size-4" />{t('settings.preferences')}</span>} />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium"><Globe2 className="size-4 text-muted" />{t('settings.language')}</span>
          <Segmented value={lang} onChange={setLanguage} options={[{ value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' }]} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium"><Moon className="size-4 text-muted" />{t('settings.theme')}</span>
          <Segmented value={theme} onChange={setTheme} options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: t(`theme.${v}`) }))} />
        </div>
      </CardBody>
    </Card>
  )
}

function GymProfile() {
  const { t } = useTranslation()
  const gym = useAuthStore((s) => s.gym)
  const update = useUpdateGym()
  const [f, setF] = useState({ name: gym?.name ?? '', phone: gym?.phone ?? '', address: gym?.address ?? '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  return (
    <Card>
      <CardHeader title={t('settings.gym')} action={<Badge tone="primary">{gym?.tier?.toUpperCase()}</Badge>} />
      <CardBody className="space-y-4">
        <Input label={t('auth.gymName')} value={f.name} onChange={set('name')} />
        <Input label={t('members.phone')} value={f.phone} onChange={set('phone')} />
        <Input label={t('members.address')} value={f.address} onChange={set('address')} />
        <p className="text-xs text-muted">{gym?.currency} · {gym?.timezone}</p>
        <Button loading={update.isPending} onClick={() => update.mutate(f, { onSuccess: () => toast.success(t('common.saved')), onError: (e) => toast.error(errorMessage(e)) })}>{t('common.save')}</Button>
      </CardBody>
    </Card>
  )
}

function LowCredit() {
  const { t } = useTranslation()
  const org = useOrganization()
  const update = useUpdateOrganization()
  const [v, setV] = useState<string>()
  if (!org.data) return null
  const value = v ?? String(org.data.low_credit_threshold)
  return (
    <div className="flex items-end gap-2">
      <Input wrapperClass="flex-1" label={t('settings.lowCredit')} type="number" min={0} value={value} onChange={(e) => setV(e.target.value)} hint={t('settings.lowCreditHint')} />
      <Button variant="outline" loading={update.isPending} disabled={v === undefined} onClick={() => update.mutate({ low_credit_threshold: Number(value) }, { onSuccess: () => { setV(undefined); toast.success(t('common.saved')) }, onError: (e) => toast.error(errorMessage(e)) })}>{t('common.save')}</Button>
    </div>
  )
}

function Operations() {
  const q = useGymSettings()
  if (!q.data) return <Card><CardBody><Skeleton className="h-64" /></CardBody></Card>
  return <OperationsForm initial={q.data} />
}

function OperationsForm({ initial }: { initial: GymSettings }) {
  const { t } = useTranslation()
  const update = useUpdateGymSettings()
  const [s, setS] = useState(initial)
  const patch = (p: Partial<GymSettings>) => setS({ ...s, ...p })

  return (
    <Card>
      <CardHeader title={t('settings.operations')} />
      <CardBody className="space-y-4">
        <Input label={t('settings.expiringDays')} type="number" min={1} value={s.expiring_soon_days} onChange={(e) => patch({ expiring_soon_days: Number(e.target.value) })} />
        <Select label={t('settings.renewalStart')} value={s.expired_renewal_start} onChange={(e) => patch({ expired_renewal_start: e.target.value as GymSettings['expired_renewal_start'] })}>
          <option value="today">{t('members.fromToday')}</option>
          <option value="previous_end">{t('members.fromPrevEnd')}</option>
        </Select>
        <Toggle label={t('settings.allowExpiredCheckin')} checked={s.allow_expired_checkin} onChange={(v) => patch({ allow_expired_checkin: v })} />
        <Toggle label={t('settings.smsEnabled')} checked={s.sms_enabled} onChange={(v) => patch({ sms_enabled: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('settings.smsFrom')} type="time" value={s.sms_window_start.slice(0, 5)} onChange={(e) => patch({ sms_window_start: e.target.value })} />
          <Input label={t('settings.smsTo')} type="time" value={s.sms_window_end.slice(0, 5)} onChange={(e) => patch({ sms_window_end: e.target.value })} />
        </div>
        <Button loading={update.isPending} onClick={() => update.mutate(s, { onSuccess: () => toast.success(t('common.saved')), onError: (e) => toast.error(errorMessage(e)) })}>{t('common.save')}</Button>
      </CardBody>
    </Card>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const owner = useCan('settings.manage')
  return (
    <>
      <PageHeader title={t('nav.settings')} />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Preferences />
          {owner && <GymProfile />}
        </div>
        {owner && (
          <div className="space-y-5">
            <Operations />
            <Card><CardBody><LowCredit /></CardBody></Card>
          </div>
        )}
      </div>
    </>
  )
}
