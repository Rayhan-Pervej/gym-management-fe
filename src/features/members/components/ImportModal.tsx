import { Download, FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ApiError } from '@/core/api/client'
import { downloadFile } from '@/shared/lib/csv'
import { errorMessage } from '@/shared/lib/errors'
import { Button, Modal } from '@/shared/ui'
import { useImportMembers } from '../api/members'

type Result = { total: number; created: number; errors: { row: number; column: string; message: string }[]; errors_total?: number }

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const imp = useImportMembers()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [result, setResult] = useState<Result>()

  const run = (dryRun: boolean) =>
    file && imp.mutate({ file, dryRun }, {
      onSuccess: (r) => { setResult(r); !dryRun && (toast.success(t('members.imported', { count: r.created })), onClose()) },
      onError: (e) => (e instanceof ApiError && e.code === 'import_has_errors' ? setResult(e.details as unknown as Result) : toast.error(errorMessage(e))),
    })

  return (
    <Modal open={open} onClose={onClose} title={t('members.import')} description={t('members.importHint')}>
      <div className="space-y-4">
        <Button variant="outline" size="sm" icon={<Download className="size-4" />} onClick={() => downloadFile('/members/import/template', {}, 'members-template.csv')}>{t('members.template')}</Button>
        <button onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-muted transition hover:border-primary hover:text-primary">
          <FileUp className="size-8" />
          <span className="text-sm font-medium">{file?.name ?? t('members.chooseCsv')}</span>
        </button>
        <input ref={input} type="file" accept=".csv" hidden onChange={(e) => { setFile(e.target.files?.[0]); setResult(undefined) }} />
        {result && (
          <div className="max-h-48 overflow-y-auto rounded-xl bg-surface-2 p-3 text-sm">
            <p className="font-semibold">{t('members.importRows', { total: result.total })}</p>
            {result.errors.length === 0 ? <p className="text-success">{t('members.importOk')}</p> : (result.errors_total ?? 0) > result.errors.length && <p className="text-warning">{t('members.moreErrors', { count: result.errors_total })}</p>}
            {result.errors.map((e, i) => <p key={i} className="text-danger">{t('members.rowError', { row: e.row, column: e.column, message: e.message })}</p>)}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={!file} loading={imp.isPending} onClick={() => run(true)}>{t('members.preview')}</Button>
          <Button disabled={!file || !result || result.errors.length > 0} loading={imp.isPending} onClick={() => run(false)}>{t('members.import')}</Button>
        </div>
      </div>
    </Modal>
  )
}
