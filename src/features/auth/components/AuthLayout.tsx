import { BellRing, Wallet, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch, Logo, ThemeToggle } from '@/shared/components/Preferences'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t } = useTranslation()
  const points = [
    { icon: Users, text: t('auth.pointMembers') },
    { icon: Wallet, text: t('auth.pointDues') },
    { icon: BellRing, text: t('auth.pointSms') },
  ]
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-e border-border bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -start-24 -top-24 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-32 end-0 size-96 rounded-full bg-primary/15 blur-3xl" />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">{t('auth.tagline')}</h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-muted">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft">
                  <Icon className="size-5 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-muted">© GymFlow</p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4">
          <Logo className="lg:invisible" />
          <div className="flex">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  )
}
