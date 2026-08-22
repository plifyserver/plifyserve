'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { palhaAdminPrefix } from '@/lib/palha/site-settings-shared'

type UsageMeter = {
  usedBytes: number
  limitBytes: number
  remainingBytes: number
  percent: number
  usedLabel: string
  remainingLabel: string
  limitLabel: string
  plan: string
  ok?: boolean
}

type UsageAlbum = {
  id: string
  name: string
  publishedLabel: string
  sizeLabel: string
  files: number
  passwordProtected: boolean
  password: string
  passwordLabel: string
}

type UsagePayload = {
  updatedAt: string
  r2: UsageMeter & { provider: string }
  supabase: {
    provider: string
    database: UsageMeter
    storage: UsageMeter
  }
  albums: UsageAlbum[]
  error?: string
}

function Meter({
  title,
  hint,
  meter,
}: {
  title: string
  hint: string
  meter: UsageMeter
}) {
  const hot = meter.percent >= 90
  const warn = meter.percent >= 70
  return (
    <article className={`palha-usage-meter${hot ? ' is-hot' : warn ? ' is-warn' : ''}`}>
      <p className="palha-label">{title}</p>
      <strong>
        {meter.ok === false ? 'Indisponível' : meter.usedLabel}
        <span> / {meter.limitLabel}</span>
      </strong>
      <div className="palha-usage-bar" aria-hidden="true">
        <i style={{ width: `${meter.ok === false ? 0 : meter.percent}%` }} />
      </div>
      <p>
        {meter.ok === false
          ? 'Não foi possível ler este uso agora.'
          : `${meter.remainingLabel} livres · ${meter.plan}`}
      </p>
      <em>{hint}</em>
    </article>
  )
}

function PasswordCell({ album }: { album: UsageAlbum }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const canCopy = Boolean(album.password)

  async function copy() {
    if (!album.password) return
    try {
      await navigator.clipboard.writeText(album.password)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Senha do álbum:', album.password)
    }
  }

  return (
    <div className="palha-usage-pass">
      <code>{open && canCopy ? album.password : canCopy ? '••••••••' : album.passwordLabel}</code>
      {canCopy ? (
        <div>
          <button type="button" onClick={() => setOpen((value) => !value)}>
            {open ? 'Ocultar' : 'Mostrar'}
          </button>
          <button type="button" onClick={() => void copy()}>
            {copied ? 'Copiada' : 'Copiar'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function PalhaControleDadosPage() {
  const pathname = usePathname()
  const prefix = palhaAdminPrefix(pathname)
  const [data, setData] = useState<UsagePayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load(silent = false) {
      if (!silent) setLoading(true)
      try {
        const res = await fetch('/api/palha/usage', { cache: 'no-store', credentials: 'include' })
        const payload = (await res.json()) as UsagePayload
        if (cancelled) return
        if (!res.ok) throw new Error(payload.error || 'Não foi possível carregar o uso.')
        setData(payload)
        setError('')
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Não foi possível carregar o uso.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const timer = window.setInterval(() => void load(true), 12000)
    const onFocus = () => void load(true)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const updated = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : ''

  return (
    <main className="palha-admin-page palha-usage-page">
      <header className="palha-usage-head">
        <div>
          <h1 className="palha-kicker" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0 }}>
            Controle de dados
          </h1>
        </div>
        <p className={`palha-usage-live${loading ? ' is-loading' : ''}`}>
          {loading && !data ? 'Lendo armazenamento…' : updated ? `Atualizado às ${updated}` : 'Aguardando leitura'}
        </p>
      </header>

      {error ? <p className="palha-admin-error">{error}</p> : null}

      {data ? (
        <>
          <section className="palha-usage-grid">
            <Meter
              title="Cloudflare R2"
              hint="Fotos e vídeos dos álbuns. Plano free: 10 GB."
              meter={data.r2}
            />
            <Meter
              title="Supabase · banco"
              hint="Postgres do projeto (Plify + Palha). Plano free: 500 MB."
              meter={data.supabase.database}
            />
            <Meter
              title="Supabase · arquivos"
              hint="Storage do projeto, incluindo settings.json. Plano free: 1 GB."
              meter={data.supabase.storage}
            />
          </section>

          <section className="palha-usage-table-wrap">
            <h2>Álbuns</h2>
            {data.albums.length ? (
              <div className="palha-usage-table">
                <div className="palha-usage-row is-head">
                  <span>Álbum</span>
                  <span>Publicado</span>
                  <span>Senha</span>
                  <span>Uso</span>
                </div>
                {data.albums.map((album) => (
                  <article key={album.id} className="palha-usage-row">
                    <div>
                      <Link href={`${prefix}/painel/galeria/${album.id}`}>{album.name}</Link>
                      <small>{album.files} arquivo{album.files === 1 ? '' : 's'}</small>
                    </div>
                    <p>{album.publishedLabel}</p>
                    <PasswordCell album={album} />
                    <strong>{album.sizeLabel}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className="palha-copy">Nenhum álbum ainda.</p>
            )}
            <p className="palha-usage-note">
              Senhas definidas antes desta tela só aparecem depois que você salvar de novo no álbum.
            </p>
          </section>
        </>
      ) : null}
    </main>
  )
}
