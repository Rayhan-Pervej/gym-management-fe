import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useCanAny } from '@/core/auth/store'
import { setLanguage } from '@/core/i18n'
import { useMe } from '@/features/auth/api/auth'
import { errorMessage } from '@/shared/lib/errors'
import { ErrorState, Skeleton } from '@/shared/ui'

export function RequireAuth() {
  const { access, user } = useAuthStore()
  const me = useMe()
  const gymLocale = me.data?.gym?.locale

  useEffect(() => {
    if (gymLocale && !localStorage.getItem('gf-lang')) setLanguage(gymLocale)
  }, [gymLocale])

  if (!access) return <Navigate to="/login" replace />
  if (me.isError) return <ErrorState message={errorMessage(me.error)} onRetry={() => me.refetch()} />
  if (!me.data) return <Splash />
  if (user?.must_change_password) return <Navigate to="/change-password" replace />
  return <Outlet />
}

export function RequireCap({ any }: { any: string[] }) {
  const allowed = useCanAny(...any)
  return allowed ? <Outlet /> : <Navigate to="/" replace />
}

export const HomeRedirect = ({ dashboard }: { dashboard: React.ReactNode }) => {
  const canSeeDashboard = useCanAny('reports.view')
  return canSeeDashboard ? dashboard : <Navigate to="/members" replace />
}

function Splash() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3" aria-label={t('common.loading')}>
      <Skeleton className="size-12 rounded-2xl" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
