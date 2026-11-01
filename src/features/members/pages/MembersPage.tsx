import { Plus, Search, Upload, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCan } from '@/core/auth/store'
import { config } from '@/core/config'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Button, Card, Chips, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Pagination } from '@/shared/ui'
import { useMembers } from '../api/members'
import { ImportModal } from '../components/ImportModal'
import { MemberFormModal } from '../components/MemberFormModal'
import { MemberRow } from '../components/MemberRow'
import { MEMBER_STATUSES, type MemberStatus } from '../types'

type Filter = MemberStatus | '' | 'dues'

export default function MembersPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const canImport = useCan('members.import')
  const canManage = useCan('members.manage')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const search = useDebounce(q)
  const list = useMembers({ q: search, page, status: filter === 'dues' ? '' : filter, has_dues: filter === 'dues' ? true : undefined })
  const change = (f: Filter) => { setFilter(f); setPage(1) }

  const options = [
    { value: '' as Filter, label: t('common.all') },
    ...MEMBER_STATUSES.map((s) => ({ value: s as Filter, label: t(`status.${s}`) })),
    ...(canManage ? [{ value: 'dues' as Filter, label: t('members.hasDues') }] : []),
  ]

  return (
    <>
      <PageHeader
        title={t('nav.members')}
        subtitle={list.data ? t('members.total', { count: list.data.count }) : undefined}
        actions={
          <>
            {canImport && <Button variant="outline" icon={<Upload className="size-4" />} onClick={() => setImporting(true)} className="hidden sm:inline-flex">{t('members.import')}</Button>}
            {canManage && <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>{t('members.add')}</Button>}
          </>
        }
      />
      <div className="mb-4 space-y-3">
        <Input icon={<Search className="size-4" />} placeholder={t('members.searchPlaceholder')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Chips value={filter} onChange={change} options={options} />
      </div>
      <Card className="overflow-hidden">
        {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : list.data?.results.length === 0 ? (
          <EmptyState icon={Users} title={t('members.empty')} hint={t('members.emptyHint')} action={canManage ? <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>{t('members.add')}</Button> : undefined} />
        ) : (
          <div className="divide-y divide-border">{list.data?.results.map((m) => <MemberRow key={m.id} member={m} />)}</div>
        )}
        <Pagination page={page} count={list.data?.count ?? 0} pageSize={config.pageSize} onChange={setPage} />
      </Card>
      {adding && <MemberFormModal open onClose={() => setAdding(false)} onSaved={(m) => nav(`/members/${m.id}`)} />}
      {importing && <ImportModal open onClose={() => setImporting(false)} />}
    </>
  )
}

