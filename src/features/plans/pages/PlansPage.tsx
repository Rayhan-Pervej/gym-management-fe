import { Archive, Copy, Pencil, Plus, RotateCcw, Tags } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useActiveBranches, useAuthStore, useCan } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { toMajor, toMinor } from '@/shared/lib/format'
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, Input, ListSkeleton, Modal, PageHeader, Segmented, Select } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useCopyPlan, usePlans, useSavePlan, useTogglePlan, type CopyResult, type Plan } from '../api/plans'

function PlanModal({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSavePlan(plan?.id)
  const [f, setF] = useState({
    name: plan?.name ?? '',
    duration_value: String(plan?.duration_value ?? 1),
    duration_unit: plan?.duration_unit ?? 'month',
    price: String(toMajor(plan?.price_minor ?? 0)),
    admission: String(toMajor(plan?.admission_fee_minor ?? 0)),
    sessions: String(plan?.sessions ?? 10),
  })
  const [kind, setKind] = useState<'access' | 'pt'>(plan?.kind ?? 'access')
  const isPt = kind === 'pt'
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = () =>
    save.mutate(
      {
        name: f.name.trim(),
        duration_value: Number(f.duration_value),
        duration_unit: f.duration_unit as Plan['duration_unit'],
        price_minor: toMinor(f.price),
        admission_fee_minor: isPt ? 0 : toMinor(f.admission),
        ...(plan ? {} : { kind }),
        ...(isPt ? { sessions: Number(f.sessions) } : {}),
      },
      { onSuccess: () => { toast.success(t('common.saved')); onClose() }, onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <Modal open onClose={onClose} title={plan ? t('plans.edit') : t('plans.add')} description={plan ? t('plans.editHint') : undefined}>
      <div className="space-y-4">
        {!plan && <Segmented value={kind} onChange={setKind} options={[{ value: 'access', label: t('plans.kind_access') }, { value: 'pt', label: t('plans.kind_pt') }]} />}
        <Input label={t('plans.name')} value={f.name} onChange={set('name')} placeholder={isPt ? 'PT 12 sessions' : 'Monthly'} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('plans.duration')} type="number" min={1} max={120} value={f.duration_value} onChange={set('duration_value')} hint={t('plans.durationHint')} />
          <Select label={t('plans.unit')} value={f.duration_unit} onChange={set('duration_unit')}>
            <option value="month">{t('plans.months')}</option>
            <option value="day">{t('plans.days')}</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('plans.price')} type="number" min={0} step="0.01" value={f.price} onChange={set('price')} />
          {isPt ? <Input label={t('plans.sessions')} type="number" min={1} max={200} value={f.sessions} onChange={set('sessions')} hint={t('plans.sessionsHint')} /> : <Input label={t('plans.admission')} type="number" min={0} step="0.01" value={f.admission} onChange={set('admission')} hint={t('plans.admissionHint')} />}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={f.name.trim().length < 2} loading={save.isPending} onClick={submit}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function CopyModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { t } = useTranslation()
  const current = useAuthStore((s) => s.branchId)
  const branches = useActiveBranches().filter((b) => b.id !== current)
  const copy = useCopyPlan(plan.id)
  const [ids, setIds] = useState<string[]>([])
  const [result, setResult] = useState<CopyResult>()
  const name = (id: string) => branches.find((b) => b.id === id)?.name ?? id
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])

  return (
    <Modal open onClose={onClose} title={t('plans.copyTitle', { name: plan.name })} description={t('plans.copyHint')}>
      {result ? (
        <div className="space-y-3">
          {result.copied.map((c) => <p key={c.branch_id} className="rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">{t('plans.copied', { branch: name(c.branch_id) })}</p>)}
          {result.skipped.map((c) => <p key={c.branch_id} className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-medium text-warning">{t('plans.skipped', { branch: name(c.branch_id) })}</p>)}
          <div className="flex justify-end"><Button onClick={onClose}>{t('common.confirm')}</Button></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <button key={b.id} type="button" onClick={() => toggle(b.id)} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition', ids.includes(b.id) ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:bg-surface-2')}>{b.name}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button disabled={ids.length === 0} loading={copy.isPending} onClick={() => copy.mutate(ids, { onSuccess: setResult, onError: (e) => toast.error(errorMessage(e)) })}>{t('plans.copy')}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function PlansPage() {
  const { t } = useTranslation()
  const { money } = useFmt()
  const owner = useCan('plans.manage')
  const plans = usePlans()
  const toggle = useTogglePlan()
  const [editing, setEditing] = useState<Plan | 'new' | null>(null)
  const [copying, setCopying] = useState<Plan>()
  const multi = useActiveBranches().length > 1
  const archive = (p: Plan) => toggle.mutate(p, { onError: (e) => toast.error(errorMessage(e)) })

  return (
    <>
      <PageHeader title={t('nav.plans')} actions={owner && <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>{t('plans.add')}</Button>} />
      {plans.isLoading ? <Card><ListSkeleton rows={4} /></Card> : plans.isError ? <ErrorState onRetry={() => plans.refetch()} /> : plans.data?.results.length === 0 ? (
        <Card><EmptyState icon={Tags} title={t('plans.empty')} hint={owner ? t('plans.emptyHint') : t('plans.askOwner')} action={owner ? <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>{t('plans.add')}</Button> : undefined} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.data?.results.map((p) => (
            <Card key={p.id} className={`p-5 ${p.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-muted">{t(`plans.unit_${p.duration_unit}`, { count: p.duration_value })}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {p.kind === 'pt' && <Badge tone="info">{t('plans.kind_pt')}</Badge>}
                  {!p.is_active && <Badge>{t('plans.archived')}</Badge>}
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">{money(p.price_minor)}</p>
              {p.kind === 'pt' && <p className="mt-1 text-xs text-muted">{t('plans.sessionsCount', { count: p.sessions ?? 0 })}</p>}
              {p.admission_fee_minor > 0 && <p className="mt-1 text-xs text-muted">+ {t('plans.admission')} {money(p.admission_fee_minor)}</p>}
              {owner && (
                <div className="mt-4 flex gap-1 border-t border-border pt-3">
                  <IconButton label={t('common.edit')} onClick={() => setEditing(p)}><Pencil className="size-4" /></IconButton>
                  {multi && p.is_active && <IconButton label={t('plans.copy')} onClick={() => setCopying(p)}><Copy className="size-4" /></IconButton>}
                  <IconButton label={p.is_active ? t('plans.archive') : t('plans.restore')} onClick={() => archive(p)}>{p.is_active ? <Archive className="size-4" /> : <RotateCcw className="size-4" />}</IconButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {copying && <CopyModal plan={copying} onClose={() => setCopying(undefined)} />}
      {editing && <PlanModal plan={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
