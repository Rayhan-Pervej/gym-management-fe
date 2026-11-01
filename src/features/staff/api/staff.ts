import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated, Role, User } from '@/core/api/types'

export type AssignableRole = Exclude<Role, 'owner'>
export const ASSIGNABLE_ROLES: AssignableRole[] = ['manager', 'staff', 'trainer']

export type StaffUser = User & { is_active: boolean; branches: { id: string; name: string }[] }

export type StaffInput = { name?: string; role?: AssignableRole; is_trainer?: boolean; is_active?: boolean }

export type NewStaff = { name: string; identifier: string; temporary_password: string; role: AssignableRole; branch_ids: string[]; is_trainer: boolean }

export type Trainer = { id: string; name: string; role: Role }

export const useStaff = () => useQuery({ queryKey: ['staff'], queryFn: () => api.get<Paginated<StaffUser> | StaffUser[]>('/staff') })

export const useTrainers = (enabled = true) => useQuery({ queryKey: ['trainers'], enabled, queryFn: () => api.get<Paginated<Trainer> | Trainer[]>('/trainers') })

const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['staff'] })
  qc.invalidateQueries({ queryKey: ['trainers'] })
}

export const useCreateStaff = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (b: NewStaff) => api.post<StaffUser>('/staff', b), onSuccess: () => refresh(qc) })
}

export const useUpdateStaff = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...b }: StaffInput & { id: string }) => api.patch<StaffUser>(`/staff/${id}`, b), onSuccess: () => refresh(qc) })
}

export const useSetStaffBranches = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, branch_ids }: { id: string; branch_ids: string[] }) => api.put<StaffUser>(`/staff/${id}/branches`, { branch_ids }),
    onSuccess: () => refresh(qc),
  })
}

export const asList = <T,>(d?: Paginated<T> | T[]) => (Array.isArray(d) ? d : (d?.results ?? []))
