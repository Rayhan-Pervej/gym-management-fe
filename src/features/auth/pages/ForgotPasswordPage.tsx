import { KeyRound, User } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { errorMessage } from '@/shared/lib/errors'
import { Button, Input } from '@/shared/ui'
import { useResetConfirm, useResetRequest, useVerifyOtp } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'

type Step = 'identify' | 'otp' | 'password'
const isEmail = (v: string) => v.includes('@')

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const link = { uid: params.get('uid') ?? undefined, token: params.get('token') ?? undefined }
  const fromEmail = !!(link.uid && link.token)

  const [step, setStep] = useState<Step>(fromEmail ? 'password' : 'identify')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState<string>()
  const [password, setPassword] = useState('')
  const request = useResetRequest()
  const verify = useVerifyOtp()
  const confirm = useResetConfirm()
  const fail = (e: unknown) => toast.error(errorMessage(e))

  const sendRequest = () =>
    request.mutate(identifier, {
      onSuccess: () => (isEmail(identifier) ? toast.success(t('auth.resetEmailSent')) : setStep('otp')),
      onError: fail,
    })

  const verifyCode = () =>
    verify.mutate({ phone: identifier, code, purpose: 'password_reset' }, { onSuccess: (r) => { setResetToken(r.reset_token); setStep('password') }, onError: fail })

  const save = () =>
    confirm.mutate(
      fromEmail ? { ...link, new_password: password } : { reset_token: resetToken, new_password: password },
      { onSuccess: () => { toast.success(t('auth.passwordUpdated')); nav('/login') }, onError: fail },
    )

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t(`auth.reset_${step}`)}>
      <div className="space-y-4">
        {step === 'identify' && (
          <>
            <Input label={t('auth.identifier')} icon={<User className="size-4" />} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <Button size="lg" className="w-full" loading={request.isPending} disabled={identifier.length < 5} onClick={sendRequest}>{t('auth.sendReset')}</Button>
          </>
        )}
        {step === 'otp' && (
          <>
            <Input label={t('auth.otpCode')} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
            <Button size="lg" className="w-full" loading={verify.isPending} disabled={code.length < 4} onClick={verifyCode}>{t('auth.verify')}</Button>
          </>
        )}
        {step === 'password' && (
          <>
            <Input label={t('auth.newPassword')} type="password" icon={<KeyRound className="size-4" />} value={password} onChange={(e) => setPassword(e.target.value)} hint={t('auth.passwordHint')} />
            <Button size="lg" className="w-full" loading={confirm.isPending} disabled={password.length < 8} onClick={save}>{t('common.save')}</Button>
          </>
        )}
        <p className="pt-2 text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
