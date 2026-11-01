import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Skeleton } from '@/shared/ui'
import { HomeRedirect, RequireAuth, RequireCap } from './guards'
import { AppLayout } from './layout/AppLayout'

const page = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(load)
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <C />
    </Suspense>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: page(() => import('@/features/auth/pages/LoginPage')) },
  { path: '/signup', element: page(() => import('@/features/auth/pages/SignupPage')) },
  { path: '/forgot-password', element: page(() => import('@/features/auth/pages/ForgotPasswordPage')) },
  { path: '/s/:token', element: page(() => import('@/features/receipts/pages/SaleReceiptPage')) },
  { path: '/r/:token', element: page(() => import('@/features/receipts/pages/ReceiptPage')) },
  {
    element: <RequireAuth />,
    children: [
      { path: '/change-password', element: page(() => import('@/features/auth/pages/ChangePasswordPage')) },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect dashboard={page(() => import('@/features/dashboard/pages/DashboardPage'))} /> },
          { path: 'members', element: page(() => import('@/features/members/pages/MembersPage')) },
          { path: 'members/:id', element: page(() => import('@/features/members/pages/MemberDetailPage')) },
          { path: 'attendance', element: page(() => import('@/features/attendance/pages/AttendancePage')) },
          {
            element: <RequireCap any={['shop.sell']} />,
            children: [{ path: 'shop', element: page(() => import('@/features/shop/pages/ShopPage')) }],
          },
          {
            element: <RequireCap any={['reports.view']} />,
            children: [{ path: 'overview', element: page(() => import('@/features/overview/pages/OverviewPage')) }],
          },
          { path: 'training', element: page(() => import('@/features/training/pages/TrainingPage')) },
          { path: 'plans', element: page(() => import('@/features/plans/pages/PlansPage')) },
          { path: 'settings', element: page(() => import('@/features/settings/pages/SettingsPage')) },
          {
            element: <RequireCap any={['payments.record']} />,
            children: [{ path: 'payments', element: page(() => import('@/features/payments/pages/PaymentsPage')) }],
          },
          {
            element: <RequireCap any={['sms.view', 'reminders.manage']} />,
            children: [{ path: 'reminders', element: page(() => import('@/features/reminders/pages/RemindersPage')) }],
          },
          {
            element: <RequireCap any={['staff.manage', 'staff.request']} />,
            children: [{ path: 'staff', element: page(() => import('@/features/staff/pages/StaffPage')) }],
          },
          {
            element: <RequireCap any={['branches.manage']} />,
            children: [{ path: 'branches', element: page(() => import('@/features/branches/pages/BranchesPage')) }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export const AppRouter = () => <RouterProvider router={router} />
