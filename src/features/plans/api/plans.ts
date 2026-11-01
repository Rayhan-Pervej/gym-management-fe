import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'

export type Plan = {
  id: string
  name: string
  duration_value: number
  duration_unit: 'day' | 'month'
  price_minor: number
  admission_fee_minor: number
  kind?: 'access' | 'pt'
  sessions?: number | null
  is_active: boolean
}

export type PlanInput = Partial<Omit<Plan, 'id'>>

export const usePlans = (active?: boolean) =>
  useQuery({ queryKey: ['plans', active], queryFn: () => api.get<Paginated<Plan>>('/plans', { active, page_size: 100 }) })

export const useSavePlan = (id?: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: PlanInput) => (id ? api.patch<Plan>(`/plans/${id}`, b) : api.post<Plan>('/plans', b)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

export type CopyResult = { copied: { branch_id: string; plan_id: string }[]; skipped: { branch_id: string; reason: string }[] }

export const useCopyPlan = (id: string) =>
  useMutation({ mutationFn: (branch_ids: string[]) => api.post<CopyResult>(`/plans/${id}/copy`, { branch_ids }) })

export const useTogglePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Plan) => api.patch<Plan>(`/plans/${p.id}`, { is_active: !p.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}
