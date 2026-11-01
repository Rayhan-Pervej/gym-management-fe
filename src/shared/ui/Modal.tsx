import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from './Button'

type Props = { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }

export function Modal({ open, onClose, title, description, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border border-border bg-surface shadow-xl sm:inset-auto sm:start-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl rtl:sm:translate-x-1/2">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              <Dialog.Description className={description ? 'mt-0.5 text-sm text-muted' : 'sr-only'}>{description ?? title}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" className="-me-2 -mt-1">
                <X className="size-5" />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto p-5 pb-safe">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
