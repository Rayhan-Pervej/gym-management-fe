export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export type ApiErrorBody = { error: { code: string; message: string; details?: Record<string, unknown> } }

export type Role = 'owner' | 'manager' | 'staff' | 'trainer'
export type Locale = 'bn' | 'en'

export type User = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  role: Role
  is_trainer?: boolean
  must_change_password?: boolean
}

export type Gym = {
  id: string
  name: string
  phone?: string
  address?: string
  logo_url?: string | null
  currency: string
  locale: Locale
  timezone: string
  tier: 'free' | 'basic' | 'pro'
  status?: string
}

export type Branch = { id: string; name: string; status: 'active' | 'archived' | 'suspended'; phone?: string; address?: string }

export type Organization = { id: string; name: string; tier: Gym['tier']; branch_limit: number; status: string }

export type Capability = string

export type Me = {
  user: User
  organization: Organization
  branches: Branch[]
  gym: Gym | null
  capabilities: Capability[]
  pending_staff_requests: number | null
  limits: { members: number | null; staff: number | null }
  usage: { staff: number; members: number } | null
}

export type Tokens = { access: string; refresh: string }
