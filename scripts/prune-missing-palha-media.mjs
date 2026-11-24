/**
 * Remove do settings.json itens cujo arquivo não existe mais no R2.
 * Uso: node --env-file=.env.local scripts/prune-missing-palha-media.mjs
 */
import { createClient } from '@supabase/supabase-js'

const MISSING_IDS = new Set([
  'media-mwl33y0w-0nzb1',
  'media-mwl340ha-4m03i',
  'media-mwl3nl6i-cvv6n',
  'media-mwl3nmst-8itej',
  'media-mwl3ntbj-wxfq8',
  'media-mwl3nzzh-h60ad',
])

const url =
  process.env.NEXT_PUBLIC_PALHA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.PALHA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = 'palha-site'
const path = 'settings.json'

if (!url || !key) {
  console.error('Faltam variáveis Supabase (URL + SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.storage.from(bucket).download(path)
if (error || !data) {
  console.error('Falha ao baixar settings.json', error)
  process.exit(1)
}

const settings = JSON.parse(await data.text())
let removed = 0
for (const album of settings.gallery?.albums || []) {
  for (const sub of album.subalbums || []) {
    const before = sub.items?.length || 0
    sub.items = (sub.items || []).filter((item) => {
      if (!MISSING_IDS.has(item.id)) return true
      removed += 1
      console.log('remove', album.id, item.id, item.url)
      return false
    })
    console.log(album.id, sub.id, `${before} -> ${sub.items.length}`)
  }
}

if (!removed) {
  console.log('Nada a remover')
  process.exit(0)
}

const body = JSON.stringify(settings, null, 2)
const { error: upErr } = await supabase.storage.from(bucket).upload(path, new Blob([body], { type: 'application/json' }), {
  upsert: true,
  contentType: 'application/json',
  cacheControl: '0',
})
if (upErr) {
  console.error('Falha ao salvar settings.json', upErr)
  process.exit(1)
}
console.log(`OK: removidos ${removed} itens órfãos`)
