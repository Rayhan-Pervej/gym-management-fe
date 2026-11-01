import { Dumbbell, Plus, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useActiveBranches, useAuthStore, useCan } from '@/core/auth/store'
import { useMe } from '@/features/auth/api/auth'
import { applyFieldErrors, errorMessage } from '@/shared/lib/errors'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Input, ListSkeleton, Modal, PageHeader, Segmented } from '@/shared/ui'
import { ManagerTeam } from '../components/ManagerTeam'
import { RequestsPanel } from '../components/RequestsPanel'
import { BranchPicker, RoleFields } from '../components/StaffFields'
import { asList, useCreateStaff, useSetStaffBranches, useStaff, useUpdateStaff, type AssignableRole, type StaffUser } from '../api/staff'

function CreateModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const create = useCreateStaff()
  const branches = useActiveBranches()
  const current = useAuthStore((s) => s.branchId)
  const [f, setF] = useState({ name: '', identifier: '', temporary_password: '' })
  const [role, setRole] = useState<AssignableRole>('staff')
  const [isTrainer, setTrainer] = useState(false)
  const [branchIds, setBranchIds] = useState<string[]>(current ? [current] : [])
  const [err, setErr] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const needsBranches = branches.length > 1

  const submit = () =>
    create.mutate(
      { ...f, role, is_trainer: role === 'trainer' || isTrainer, branch_ids: needsBranches ? branchIds : [] },
      {
        onSuccess: () => { toast.success(t('staff.created')); onClose() },
        onError: (e) => applyFieldErrors(e, ((k: string, v: { message?: string }) => setErr((p) => ({ ...p, [k]: v.message ?? '' }))) as never) || toast.error(errorMessage(e)),
      },
    )

  return (
    <Modal open onClose={onClose} title={t('staff.add')} description={t('staff.addHint')}>
      <div className="space-y-4">
        <Input label={t('members.name')} value={f.name} onChange={set('name')} error={err.name} />
        <Input label={t('auth.identifier')} value={f.identifier} onChange={set('identifier')} error={err.identifier} />
        <Input label={t('staff.tempPassword')} value={f.temporary_password} onChange={set('temporary_password')} error={err.temporary_password} hint={t('auth.passwordHint')} />
        <RoleFields role={role} setRole={setRole} trainer={isTrainer} setTrainer={setTrainer} />
        <BranchPicker value={branchIds} onChange={setBranchIds} />
        {err.branch_ids && <p className="text-xs text-danger">{err.branch_ids}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!f.name || !f.identifier || f.temporary_password.length < 8 || (needsBranches && branchIds.length === 0)} loading={create.isPending} onClick={submit}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditModal({ user, onClose }: { user: StaffUser; onClose: () => void }) {
  const { t } = useTranslation()
  const update = useUpdateStaff()
  const setBranches = useSetStaffBranches()
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role as AssignableRole)
  const [isTrainer, setTrainer] = useState(!!user.is_trainer)
  const [branchIds, setBranchIds] = useState(user.branches.map((b) => b.id))

  const save = async () => {
    try {
      await update.mutateAsync({ id: user.id, name, role, is_trainer: role === 'trainer' || isTrainer })
      const before = user.branches.map((b) => b.id).sort().join()
      if (branchIds.length && before !== [...branchIds].sort().join()) await setBranches.mutateAsync({ id: user.id, branch_ids: branchIds })
      toast.success(t('common.saved'))
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Modal open onClose={onClose} title={t('staff.edit')} description={user.email ?? user.phone ?? undefined}>
      <div className="space-y-4">
        <Input label={t('members.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <RoleFields role={role} setRole={setRole} trainer={isTrainer} setTrainer={setTrainer} />
        <BranchPicker value={branchIds} onChange={setBranchIds} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={name.trim().length < 2 || branchIds.length === 0} loading={update.isPending || setBranches.isPending} onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function TeamPanel() {
  const { t } = useTranslation()
  const staff = useStaff()
  const update = useUpdateStaff()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<StaffUser>()
  const rows = asList(staff.data)

  return (
    <>
      <div className="mb-4 flex justify-end"><Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>{t('staff.add')}</Button></div>
      <Card className="overflow-hidden">
        {staff.isLoading ? <ListSkeleton rows={3} /> : staff.isError ? <ErrorState onRetry={() => staff.refetch()} /> : rows.length === 0 ? (
          <EmptyState icon={UserCog} title={t('staff.empty')} hint={t('staff.emptyHint')} />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setEditing(s)}>
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-semibold">{s.name}{s.is_trainer && <Dumbbell className="size-3.5 text-primary" aria-label={t('staff.isTrainer')} />}</p>
                    <p className="truncate text-xs text-muted">{s.email ?? s.phone} · {s.branches.map((b) => b.name).join(', ')}</p>
                  </div>
                </button>
                <Badge tone="primary">{t(`roles.${s.role}`)}</Badge>
                <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? t('common.active') : t('common.inactive')}</Badge>
                <Button size="sm" variant="outline" loading={update.isPending && update.variables?.id === s.id} onClick={() => update.mutate({ id: s.id, is_active: !s.is_active }, { onError: (e) => toast.error(errorMessage(e)) })}>
                  {s.is_active ? t('staff.deactivate') : t('staff.reactivate')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {adding && <CreateModal onClose={() => setAdding(false)} />}
      {editing && <EditModal user={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}

export default function StaffPage() {
  const { t } = useTranslation()
  const canManage = useCan('staff.manage')
  const pending = useMe().data?.pending_staff_requests ?? 0
  const [tab, setTab] = useState<'team' | 'requests'>('team')

  return (
    <>
      <PageHeader title={t('nav.staff')} />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
        { value: 'team', label: t('staff.team') },
        { value: 'requests', label: pending > 0 ? `${t('requests.title')} (${pending})` : t('requests.title') },
        ]}
      />
      {tab === 'requests' ? <RequestsPanel /> : canManage ? <TeamPanel /> : <ManagerTeam />}
    </>
  )
}
