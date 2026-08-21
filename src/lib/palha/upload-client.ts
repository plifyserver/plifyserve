import type { PalhaMediaKind } from '@/lib/palha/site-settings-shared'

export async function uploadPalhaMediaFile(file: File, folder: string) {
  const form = new FormData()
  form.set('folder', folder)
  form.set('file', file)
  const res = await fetch('/api/palha/site/media', {
    method: 'POST',
    body: form,
  })
  const data = (await res.json()) as { url?: string; kind?: PalhaMediaKind; error?: string }
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Não foi possível enviar o arquivo.')
  }
  return { url: data.url, kind: (data.kind === 'video' ? 'video' : 'image') as PalhaMediaKind }
}
