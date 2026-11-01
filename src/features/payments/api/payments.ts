import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'
import { config } from '@/core/config'
import { memberKeys } from '@/features/members/api/members'

export const METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank'] as const
export type Method = (typeof METHODS)[number]

export type Payment = {
  id: string
  member_id: string
  member_name?: string
  membership_id: string
  amount_minor: number
  method: Method
  transaction_ref: string
  paid_at: string
  note: string
  created_by: { id: string; name: string }
  receipt_url: string
  is_void: boolean
  voided_at: string | null
  void_reason: string
}

export type PaymentFilters = { date_from?: string; date_to?: string; method?: Method | ''; include_voided?: boolean; member_id?: string; page?: number }

export type PaymentInput = {
  membership_id: string
  amount_minor: number
  method: Method
  transaction_ref?: string
  note?: string
  client_request_id: string
}

export type Receipt = {
  gym_name: string
  receipt_no: string
  member_name: string
  member_code: string
  amount_minor: number
  currency: string
  method: Method
  paid_at: string
  plan_name: string
  period: { start: string; end: string }
  membership_due_minor: number
  status: 'valid' | 'void'
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  ;['payments', 'dashboard', 'dues'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
  qc.invalidateQueries({ queryKey: memberKeys.all })
}

export const usePayments = (f: PaymentFilters) =>
  useQuery({
    queryKey: ['payments', f],
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<Payment>>('/payments', { ...f, method: f.method || undefined, page_size: config.pageSize }),
  })

export const useMemberPayments = (memberId: string) =>
  useQuery({ queryKey: ['payments', 'member', memberId], queryFn: () => api.get<Paginated<Payment>>(`/members/${memberId}/payments`) })

export const useRecordPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: PaymentInput) => api.post<Payment & { warnings?: string[] }>('/payments', b),
    onSuccess: () => invalidate(qc),
  })
}

export const useVoidPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post<Payment>(`/payments/${id}/void`, { reason }),
    onSuccess: () => invalidate(qc),
  })
}

export const useReceipt = (token: string) =>
  useQuery({ queryKey: ['receipt', token], retry: false, queryFn: () => api.get<Receipt>(`/public/receipts/${token}`, undefined, { auth: false }) })
