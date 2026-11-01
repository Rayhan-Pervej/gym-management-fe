import { BellRing, CalendarCheck, CreditCard, Dumbbell, GitBranch, Network, ShoppingBag, LayoutDashboard, Settings, Tags, UserCog, Users, type LucideIcon } from 'lucide-react'

export type NavItem = { to: string; key: string; icon: LucideIcon; any?: string[]; multiBranch?: boolean; primary?: boolean; badge?: 'staffRequests' }

export const NAV: NavItem[] = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard, any: ['reports.view'], primary: true },
  { to: '/overview', key: 'overview', icon: Network, any: ['reports.view'], multiBranch: true },
  { to: '/members', key: 'members', icon: Users, any: ['members.manage', 'members.view_assigned'], primary: true },
  { to: '/attendance', key: 'attendance', icon: CalendarCheck, any: ['attendance.manage', 'attendance.view_assigned'], primary: true },
  { to: '/payments', key: 'payments', icon: CreditCard, any: ['payments.record'], primary: true },
  { to: '/shop', key: 'shop', icon: ShoppingBag, any: ['shop.sell'] },
  { to: '/training', key: 'training', icon: Dumbbell, any: ['pt.log'] },
  { to: '/plans', key: 'plans', icon: Tags, any: ['plans.view'] },
  { to: '/reminders', key: 'reminders', icon: BellRing, any: ['sms.view', 'reminders.manage'] },
  { to: '/branches', key: 'branches', icon: GitBranch, any: ['branches.manage'] },
  { to: '/staff', key: 'staff', icon: UserCog, any: ['staff.manage', 'staff.request'], badge: 'staffRequests' },
  { to: '/settings', key: 'settings', icon: Settings },
]
