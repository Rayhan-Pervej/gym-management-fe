import { Dumbbell, Languages, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setLanguage, useLang } from '@/core/i18n'
import { useTheme, type Theme } from '@/core/theme/theme'
import { cn } from '@/shared/lib/cn'
import { IconButton } from '@/shared/ui'

const icons = { light: Sun, dark: Moon, system: Monitor }
const order: Theme[] = ['light', 'dark', 'system']

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const Icon = icons[theme]
  return (
    <IconButton label={t(`theme.${theme}`)} onClick={() => setTheme(order[(order.indexOf(theme) + 1) % order.length])}>
      <Icon className="size-5" />
    </IconButton>
  )
}

export function LanguageSwitch({ className }: { className?: string }) {
  const lang = useLang()
  return (
    <button
      onClick={() => setLanguage(lang === 'bn' ? 'en' : 'bn')}
      className={cn('inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-fg', className)}
    >
      <Languages className="size-5" />
      {lang === 'bn' ? 'EN' : 'বাংলা'}
    </button>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-fg">
        <Dumbbell className="size-5" />
      </span>
      GymFlow
    </span>
  )
}
