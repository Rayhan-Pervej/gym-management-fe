import { BadgeCheck, GitBranch, Inbox, Plus, UserMinus, UserPlus, UserRoundCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useActiveBranches, useCan, useAuthStore } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { tones, Badge, Button, Card, Chips, EmptyState, ErrorState, Input, ListSkeleton, Modal, Pagination, Textarea, type Tone } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useApproveRequest, useRejectRequest, useStaffRequests, useSubmitRequest, useWithdrawRequest, type RequestKind, type RequestStatus, type StaffRequest } from '../api/requests'
import type { AssignableRole } from '../api/staff'
import { BranchPicker, RoleFields } from './StaffFields'

const KIND_ICON = { create: UserPlus, deactivate: UserMinus, reactivate: UserRoundCheck, branches: GitBranch }
const STATUS_TONE: Record<RequestStatus, Tone> = { pending: 'warning', approved: 'success', rejected: 'danger', withdrawn: 'neutral' }

function describe(r: StaffRequest, t: (k: string, o?: Record<string, unknown>) => string) {
  const who = r.target?.name ?? r.request.name ?? ''
  const branches = r.request.branches?.map((b) => b.name).join(', ') ?? ''
  return { title: t(`requests.kind_${r.kind}`, { name: who }), detail: [r.request.role && t(`roles.${r.request.role}`), r.request.value, branches].filter(Boolean).join(' · ') }
}

function ApproveModal({ item, onClose }: { item: StaffRequest; onClose: () => void }) {
  const { t } = useTranslation()
  const approve = useApproveRequest()
  const [pw, setPw] = useState('')
  const needsPw = item.kind === 'create'
  const { title, detail } = describe(item, t)

  const go = () =>
    approve.mutate({ id: item.id, temporary_password: needsPw ? pw : undefined }, { onSuccess: () => { toast.success(t('requests.approved')); onClose() }, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <Modal open onClose={onClose} title={t('requests.approve')} description={title}>
      <div className="space-y-4">
        {detail && <p className="text-sm text-muted">{detail}</p>}
        {needsPw && <Input label={t('staff.tempPassword')} value={pw} onChange={(e) => setPw(e.target.value)} hint={t('requests.passwordHint')} />}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={needsPw && pw.length < 8} loading={approve.isPending} onClick={go}>{t('requests.approve')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function RejectModal({ item, onClose }: { item: StaffRequest; onClose: () => void }) {
  const { t } = useTranslation()
  const reject = useRejectRequest()
  const [note, setNote] = useState('')
  const go = () => reject.mutate({ id: item.id, note: note.trim() }, { onSuccess: () => { toast.success(t('requests.rejected')); onClose() }, onError: (e) => toast.error(errorMessage(e)) })
  return (
    <Modal open onClose={onClose} title={t('requests.reject')} description={describe(item, t).title}>
      <div className="space-y-4">
        <Textarea label={t('requests.note')} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} hint={t('requests.noteHint')} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" disabled={note.trim().length < 2} loading={reject.isPending} onClick={go}>{t('requests.reject')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function NewRequestModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const submit = useSubmitRequest()
  const branches = useActiveBranches()
  const current = useAuthStore((s) => s.branchId)
  const [f, setF] = useState({ name: '', identifier: '' })
  const [role, setRole] = useState<AssignableRole>('staff')
  const [isTrainer, setTrainer] = useState(false)
  const [branchIds, setBranchIds] = useState<string[]>(current ? [current] : [])
  const multi = branches.length > 1

  const go = () =>
    submit.mutate(
      { kind: 'create', ...f, role: role as 'staff' | 'trainer', is_trainer: role === 'trainer' || isTrainer, branch_ids: multi ? branchIds : current ? [current] : [] },
      { onSuccess: () => { toast.success(t('requests.sent')); onClose() }, onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <Modal open onClose={onClose} title={t('requests.new')} description={t('requests.newHint')}>
      <div className="space-y-4">
        <Input label={t('members.name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label={t('auth.identifier')} value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} />
        <RoleFields role={role} setRole={setRole} trainer={isTrainer} setTrainer={setTrainer} roles={['staff', 'trainer']} />
        <BranchPicker value={branchIds} onChange={setBranchIds} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={f.name.trim().length < 2 || f.identifier.trim().length < 5 || (multi && branchIds.length === 0)} loading={submit.isPending} onClick={go}>{t('requests.send')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function RequestsPanel() {
  const { t } = useTranslation()
  const { dateTime } = useFmt()
  const canDecide = useCan('staff.approve')
  const canRequest = useCan('staff.request')
  const [status, setStatus] = useState<RequestStatus | ''>(canDecide ? 'pending' : '')
  const [page, setPage] = useState(1)
  const list = useStaffRequests(status, page)
  const withdraw = useWithdrawRequest()
  const [approving, setApproving] = useState<StaffRequest>()
  const [rejecting, setRejecting] = useState<StaffRequest>()
  const [creating, setCreating] = useState(false)
  const items = list.data?.results ?? []

  const options: { value: RequestStatus | ''; label: string }[] = [
    { value: '', label: t('common.all') },
    ...(['pending', 'approved', 'rejected', 'withdrawn'] as const).map((s) => ({ value: s, label: t(`requests.status_${s}`) })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chips value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={options} />
        {canRequest && <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>{t('requests.new')}</Button>}
      </div>
      {canRequest && <p className="rounded-2xl bg-info-soft p-3 text-sm text-info">{t('requests.managerNote')}</p>}

      <Card className="overflow-hidden">
        {list.isLoading ? <ListSkeleton rows={3} /> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : items.length === 0 ? (
          <EmptyState icon={Inbox} title={t('requests.empty')} hint={canDecide ? t('requests.emptyOwner') : t('requests.emptyManager')} />
        ) : (
          <div className="divide-y divide-border">
            {items.map((r) => {
              const Icon = KIND_ICON[r.kind as RequestKind]
              const { title, detail } = describe(r, t)
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[STATUS_TONE[r.status]])}><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="font-semibold">{title}</p>
                    {detail && <p className="truncate text-xs text-muted">{detail}</p>}
                    <p className="text-xs text-muted">{t('requests.by', { name: r.requested_by.name })} · {dateTime(r.created_at)}</p>
                    {r.status !== 'pending' && r.decided_by && (
                      <p className="text-xs text-muted">{t('requests.decidedBy', { name: r.decided_by.name })}{r.decision_note && ` — “${r.decision_note}”`}</p>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{t(`requests.status_${r.status}`)}</Badge>
                  {r.status === 'pending' && canDecide && (
                    <div className="flex gap-2">
                      <Button size="sm" icon={<BadgeCheck className="size-4" />} onClick={() => setApproving(r)}>{t('requests.approve')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejecting(r)}>{t('requests.reject')}</Button>
                    </div>
                  )}
                  {r.status === 'pending' && canRequest && (
                    <Button size="sm" variant="outline" loading={withdraw.isPending && withdraw.variables === r.id} onClick={() => withdraw.mutate(r.id, { onSuccess: () => toast.success(t('requests.withdrawn')), onError: (e) => toast.error(errorMessage(e)) })}>
                      {t('requests.withdraw')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} count={list.data?.count ?? 0} pageSize={25} onChange={setPage} />
      </Card>

      {approving && <ApproveModal item={approving} onClose={() => setApproving(undefined)} />}
      {rejecting && <RejectModal item={rejecting} onClose={() => setRejecting(undefined)} />}
      {creating && <NewRequestModal onClose={() => setCreating(false)} />}
    </div>
  )
}
