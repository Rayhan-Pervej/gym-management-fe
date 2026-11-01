import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFmt } from '@/shared/hooks/useFmt'
import { IconButton } from './Button'

type Props = { page: number; count: number; pageSize: number; onChange: (p: number) => void }

export function Pagination({ page, count, pageSize, onChange }: Props) {
  const { t } = useTranslation()
  const { num } = useFmt()
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm text-muted">
      <span>{t('common.pageOf', { page: num(page), pages: num(pages) })}</span>
      <div className="flex">
        <IconButton label={t('common.prev')} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </IconButton>
        <IconButton label={t('common.next')} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="size-5 rtl:rotate-180" />
        </IconButton>
      </div>
    </div>
  )
}
