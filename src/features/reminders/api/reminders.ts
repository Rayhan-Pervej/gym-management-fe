import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'

export type Trigger = 'before_expiry' | 'on_expiry' | 'after_expiry' | 'payment_received'

export type ReminderRule = {
  id: string
  trigger: Trigger
  is_active: boolean
  offset_days: number
  template_bn: string
  template_en: string
}

export type Notification = {
  id: string
  member_name?: string
  trigger: Trigger
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  skip_reason?: string
  segments?: number
  created_at: string
  error?: string
}

export type SmsCredits = {
  balance: number
  low: boolean
  threshold: number
  transactions: Paginated<{ id: string; delta: number; reason: string; created_at: string }> | { id: string; delta: number; reason: string; created_at: string }[]
}

export const useRules = () => useQuery({ queryKey: ['rules'], queryFn: () => api.get<Paginated<ReminderRule> | ReminderRule[]>('/reminder-rules') })

export const useUpdateRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...b }: Partial<ReminderRule> & { id: string }) => api.patch<ReminderRule>(`/reminder-rules/${id}`, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export const usePreviewRule = () =>
  useMutation({
    mutationFn: ({ id, ...b }: { id: string; template_bn?: string; template_en?: string }) =>
      api.post<{ message: string; encoding: string; length: number; segments: number }>(`/reminder-rules/${id}/preview`, b),
  })

export const useNotifications = (page: number, status?: string) =>
  useQuery({ queryKey: ['notifications', page, status], queryFn: () => api.get<Paginated<Notification>>('/notifications', { page, status: status || undefined }) })

export const useSmsCredits = () => useQuery({ queryKey: ['sms-credits'], queryFn: () => api.get<SmsCredits>('/sms-credits') })
