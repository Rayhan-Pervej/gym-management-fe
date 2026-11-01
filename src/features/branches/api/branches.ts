import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Branch } from '@/core/api/types'

export type BranchInput = { name?: string; phone?: string; address?: string; status?: 'archived' }

const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['branches'] })
  qc.invalidateQueries({ queryKey: ['organization'] })
  qc.invalidateQueries({ queryKey: ['me'] })
}

export const useBranches = () => useQuery({ queryKey: ['branches'], queryFn: () => api.get<Branch[]>('/branches') })

export const useCreateBranch = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (b: BranchInput) => api.post<Branch>('/branches', b), onSuccess: () => refresh(qc) })
}

export const useUpdateBranch = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...b }: BranchInput & { id: string }) => api.patch<Branch>(`/branches/${id}`, b), onSuccess: () => refresh(qc) })
}

export type OrgSettings = {
  id: string
  name: string
  tier: string
  branch_limit: number
  sms_balance: number
  low_credit_threshold: number
  branches_in_use: number
}

export const useOrganization = () => useQuery({ queryKey: ['organization'], queryFn: () => api.get<OrgSettings>('/organization') })

export const useUpdateOrganization = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: Partial<Pick<OrgSettings, 'name' | 'low_credit_threshold'>>) => api.patch<OrgSettings>('/organization', b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
