import { useGym } from '@/core/auth/store'
import { useLang } from '@/core/i18n'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format'

export function useFmt() {
  const lang = useLang()
  const gym = useGym()
  const currency = gym?.currency ?? 'BDT'
  const tz = gym?.timezone ?? 'Asia/Dhaka'
  return {
    lang,
    currency,
    tz,
    money: (minor: number) => formatMoney(minor, currency, lang),
    num: (n: number) => formatNumber(n, lang),
    date: (d?: string | null) => formatDate(d, lang),
    dateTime: (iso: string) => formatDateTime(iso, lang, tz),
  }
}
