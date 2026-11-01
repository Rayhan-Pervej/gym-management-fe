import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'
import { memberKeys } from '@/features/members/api/members'

type Person = { id: string; name: string }

export type PtPackage = {
  id: string
  member: { id: string; name: string; member_code: string }
  plan_name: string
  trainer: Person
  sessions_total: number
  sessions_used: number
  sessions_left: number
  start_date: string
  end_date: string
  state: 'upcoming' | 'active' | 'expired'
}

export type PtSession = {
  id: string
  membership_id: string
  member_name: string
  trainer: Person
  session_date: string
  note: string
  is_void: boolean
  voided_at: string | null
  void_reason: string
  created_by: Person
  created_at: string
}

export type TrainerRow = {
  trainer_id: string
  trainer_name: string
  sessions_delivered: number
  clients_served: number
  pt_revenue_minor: number
  assigned_members: number
}

export type TrainerReport = { currency: string; total_sessions: number; total_pt_revenue_minor: number; results: TrainerRow[] }

export const usePtPackages = (active: boolean, page: number) =>
  useQuery({
    queryKey: ['pt-packages', active, page],
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<PtPackage>>('/pt-packages', { active: active || undefined, page }),
  })

export const useSessions = (membershipId: string) =>
  useQuery({
    queryKey: ['sessions', membershipId],
    queryFn: () => api.get<Paginated<PtSession> | PtSession[]>(`/memberships/${membershipId}/sessions`),
  })

const useRefresh = () => {
  const qc = useQueryClient()
  return () => {
    ;['sessions', 'pt-packages', 'reports'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
    qc.invalidateQueries({ queryKey: memberKeys.all })
  }
}

export const useLogSession = (membershipId: string) => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (b: { note?: string }) => api.post<PtSession & { sessions_left: number }>(`/memberships/${membershipId}/sessions`, b),
    onSuccess: refresh,
  })
}

export const useVoidSession = () => {
  const refresh = useRefresh()
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post<PtSession>(`/sessions/${id}/void`, { reason }), onSuccess: refresh })
}

export const useTrainerReport = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['reports', 'trainers', from, to],
    queryFn: () => api.get<TrainerReport>('/reports/trainers', { date_from: from || undefined, date_to: to || undefined }),
  })
