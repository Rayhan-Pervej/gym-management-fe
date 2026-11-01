import { Archive, GitBranch, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Branch } from '@/core/api/types'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, IconButton, Input, ListSkeleton, Modal, PageHeader } from '@/shared/ui'
import { useBranches, useCreateBranch, useOrganization, useUpdateBranch } from '../api/branches'

function BranchModal({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const { t } = useTranslation()
  const create = useCreateBranch()
  const update = useUpdateBranch()
  const [f, setF] = useState({ name: branch?.name ?? '', phone: branch?.phone ?? '', address: branch?.address ?? '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const save = () =>
    (branch ? update.mutateAsync({ id: branch.id, ...f }) : create.mutateAsync(f))
      .then(() => {
        toast.success(t('common.saved'))
        onClose()
      })
      .catch((e) => toast.error(errorMessage(e)))

  return (
    <Modal open onClose={onClose} title={branch ? t('branches.edit') : t('branches.add')}>
      <div className="space-y-4">
        <Input label={t('branches.name')} value={f.name} onChange={set('name')} />
        <Input label={t('members.phone')} type="tel" value={f.phone} onChange={set('phone')} />
        <Input label={t('members.address')} value={f.address} onChange={set('address')} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={f.name.trim().length < 2} loading={create.isPending || update.isPending} onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function BranchesPage() {
  const { t } = useTranslation()
  const { num } = useFmt()
  const branches = useBranches()
  const org = useOrganization()
  const update = useUpdateBranch()
  const [editing, setEditing] = useState<Branch | 'new' | null>(null)
  const [closing, setClosing] = useState<Branch>()
  const full = !!org.data && org.data.branches_in_use >= org.data.branch_limit

  const close = () =>
    closing &&
    update.mutate(
      { id: closing.id, status: 'archived' },
      { onSuccess: () => { setClosing(undefined); toast.success(t('common.saved')) }, onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <>
      <PageHeader
        title={t('nav.branches')}
        subtitle={org.data ? t('branches.usage', { used: num(org.data.branches_in_use), limit: num(org.data.branch_limit) }) : undefined}
        actions={<Button icon={<Plus className="size-4" />} disabled={full} onClick={() => setEditing('new')}>{t('branches.add')}</Button>}
      />
      {full && <p className="mb-4 rounded-2xl bg-warning-soft p-4 text-sm font-medium text-warning">{t('branches.limitReached')}</p>}
      <Card className="overflow-hidden">
        {branches.isLoading ? <ListSkeleton rows={3} /> : branches.isError ? <ErrorState onRetry={() => branches.refetch()} /> : branches.data?.length === 0 ? (
          <EmptyState icon={GitBranch} title={t('branches.empty')} />
        ) : (
          <div className="divide-y divide-border">
            {branches.data?.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><GitBranch className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted">{b.address || b.phone || '—'}</p>
                </div>
                <Badge tone={b.status === 'active' ? 'success' : 'neutral'}>{t(`branches.status_${b.status}`)}</Badge>
                {b.status === 'active' && (
                  <>
                    <IconButton label={t('common.edit')} onClick={() => setEditing(b)}><Pencil className="size-4" /></IconButton>
                    <IconButton label={t('branches.close')} onClick={() => setClosing(b)}><Archive className="size-4" /></IconButton>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      {editing && <BranchModal branch={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!closing} danger title={t('branches.close')} message={t('branches.closeConfirm', { name: closing?.name })} loading={update.isPending} onConfirm={close} onClose={() => setClosing(undefined)} />
    </>
  )
}
