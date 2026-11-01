import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import i18n from '@/core/i18n'
import { ApiError } from '@/core/api/client'

const waitText = (s: number) => (s >= 3600 ? i18n.t('time.hours', { count: Math.ceil(s / 3600) }) : s >= 60 ? i18n.t('time.minutes', { count: Math.ceil(s / 60) }) : i18n.t('time.seconds', { count: Math.ceil(s) }))

export const errorMessage = (e: unknown) => {
  if (!(e instanceof ApiError)) return i18n.t('errors.network')
  if (e.status === 429) {
    const seconds = Number(e.details.retry_after_seconds)
    return Number.isFinite(seconds) && seconds > 0 ? i18n.t('errors.throttled', { time: waitText(seconds) }) : i18n.t('errors.throttled_soon')
  }
  return i18n.exists(`errors.${e.code}`) ? i18n.t(`errors.${e.code}`) : e.message
}

export function applyFieldErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>) {
  if (!(e instanceof ApiError) || e.code !== 'validation_error') return false
  Object.entries(e.details).forEach(([k, v]) => setError(k as Path<T>, { message: [v].flat().join(' ') }))
  return true
}
