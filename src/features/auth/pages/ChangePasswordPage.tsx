import { KeyRound, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/shared/lib/errors'
import { Button, Input } from '@/shared/ui'
import { useChangePassword } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const qc = useQueryClient()
  const change = useChangePassword()
  const [oldPw, setOld] = useState('')
  const [newPw, setNew] = useState('')

  const save = () =>
    change.mutate(
      { old_password: oldPw, new_password: newPw },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); toast.success(t('auth.passwordUpdated')); nav('/', { replace: true }) }, onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <AuthLayout title={t('auth.changePassword')} subtitle={t('auth.changeRequired')}>
      <div className="space-y-4">
        <Input label={t('auth.currentPassword')} type="password" icon={<Lock className="size-4" />} value={oldPw} onChange={(e) => setOld(e.target.value)} />
        <Input label={t('auth.newPassword')} type="password" icon={<KeyRound className="size-4" />} value={newPw} onChange={(e) => setNew(e.target.value)} hint={t('auth.passwordHint')} />
        <Button size="lg" className="w-full" loading={change.isPending} disabled={!oldPw || newPw.length < 8} onClick={save}>{t('common.save')}</Button>
      </div>
    </AuthLayout>
  )
}
