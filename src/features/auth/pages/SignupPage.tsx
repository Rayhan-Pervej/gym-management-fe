import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Lock, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLang } from '@/core/i18n'
import { applyFieldErrors, errorMessage } from '@/shared/lib/errors'
import { Button, Input } from '@/shared/ui'
import { useLogin, useRequestOtp, useSignup, useVerifyOtp } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'

const schema = z.object({
  name: z.string().min(2),
  gymName: z.string().min(2),
  identifier: z.string().min(5),
  password: z.string().min(8),
})
type Form = z.infer<typeof schema>

export default function SignupPage() {
  const { t } = useTranslation()
  const locale = useLang()
  const nav = useNavigate()
  const signup = useSignup()
  const login = useLogin()
  const requestOtp = useRequestOtp()
  const verify = useVerifyOtp()
  const [pending, setPending] = useState<Form | null>(null)
  const [code, setCode] = useState('')
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const submit = handleSubmit((v) =>
    signup.mutate(
      { name: v.name, identifier: v.identifier, password: v.password, gym: { name: v.gymName }, locale },
      {
        onSuccess: (r) => (r.otp_required ? setPending(v) : nav('/', { replace: true })),
        onError: (e) => applyFieldErrors(e, setError) || toast.error(errorMessage(e)),
      },
    ),
  )

  const confirm = () =>
    pending &&
    verify.mutate(
      { phone: pending.identifier, code, purpose: 'signup_phone' },
      {
        onSuccess: () =>
          login.mutate({ identifier: pending.identifier, password: pending.password }, { onSuccess: () => nav('/', { replace: true }) }),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  if (pending)
    return (
      <AuthLayout title={t('auth.verifyPhone')} subtitle={t('auth.otpSent', { phone: pending.identifier })}>
        <div className="space-y-4">
          <Input label={t('auth.otpCode')} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="text-center text-lg tracking-[0.5em]" />
          <Button size="lg" className="w-full" loading={verify.isPending || login.isPending} disabled={code.length < 4} onClick={confirm}>
            {t('auth.verify')}
          </Button>
          <Button variant="ghost" className="w-full" loading={requestOtp.isPending} onClick={() => requestOtp.mutate({ phone: pending.identifier, purpose: 'signup_phone' }, { onSuccess: () => toast.success(t('auth.otpResent')) })}>
            {t('auth.resend')}
          </Button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout title={t('auth.createGym')} subtitle={t('auth.signupHint')}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('auth.gymName')} icon={<Building2 className="size-4" />} error={errors.gymName && t('validation.required')} {...register('gymName')} />
        <Input label={t('auth.yourName')} icon={<User className="size-4" />} autoComplete="name" error={errors.name && t('validation.required')} {...register('name')} />
        <Input label={t('auth.identifier')} icon={<Phone className="size-4" />} placeholder="01XXXXXXXXX / name@email.com" autoComplete="username" error={errors.identifier?.message ?? (errors.identifier && t('validation.required'))} {...register('identifier')} />
        <Input label={t('auth.password')} type="password" icon={<Lock className="size-4" />} autoComplete="new-password" hint={t('auth.passwordHint')} error={errors.password && t('validation.password')} {...register('password')} />
        <Button type="submit" size="lg" className="w-full" loading={signup.isPending}>{t('auth.signup')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">{t('auth.login')}</Link>
      </p>
    </AuthLayout>
  )
}
