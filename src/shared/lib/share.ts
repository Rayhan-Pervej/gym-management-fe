import i18n from '@/core/i18n'
import { toast } from 'sonner'

export async function shareLink(url: string) {
  try {
    if (navigator.share) return await navigator.share({ url })
    await navigator.clipboard.writeText(url)
    toast.success(i18n.t('payments.linkCopied'))
  } catch {
    /* dismissed */
  }
}
