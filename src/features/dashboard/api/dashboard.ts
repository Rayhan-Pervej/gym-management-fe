import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { MemberStatus } from '@/features/members/types'

export type DashboardMember = {
  member_id: string
  member_code: string
  name: string
  phone: string
  status: MemberStatus
  days_left: number | null
  end_date: string | null
  due_minor: number
}

export type Dashboard = {
  active_members: number
  expiring_soon_members: number
  expired_last_30d_members: number
  total_dues_minor: number
  todays_collection_minor: number
  month_collection_minor: number
  todays_shop_sales_minor?: number
  month_shop_sales_minor?: number
  sms_credits_balance: number
  sms_credits_low: boolean
  expiring_soon_list: DashboardMember[]
  top_dues_list: DashboardMember[]
}

export type MonthlyCollection = { month: string; collected_minor: number; payments_count: number }

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') })

export const useMonthlyCollection = () =>
  useQuery({ queryKey: ['reports', 'monthly'], queryFn: () => api.get<MonthlyCollection[] | { results: MonthlyCollection[] }>('/reports/monthly-collection') })
