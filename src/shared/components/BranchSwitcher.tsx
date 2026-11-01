import * as Menu from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, GitBranch } from 'lucide-react'
import { useAuthStore } from '@/core/auth/store'
import { cn } from '@/shared/lib/cn'

export function BranchSwitcher({ className }: { className?: string }) {
  const qc = useQueryClient()
  const { branches, branchId, setBranch } = useAuthStore()
  const active = (branches ?? []).filter((b) => b.status === 'active')
  const current = active.find((b) => b.id === branchId)
  if (active.length < 2) return null

  const choose = (id: string) => {
    setBranch(id)
    qc.resetQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
  }

  return (
    <Menu.Root>
      <Menu.Trigger className={cn('flex h-10 max-w-48 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold transition hover:bg-surface-2', className)}>
        <GitBranch className="size-4 shrink-0 text-primary" />
        <span className="truncate">{current?.name}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={6} className="z-50 min-w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          {active.map((b) => (
            <Menu.Item key={b.id} onSelect={() => choose(b.id)} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-surface-2">
              {b.name}
              {b.id === branchId && <Check className="size-4 text-primary" />}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
