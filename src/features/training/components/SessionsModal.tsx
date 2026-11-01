import { Ban, Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCan } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { errorMessage } from '@/shared/lib/errors'
import { Badge, Button, EmptyState, IconButton, Input, ListSkeleton, Modal } from '@/shared/ui'
import { useLogSession, useSessions, useVoidSession, type PtSession } from '../api/training'

type Props = { membershipId: string; title: string; description?: string; canLog?: boolean; onClose: () => void }

export function SessionsModal({ membershipId, title, description, canLog = true, onClose }: Props) {
  const { t } = useTranslation()
  const { date } = useFmt()
  const mayLog = useCan('pt.log') && canLog
  const mayVoid = useCan('pt.void')
  const list = useSessions(membershipId)
  const log = useLogSession(membershipId)
  const voidIt = useVoidSession()
  const [note, setNote] = useState('')
  const [voiding, setVoiding] = useState<PtSession>()
  const [reason, setReason] = useState('')
  const rows = Array.isArray(list.data) ? list.data : (list.data?.results ?? [])
  const used = rows.filter((s) => !s.is_void).length

  const add = () =>
    log.mutate({ note: note.trim() || undefined }, {
      onSuccess: (r) => { toast.success(t('training.logged', { count: r.sessions_left })); setNote('') },
      onError: (e) => toast.error(errorMessage(e)),
    })

  const confirmVoid = () =>
    voiding && voidIt.mutate({ id: voiding.id, reason: reason.trim() }, {
      onSuccess: () => { toast.success(t('training.voided')); setVoiding(undefined); setReason('') },
      onError: (e) => toast.error(errorMessage(e)),
    })

  return (
    <Modal open onClose={onClose} title={title} description={description}>
      <div className="space-y-4">
        {mayLog && (
          <div className="flex items-end gap-2">
            <Input wrapperClass="flex-1" label={t('training.note')} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button icon={<Dumbbell className="size-4" />} loading={log.isPending} onClick={add}>{t('training.logSession')}</Button>
          </div>
        )}
        <p className="text-sm font-medium text-muted">{t('training.sessionsDone', { count: used })}</p>
        {list.isLoading ? <ListSkeleton rows={3} /> : rows.length === 0 ? <EmptyState icon={Dumbbell} title={t('training.noSessions')} /> : (
          <div className="-mx-1 max-h-72 divide-y divide-border overflow-y-auto">
            {rows.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-1 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className={s.is_void ? 'font-semibold text-muted line-through' : 'font-semibold'}>{date(s.session_date)}</p>
                  <p className="truncate text-xs text-muted">{s.trainer.name}{s.note && ` · ${s.note}`}</p>
                  {s.is_void && <p className="truncate text-xs text-danger">{t('payments.voidReason')}: {s.void_reason}</p>}
                </div>
                {s.is_void ? <Badge tone="danger">{t('payments.void')}</Badge> : mayVoid && <IconButton label={t('training.void')} onClick={() => setVoiding(s)}><Ban className="size-4" /></IconButton>}
              </div>
            ))}
          </div>
        )}
        {voiding && (
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <Input label={t('payments.voidReason')} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setVoiding(undefined)}>{t('common.cancel')}</Button>
              <Button variant="danger" size="sm" disabled={reason.trim().length < 3} loading={voidIt.isPending} onClick={confirmVoid}>{t('training.void')}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
