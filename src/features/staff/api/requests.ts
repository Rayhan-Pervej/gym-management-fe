import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated, Role } from '@/core/api/types'

export type RequestKind = 'create' | 'deactivate' | 'reactivate' | 'branches'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

type Person = { id: string; name: string }

export type StaffRequest = {
  id: string
  kind: RequestKind
  status: RequestStatus
  requested_by: Person
  target: Person | null
  request: {
    name?: string
    identifier_kind?: 'email' | 'phone'
    value?: string
    role?: Role
    is_trainer?: boolean
    branches?: { id: string; name: string }[]
  }
  decided_by: Person | null
  decided_at: string | null
  decision_note: string
  created_at: string
}

export type NewRequest =
  | { kind: 'create'; name: string; identifier: string; role: 'staff' | 'trainer'; is_trainer: boolean; branch_ids: string[] }
  | { kind: 'deactivate' | 'reactivate'; target_id: string }
  | { kind: 'branches'; target_id: string; branch_ids: string[] }

export const useStaffRequests = (status?: RequestStatus | '', page = 1) =>
  useQuery({
    queryKey: ['staff-requests', status, page],
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<StaffRequest>>('/staff-requests', { status: status || undefined, page }),
  })

const useRefresh = () => {
  const qc = useQueryClient()
  return () => ['staff-requests', 'staff', 'trainers', 'me'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
}

export const useSubmitRequest = () => {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (b: NewRequest) => api.post<StaffRequest>('/staff-requests', b), onSuccess: refresh })
}

export const useApproveRequest = () => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, temporary_password }: { id: string; temporary_password?: string }) =>
      api.post<StaffRequest>(`/staff-requests/${id}/approve`, temporary_password ? { temporary_password } : {}),
    onSuccess: refresh,
  })
}

export const useRejectRequest = () => {
  const refresh = useRefresh()
  return useMutation({ mutationFn: ({ id, note }: { id: string; note: string }) => api.post<StaffRequest>(`/staff-requests/${id}/reject`, { note }), onSuccess: refresh })
}

export const useWithdrawRequest = () => {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => api.post<StaffRequest>(`/staff-requests/${id}/withdraw`), onSuccess: refresh })
}
