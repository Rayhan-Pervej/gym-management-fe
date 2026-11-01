import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Gym, Me, Tokens, User } from '@/core/api/types'
import { useAuthStore } from '@/core/auth/store'

type Session = Tokens & { user: User; gym: Gym }

export type SignupInput = {
  name: string
  identifier: string
  password: string
  gym: { name: string; phone?: string; address?: string }
  locale: 'bn' | 'en'
}

export const useLogin = () =>
  useMutation({
    mutationFn: (b: { identifier: string; password: string }) => api.post<Session>('/auth/login', b, { auth: false }),
    onSuccess: (s) => useAuthStore.getState().setSession(s),
  })

export const useSignup = () =>
  useMutation({
    mutationFn: (b: SignupInput) =>
      api.post<Partial<Session> & { user: User; gym: Gym; otp_required: boolean }>('/auth/signup', b, { auth: false }),
    onSuccess: (s) => s.access && s.refresh && useAuthStore.getState().setSession(s as Session),
  })

export const useRequestOtp = () =>
  useMutation({ mutationFn: (b: { phone: string; purpose: 'signup_phone' | 'password_reset' }) => api.post('/auth/otp/request', b, { auth: false }) })

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: (b: { phone: string; code: string; purpose: 'signup_phone' | 'password_reset' }) =>
      api.post<{ verified?: boolean; reset_token?: string }>('/auth/otp/verify', b, { auth: false }),
  })

export const useResetRequest = () => useMutation({ mutationFn: (identifier: string) => api.post('/auth/password/reset/request', { identifier }, { auth: false }) })

export const useResetConfirm = () =>
  useMutation({
    mutationFn: (b: { reset_token?: string; uid?: string; token?: string; new_password: string }) =>
      api.post('/auth/password/reset/confirm', b, { auth: false }),
  })

export const useChangePassword = () =>
  useMutation({
    mutationFn: (b: { old_password: string; new_password: string }) => api.post<Tokens>('/auth/password/change', b),
    onSuccess: (t) => useAuthStore.getState().setTokens(t),
  })

export const useMe = () => {
  const enabled = !!useAuthStore((s) => s.access)
  return useQuery({
    queryKey: ['me'],
    enabled,
    queryFn: async () => {
      let me = await api.get<Me>('/auth/me')
      const { branchId, setBranch } = useAuthStore.getState()
      const active = me.branches.filter((b) => b.status === 'active')
      const chosen = active.some((b) => b.id === branchId) ? branchId : (active[0]?.id ?? null)
      if (chosen && chosen !== branchId) setBranch(chosen)
      if (!me.gym && chosen) me = await api.get<Me>('/auth/me')
      useAuthStore.getState().setProfile(me)
      return me
    },
  })
}

export const logout = async () => {
  const { refresh, clear } = useAuthStore.getState()
  try {
    if (refresh) await api.post('/auth/logout', { refresh })
  } finally {
    clear()
  }
}
