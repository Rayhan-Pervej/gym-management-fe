import { CheckCircle2, Clock, Hourglass, MinusCircle, XCircle, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, type Tone } from '@/shared/ui'
import type { MemberStatus } from '../types'

export const STATUS_META: Record<MemberStatus, { tone: Tone; icon: LucideIcon }> = {
  active: { tone: 'success', icon: CheckCircle2 },
  expiring_soon: { tone: 'warning', icon: Clock },
  upcoming: { tone: 'info', icon: Hourglass },
  expired: { tone: 'danger', icon: XCircle },
  no_membership: { tone: 'neutral', icon: MinusCircle },
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  const { t } = useTranslation()
  const { tone, icon: Icon } = STATUS_META[status]
  return (
    <Badge tone={tone}>
      <Icon className="size-3.5" />
      {t(`status.${status}`)}
    </Badge>
  )
}
