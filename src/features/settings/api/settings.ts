import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Gym } from '@/core/api/types'
import { useAuthStore } from '@/core/auth/store'

export type GymSettings = {
  expiring_soon_days: number
  expired_renewal_start: 'today' | 'previous_end'
  allow_expired_checkin: boolean
  sms_enabled: boolean
  sms_window_start: string
  sms_window_end: string
}

export const useGymSettings = () => useQuery({ queryKey: ['gym-settings'], queryFn: () => api.get<GymSettings>('/gym/settings') })

export const useUpdateGymSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: Partial<GymSettings>) => api.patch<GymSettings>('/gym/settings', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gym-settings'] }),
  })
}

export const useUpdateGym = () =>
  useMutation({
    mutationFn: (b: Partial<Pick<Gym, 'name' | 'phone' | 'address'>>) => api.patch<Gym>('/gym', b),
    onSuccess: (gym) => useAuthStore.setState((s) => ({ gym: { ...s.gym, ...gym } })),
  })
