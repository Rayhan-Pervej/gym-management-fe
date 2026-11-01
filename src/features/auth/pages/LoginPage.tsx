import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuthStore } from '@/core/auth/store'
import { errorMessage } from '@/shared/lib/errors'
import { Button, Input } from '@/shared/ui'
import { useLogin } from '../api/auth'
import { AuthLayout } from '../components/AuthLayout'
import { DemoAccounts } from '../components/DemoAccounts'

const schema = z.object({ identifier: z.string().min(3), password: z.string().min(1) })
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const authed = useAuthStore((s) => !!s.access)
  const login = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  if (authed) return <Navigate to="/" replace />

  const signIn = (v: Form) => login.mutate(v, { onSuccess: () => nav('/', { replace: true }), onError: (e) => toast.error(errorMessage(e)) })
  const submit = handleSubmit(signIn)

  return (
    <AuthLayout title={t('auth.welcomeBack')} subtitle={t('auth.loginHint')}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('auth.identifier')} placeholder="01XXXXXXXXX / name@email.com" autoComplete="username" icon={<User className="size-4" />} error={errors.identifier && t('validation.required')} {...register('identifier')} />
        <Input label={t('auth.password')} type="password" autoComplete="current-password" icon={<Lock className="size-4" />} error={errors.password && t('validation.required')} {...register('password')} />
        <div className="text-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">{t('auth.forgot')}</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>{t('auth.login')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">{t('auth.signup')}</Link>
      </p>
      <DemoAccounts onPick={signIn} disabled={login.isPending} />
    </AuthLayout>
  )
}
