import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Branch, Gym, Organization, Tokens, User } from '@/core/api/types'

type Profile = { user: User; gym: Gym | null; organization: Organization; branches: Branch[]; capabilities: string[] }

type AuthState = Partial<Profile> & {
  access: string | null
  refresh: string | null
  branchId: string | null
  setTokens: (t: Tokens) => void
  setSession: (s: Tokens & { user: User; gym?: Gym | null }) => void
  setProfile: (p: Profile) => void
  setBranch: (id: string) => void
  clear: () => void
}

const empty = { access: null, refresh: null, user: undefined, gym: undefined, organization: undefined, branches: undefined, capabilities: undefined, branchId: null }

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...empty,
      setTokens: ({ access, refresh }) => set({ access, refresh }),
      setSession: ({ access, refresh, user, gym }) => set({ access, refresh, user, gym: gym ?? null }),
      setProfile: (p) => set(p),
      setBranch: (branchId) => set({ branchId }),
      clear: () => set(empty),
    }),
    { name: 'gf-auth' },
  ),
)

export const useCan = (capability: string) => useAuthStore((s) => !!s.capabilities?.includes(capability))
export const useCanAny = (...caps: string[]) => useAuthStore((s) => caps.some((c) => s.capabilities?.includes(c)))
export const useGym = () => useAuthStore((s) => s.gym ?? null)

export const useActiveBranches = () => {
  const branches = useAuthStore((s) => s.branches)
  return useMemo(() => (branches ?? []).filter((b) => b.status === 'active'), [branches])
}
