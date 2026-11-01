import { Dumbbell, GitBranch, UserMinus, UserRoundCheck, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { errorMessage } from '@/shared/lib/errors'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, IconButton, ListSkeleton, Modal } from '@/shared/ui'
import { useSubmitRequest } from '../api/requests'
import { asList, useStaff, type StaffUser } from '../api/staff'
import { BranchPicker } from './StaffFields'

function BranchesModal({ person, onClose }: { person: StaffUser; onClose: () => void }) {
  const { t } = useTranslation()
  const submit = useSubmitRequest()
  const [ids, setIds] = useState(person.branches.map((b) => b.id))

  const go = () =>
    submit.mutate({ kind: 'branches', target_id: person.id, branch_ids: ids }, { onSuccess: () => { toast.success(t('requests.sent')); onClose() }, onError: (e) => toast.error(errorMessage(e)) })

  return (
    <Modal open onClose={onClose} title={t('requests.kind_branches', { name: person.name })} description={t('requests.newHint')}>
      <div className="space-y-4">
        <BranchPicker value={ids} onChange={setIds} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={ids.length === 0} loading={submit.isPending} onClick={go}>{t('requests.send')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function ManagerTeam() {
  const { t } = useTranslation()
  const staff = useStaff()
  const submit = useSubmitRequest()
  const [editing, setEditing] = useState<StaffUser>()
  const multi = (staff.data ? asList(staff.data) : []).some((s) => s.branches.length > 1)
  const rows = asList(staff.data)

  const toggle = (p: StaffUser) =>
    submit.mutate({ kind: p.is_active ? 'deactivate' : 'reactivate', target_id: p.id }, { onSuccess: () => toast.success(t('requests.sent')), onError: (e) => toast.error(errorMessage(e)) })

  return (
    <>
      <Card className="overflow-hidden">
        {staff.isLoading ? <ListSkeleton rows={3} /> : staff.isError ? <ErrorState onRetry={() => staff.refetch()} /> : rows.length === 0 ? (
          <EmptyState icon={UserCog} title={t('staff.empty')} hint={t('requests.emptyManager')} />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={s.name} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="flex items-center gap-1.5 truncate font-semibold">{s.name}{s.is_trainer && <Dumbbell className="size-3.5 text-primary" aria-label={t('staff.isTrainer')} />}</p>
                  <p className="truncate text-xs text-muted">{s.email ?? s.phone} · {s.branches.map((b) => b.name).join(', ')}</p>
                </div>
                <Badge tone="primary">{t(`roles.${s.role}`)}</Badge>
                <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? t('common.active') : t('common.inactive')}</Badge>
                <div className="flex">
                  {multi && s.is_active && <IconButton label={t('requests.kind_branches', { name: s.name })} onClick={() => setEditing(s)}><GitBranch className="size-4" /></IconButton>}
                  <IconButton label={t(s.is_active ? 'requests.kind_deactivate' : 'requests.kind_reactivate', { name: s.name })} disabled={submit.isPending} onClick={() => toggle(s)}>
                    {s.is_active ? <UserMinus className="size-4" /> : <UserRoundCheck className="size-4" />}
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {editing && <BranchesModal person={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}
