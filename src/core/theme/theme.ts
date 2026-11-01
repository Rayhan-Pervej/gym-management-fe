import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'gf-theme'
const mq = matchMedia('(prefers-color-scheme: dark)')

const apply = (t: Theme) => document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && mq.matches))

const initial = (localStorage.getItem(KEY) as Theme) || 'system'
apply(initial)

export const useTheme = create<{ theme: Theme; setTheme: (t: Theme) => void }>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    localStorage.setItem(KEY, theme)
    apply(theme)
    set({ theme })
  },
}))

mq.addEventListener('change', () => apply(useTheme.getState().theme))
