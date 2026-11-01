const SYMBOL: Record<string, string> = { BDT: '৳', INR: '₹', PKR: 'Rs', NPR: 'Rs', LKR: 'Rs' }

const numLocale = (lang: string) => (lang === 'bn' ? 'bn-BD' : 'en-IN')

export const formatMoney = (minor: number, currency = 'BDT', lang = 'en') => {
  const major = minor / 100
  const whole = minor % 100 === 0
  const n = new Intl.NumberFormat(numLocale(lang), {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major)
  return `${SYMBOL[currency] ?? currency} ${n}`
}

export const formatNumber = (n: number, lang = 'en') => new Intl.NumberFormat(numLocale(lang)).format(n)

export const toMinor = (taka: string | number) => Math.round(Number(taka) * 100)
export const toMajor = (minor: number) => minor / 100

const parseDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

export const formatDate = (d: string | null | undefined, lang = 'en') =>
  d ? new Intl.DateTimeFormat(numLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(parseDate(d)) : '—'

export const formatDateTime = (iso: string, lang = 'en', timeZone = 'Asia/Dhaka') =>
  new Intl.DateTimeFormat(numLocale(lang), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso))

export const todayIn = (timeZone = 'Asia/Dhaka') => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
