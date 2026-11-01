import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'
import type { Method } from '@/features/payments/api/payments'

export type Product = {
  id: string
  name: string
  sku: string
  price_minor: number
  cost_minor?: number | null
  track_stock: boolean
  stock_qty: number
  low_stock_threshold: number
  low_stock: boolean
  is_active: boolean
}

export type ProductInput = {
  name?: string
  sku?: string
  price_minor?: number
  cost_minor?: number | null
  track_stock?: boolean
  low_stock_threshold?: number
  initial_stock?: number
  is_active?: boolean
}

export type SaleItem = { product_id: string; product_name: string; quantity: number; unit_price_minor: number; line_total_minor: number }

export type Sale = {
  id: string
  member: { id: string; name: string; member_code: string } | null
  items: SaleItem[]
  total_minor: number
  method: Method
  transaction_ref: string
  sold_at: string
  created_by: { id: string; name: string }
  receipt_url: string
  is_void: boolean
  voided_at: string | null
  void_reason: string
}

export type NewSale = {
  items: { product_id: string; quantity: number }[]
  method: Method
  member_id?: string
  transaction_ref?: string
  client_request_id: string
}

export type SaleFilters = { date_from?: string; date_to?: string; include_voided?: boolean; page?: number }
export type ProductFilters = { q?: string; active?: boolean; low_stock?: boolean; page?: number; page_size?: number }

export type ShopReport = {
  currency: string
  summary: { sales_count: number; total_minor: number; items_sold: number }
  by_product: { product_id: string; name: string; quantity: number; revenue_minor: number }[]
  low_stock: { product_id: string; name: string; stock_qty: number; low_stock_threshold: number }[]
}

export type SaleReceipt = {
  gym_name: string
  receipt_no: string
  member_name: string | null
  items: { name: string; quantity: number; unit_price_minor: number; line_total_minor: number }[]
  total_minor: number
  currency: string
  method: Method
  sold_at: string
  status: 'valid' | 'void'
}

const useRefresh = () => {
  const qc = useQueryClient()
  return (keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
}

export const useProducts = (f: ProductFilters) =>
  useQuery({
    queryKey: ['products', f],
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<Product>>('/products', { ...f }),
  })

export const useSaveProduct = (id?: string) => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (b: ProductInput) => (id ? api.patch<Product>(`/products/${id}`, b) : api.post<Product>('/products', b)),
    onSuccess: () => refresh(['products', 'reports']),
  })
}

export const useAdjustStock = (id: string) => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (b: { delta: number; reason: 'restock' | 'adjustment'; note?: string }) => api.post<Product>(`/products/${id}/stock`, b),
    onSuccess: () => refresh(['products', 'reports']),
  })
}

export const useSales = (f: SaleFilters) =>
  useQuery({
    queryKey: ['sales', f],
    placeholderData: keepPreviousData,
    queryFn: () => api.get<Paginated<Sale>>('/sales', { ...f }),
  })

export const useCreateSale = () => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (b: NewSale) => api.post<Sale>('/sales', b),
    onSuccess: () => refresh(['products', 'sales', 'dashboard', 'reports']),
  })
}

export const useVoidSale = () => {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post<Sale>(`/sales/${id}/void`, { reason }),
    onSuccess: () => refresh(['products', 'sales', 'dashboard', 'reports']),
  })
}

export const useShopReport = (from?: string, to?: string) =>
  useQuery({ queryKey: ['reports', 'shop', from, to], queryFn: () => api.get<ShopReport>('/reports/shop', { date_from: from || undefined, date_to: to || undefined }) })

export const useSaleReceipt = (token: string) =>
  useQuery({ queryKey: ['sale-receipt', token], retry: false, queryFn: () => api.get<SaleReceipt>(`/public/sale-receipts/${token}`, undefined, { auth: false }) })
