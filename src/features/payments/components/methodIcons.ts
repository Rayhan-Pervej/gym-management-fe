import { Banknote, Building2, CreditCard, Smartphone, type LucideIcon } from 'lucide-react'
import type { Method } from '../api/payments'

export const METHOD_ICON: Record<Method, LucideIcon> = {
  cash: Banknote,
  bkash: Smartphone,
  nagad: Smartphone,
  rocket: Smartphone,
  card: CreditCard,
  bank: Building2,
}

