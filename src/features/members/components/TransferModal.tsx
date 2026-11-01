import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/core/api/client'
import { useActiveBranches, useAuthStore } from '@/core/auth/store'
import { useFmt } from '@/shared/hooks/useFmt'
import { cn } from '@/shared/lib/cn'
import { errorMessage } from '@/shared/lib/errors'
import { Button, Modal } from '@/shared/ui'
import { useTransferMember, type TransferResult } from '../api/members'
import type { Member } from '../types'

export function TransferModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { t } = useTranslation()
  const { money } = useFmt()
  const nav = useNavigate()
  const qc = useQueryClient()
  const current = useAuthStore((s) => s.branchId)
  const setBranch = useAuthStore((s) => s.setBranch)
  const targets = useActiveBranches().filter((b) => b.id !== current)
  const transfer = useTransferMember(member.id)
  const [target, setTarget] = useState('')
  const [done, setDone] = useState<TransferResult>()

  const go = () =>
    transfer.mutate(target, {
      onSuccess: setDone,
      onError: (e) =>
        toast.error(e instanceof ApiError && e.code === 'member_has_dues' ? t('errors.member_has_dues', { amount: money(Number(e.details.due_minor)) }) : errorMessage(e)),
    })

  const openThere = () => {
    if (!done) return
    setBranch(done.branch.id)
    qc.resetQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    nav(`/members/${done.member.id}`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('transfer.title', { name: member.name })} description={t('transfer.hint')}>
      {done ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">{t('transfer.done', { code: done.member.member_code, branch: done.branch.name })}</p>
          {done.warnings?.includes('active_membership_not_moved') && <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm font-medium text-warning">{t('warnings.active_membership_not_moved')}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { onClose(); nav('/members') }}>{t('transfer.stay')}</Button>
            <Button onClick={openThere}>{t('transfer.openThere', { branch: done.branch.name })}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted">
            <li>{t('transfer.rule1')}</li>
            <li>{t('transfer.rule2')}</li>
            <li>{t('transfer.rule3')}</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            {targets.map((b) => (
              <button key={b.id} type="button" onClick={() => setTarget(b.id)} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition', target === b.id ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:bg-surface-2')}>{b.name}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button disabled={!target} loading={transfer.isPending} onClick={go}>{t('transfer.move')}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
