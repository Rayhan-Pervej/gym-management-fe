import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'
import { config } from '@/core/config'
import type { Member, MemberFilters, Membership } from '../types'

export const memberKeys = {
  all: ['members'] as const,
  list: (f: MemberFilters) => ['members', 'list', f] as const,
  one: (id: string) => ['members', id] as const,
  memberships: (id: string) => ['members', id, 'memberships'] as const,
}

export const useMembers = (f: MemberFilters, enabled = true) =>
  useQuery({
    enabled,
    queryKey: memberKeys.list(f),
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<Member>>('/members', { ...f, status: f.status || undefined, page_size: config.pageSize }),
  })

export const useMember = (id: string) => useQuery({ queryKey: memberKeys.one(id), queryFn: () => api.get<Member>(`/members/${id}`) })

export const useMemberships = (id: string) =>
  useQuery({ queryKey: memberKeys.memberships(id), queryFn: () => api.get<Paginated<Membership>>(`/members/${id}/memberships`) })

export type MemberInput = Partial<Omit<Member, 'id' | 'member_code' | 'status' | 'days_left' | 'expired_since' | 'due_minor' | 'has_dues' | 'current_membership' | 'photo_url' | 'assigned_trainer'>> & {
  name?: string
  phone?: string
  confirm_duplicate?: boolean
  assigned_trainer_id?: string | null
}

export const useCreateMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: MemberInput) => api.post<Member>('/members', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

export const useUpdateMember = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: MemberInput) => api.patch<Member>(`/members/${id}`, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

export type AssignInput = {
  plan_id: string
  start_from?: 'today' | 'previous_end'
  start_date?: string
  discount_minor?: number
  discount_percent?: string
  discount_reason?: string
  trainer_id?: string
}

export const useAssignMembership = (memberId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: AssignInput) => api.post<Membership & { warnings?: string[] }>(`/members/${memberId}/memberships`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export type TransferResult = { member: { id: string; member_code: string; name: string; phone: string }; branch: { id: string; name: string }; source_member_id: string; warnings?: string[] }

export const useTransferMember = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (branch_id: string) => api.post<TransferResult>(`/members/${id}/transfer`, { branch_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

export const useImportMembers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dry_run', String(dryRun))
      return api.post<{ total: number; created: number; errors: { row: number; column: string; message: string }[] }>('/members/import', fd)
    },
    onSuccess: (_, v) => !v.dryRun && qc.invalidateQueries({ queryKey: memberKeys.all }),
  })
}
