import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/core/api/client'
import { applyFieldErrors, errorMessage } from '@/shared/lib/errors'
import { Button, Input, Modal, Select, Textarea } from '@/shared/ui'
import { useAuthStore } from '@/core/auth/store'
import { asList, useTrainers } from '@/features/staff/api/staff'
import { useCreateMember, useUpdateMember } from '../api/members'
import type { Member } from '../types'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  gender: z.enum(['', 'male', 'female', 'other']),
  dob: z.string(),
  address: z.string(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
  preferred_language: z.enum(['', 'bn', 'en']),
  notes: z.string(),
  assigned_trainer_id: z.string(),
})
type Form = z.infer<typeof schema>

type Match = { id: string; member_code: string; name: string }

type Props = { open: boolean; onClose: () => void; member?: Member; onSaved?: (m: Member) => void }

export function MemberFormModal({ open, onClose, member, onSaved }: Props) {
  const { t } = useTranslation()
  const create = useCreateMember()
  const update = useUpdateMember(member?.id ?? '')
  const [dupes, setDupes] = useState<Match[]>([])
  const mutation = member ? update : create
  const canAssign = useAuthStore((s) => !!s.capabilities?.includes('members.manage'))
  const trainers = asList(useTrainers(canAssign).data)

  const { register, handleSubmit, setError, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: member?.name ?? '',
      phone: member?.phone ?? '',
      gender: member?.gender ?? '',
      dob: member?.dob ?? '',
      address: member?.address ?? '',
      emergency_contact_name: member?.emergency_contact_name ?? '',
      emergency_contact_phone: member?.emergency_contact_phone ?? '',
      preferred_language: member?.preferred_language ?? '',
      notes: member?.notes ?? '',
      assigned_trainer_id: member?.assigned_trainer?.id ?? '',
    },
  })

  const submit = (confirm_duplicate = false) =>
    handleSubmit((v) => {
      const body = { ...v, dob: v.dob || null, preferred_language: v.preferred_language || null, assigned_trainer_id: v.assigned_trainer_id || null, confirm_duplicate } as never
      mutation.mutate(body, {
        onSuccess: (m) => { toast.success(t('common.saved')); onSaved?.(m); onClose() },
        onError: (e) => {
          if (e instanceof ApiError && e.code === 'duplicate_phone') return setDupes((e.details.matches as Match[]) ?? [])
          applyFieldErrors(e, setError) || toast.error(errorMessage(e))
        },
      })
    })

  const err = (k: keyof Form) => errors[k] && (errors[k]?.message || t('validation.required'))

  return (
    <Modal open={open} onClose={onClose} title={member ? t('members.edit') : t('members.add')}>
      <form onSubmit={submit()} className="space-y-4">
        <Input label={t('members.name')} error={err('name')} {...register('name')} />
        <Input label={t('members.phone')} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" error={err('phone')} {...register('phone')} />
        {dupes.length > 0 && (
          <div className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
            <p className="font-semibold">{t('members.duplicatePhone')}</p>
            <ul className="mt-1 list-disc ps-5">{dupes.map((d) => <li key={d.id}>{d.name} ({d.member_code})</li>)}</ul>
            <Button type="button" size="sm" variant="outline" className="mt-2" onClick={submit(true)}>{t('members.saveAnyway')}</Button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('members.gender')} {...register('gender')}>
            <option value="">—</option>
            {(['male', 'female', 'other'] as const).map((g) => <option key={g} value={g}>{t(`gender.${g}`)}</option>)}
          </Select>
          <Input label={t('members.dob')} type="date" {...register('dob')} />
        </div>
        <Input label={t('members.address')} {...register('address')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('members.emergencyName')} {...register('emergency_contact_name')} />
          <Input label={t('members.emergencyPhone')} type="tel" {...register('emergency_contact_phone')} />
        </div>
        <Select label={t('members.preferredLanguage')} {...register('preferred_language')}>
          <option value="">{t('members.gymDefault')}</option>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </Select>
        {trainers.length > 0 && (
          <Select label={t('members.trainer')} {...register('assigned_trainer_id')}>
            <option value="">{t('members.noTrainer')}</option>
            {trainers.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
          </Select>
        )}
        <Textarea label={t('members.notes')} {...register('notes')} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}
