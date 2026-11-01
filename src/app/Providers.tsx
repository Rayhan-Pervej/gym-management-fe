import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ApiError } from '@/core/api/client'
import { useTheme } from '@/core/theme/theme'

const noRetry = (count: number, e: unknown) => !(e instanceof ApiError && e.status < 500) && count < 2

const client = new QueryClient({
  defaultOptions: { queries: { retry: noRetry, staleTime: 30_000, refetchOnWindowFocus: false } },
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
})

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="top-center" richColors closeButton />
}

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    {children}
    <ThemedToaster />
  </QueryClientProvider>
)
