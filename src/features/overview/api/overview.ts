import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'

type Row = { branch_id: string; branch_name: string; currency: string }

export type OrgDashboardRow = Row & {
  active_members: number
  expiring_soon_members: number
  expired_last_30d_members: number
  total_dues_minor: number
  todays_collection_minor: number
  month_collection_minor: number
  todays_shop_sales_minor: number
  month_shop_sales_minor: number
}

export type CollectionRow = Row & { membership_collected_minor: number; payments_count: number; shop_sales_minor: number; sales_count: number; total_minor: number }
export type DuesRow = Row & { total_dues_minor: number; members_with_dues: number }

type Org<R, T> = { currency: string | null; branches: R[]; totals: T | null }

export type OrgDashboard = Org<OrgDashboardRow, Omit<OrgDashboardRow, keyof Row>> & { sms_credits_balance: number; sms_credits_low: boolean }
export type OrgCollection = Org<CollectionRow, Omit<CollectionRow, keyof Row>>
export type OrgDues = Org<DuesRow, Omit<DuesRow, keyof Row>>

export const useOrgDashboard = () => useQuery({ queryKey: ['org', 'dashboard'], queryFn: () => api.get<OrgDashboard>('/org/dashboard') })

export const useOrgCollection = (from?: string, to?: string) =>
  useQuery({ queryKey: ['org', 'collection', from, to], queryFn: () => api.get<OrgCollection>('/org/reports/collection', { date_from: from || undefined, date_to: to || undefined }) })

export const useOrgDues = () => useQuery({ queryKey: ['org', 'dues'], queryFn: () => api.get<OrgDues>('/org/reports/dues') })
