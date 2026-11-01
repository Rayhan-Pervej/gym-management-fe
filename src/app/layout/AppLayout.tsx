import { LogOut, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout, useMe } from '@/features/auth/api/auth'
import { useActiveBranches, useAuthStore } from '@/core/auth/store'
import { BranchSwitcher } from '@/shared/components/BranchSwitcher'
import { LanguageSwitch, Logo, ThemeToggle } from '@/shared/components/Preferences'
import { cn } from '@/shared/lib/cn'
import { Avatar, IconButton, Modal } from '@/shared/ui'
import { NAV, type NavItem } from '../nav'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg',
  )

function useNav() {
  const caps = useAuthStore((s) => s.capabilities)
  const branches = useActiveBranches().length
  return NAV.filter((n) => (!n.any || n.any.some((c) => caps?.includes(c))) && (!n.multiBranch || branches > 1))
}

function Sidebar({ items }: { items: NavItem[] }) {
  const { t } = useTranslation()
  const pending = useMe().data?.pending_staff_requests ?? 0
  return (
    <nav className="space-y-1">
      {items.map(({ to, key, icon: Icon, badge }) => (
        <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
          <Icon className="size-5" />
          <span className="flex-1">{t(`nav.${key}`)}</span>
          {badge === 'staffRequests' && pending > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-fg">{pending}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function ProfileCard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { user, gym, organization } = useAuthStore()
  const out = async () => {
    await logout()
    qc.clear()
    nav('/login')
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
      <Avatar name={user?.name ?? '?'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="truncate text-xs text-muted">{gym?.name ?? organization?.name} · {t(`roles.${user?.role}`)}</p>
      </div>
      <IconButton label={t('auth.logout')} onClick={out}>
        <LogOut className="size-5" />
      </IconButton>
    </div>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const items = useNav()
  const [more, setMore] = useState(false)
  const bottom = items.filter((i) => i.primary)
  const rest = items.filter((i) => !i.primary)

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-e border-border bg-surface p-4 lg:flex">
        <Logo className="px-2 pt-1" />
        <div className="flex-1 overflow-y-auto"><Sidebar items={items} /></div>
        <ProfileCard />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/85 px-4 py-2 backdrop-blur lg:px-8">
          <Logo className="lg:hidden" />
          <BranchSwitcher className="max-lg:hidden" />
          <div className="flex items-center">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </header>

        <div className="px-4 pt-3 lg:hidden"><BranchSwitcher className="w-full max-w-none" /></div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-flow-col auto-cols-fr border-t border-border bg-surface/95 px-1 pt-1.5 backdrop-blur lg:hidden">
        {bottom.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted')}>
            <Icon className="size-5" />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-muted">
          <MoreHorizontal className="size-5" />
          {t('nav.more')}
        </button>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title={t('nav.more')}>
        <div onClick={() => setMore(false)} className="space-y-4">
          <Sidebar items={rest} />
          <ProfileCard />
        </div>
      </Modal>
    </div>
  )
}
