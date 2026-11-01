import { request } from '@/core/api/client'

export async function downloadFile(path: string, params: Record<string, string | undefined>, filename: string) {
  const blob = await request<Blob>(path, { params })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}
