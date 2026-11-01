import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Paginated } from '@/core/api/types'
import type { MemberStatus } from '@/features/members/types'

export type Attendance = {
  id: string
  member_id: string
  member_name: string
  member_code: string
  checked_in_at: string
  status_at_checkin: MemberStatus
  had_dues: boolean
}

export type CheckInResult = { attendance: Attendance; warnings: string[]; already_checked_in: boolean }

export const useAttendance = (date: string) =>
  useQuery({ queryKey: ['attendance', date], queryFn: () => api.get<Paginated<Attendance> | Attendance[]>('/attendance', { date, page_size: 100 }) })

export const useCheckIn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (member_id: string) => api.post<CheckInResult>('/attendance/check-in', { member_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  })
}
