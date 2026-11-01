export type MemberStatus = 'active' | 'expiring_soon' | 'upcoming' | 'expired' | 'no_membership'

export const MEMBER_STATUSES: MemberStatus[] = ['active', 'expiring_soon', 'upcoming', 'expired', 'no_membership']

export type CurrentMembership = { id: string; plan_name: string; start_date: string; end_date: string; state?: 'upcoming' | 'active' | 'expired' }

export type Member = {
  id: string
  member_code: string
  name: string
  phone: string
  gender: 'male' | 'female' | 'other' | ''
  photo_url: string | null
  dob: string | null
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  notes: string
  preferred_language: 'bn' | 'en' | null
  is_archived: boolean
  status: MemberStatus
  days_left: number | null
  expired_since: string | null
  due_minor?: number
  has_dues?: boolean
  assigned_trainer?: { id: string; name: string } | null
  pt_packages?: PtSummary[]
  current_membership: CurrentMembership | null
}

export type PtSummary = {
  id: string
  plan_name: string
  trainer: { id: string; name: string }
  sessions_total: number
  sessions_left: number
  start_date: string
  end_date: string
}

export type Membership = {
  id: string
  member_id: string
  plan_id: string
  plan_name: string
  start_date: string
  end_date: string
  price_minor: number
  admission_fee_minor: number
  kind?: 'access' | 'pt'
  sessions_total?: number | null
  sessions_used?: number
  sessions_left?: number
  trainer?: { id: string; name: string } | null
  discount_minor?: number
  discount_reason?: string
  charged_minor: number
  paid_minor: number
  due_minor: number
  state: 'upcoming' | 'active' | 'expired'
}

export type MemberFilters = {
  q?: string
  status?: MemberStatus | ''
  has_dues?: boolean
  ordering?: string
  page?: number
}

export type Warning = string
