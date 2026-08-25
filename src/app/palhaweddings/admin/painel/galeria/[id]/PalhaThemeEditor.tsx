'use client'

import { useEffect, useState } from 'react'
import {
  mergePalhaAlbumTheme,
  PALHA_COVER_LAYOUTS,
  PALHA_GRID_STYLES,
  PALHA_PALETTES,
  PALHA_THUMB_SIZES,
  PALHA_TYPOGRAPHIES,
  type PalhaAlbumTheme,
  type PalhaMediaFrame,
} from '@/lib/palha/album-theme'
import { PalhaAlbumPresentation } from '@/app/palhaweddings/PalhaAlbumPresentation'
import { PalhaButtonLookFields, PalhaColorField } from '../../PalhaButtonLookFields'
import type { PalhaAlbum } from '@/lib/palha/site-settings-shared'

export function PalhaThemeEditor({
  album,
  onChange,
  onFrameChange,
}: {
  album: PalhaAlbum
  onChange: (theme: PalhaAlbumTheme) => void
  onFrameChange: (id: string, frame: PalhaMediaFrame) => void
}) {
  const [theme, setTheme] = useState(() => mergePalhaAlbumTheme(album.theme))
  const previewAlbum = { ...album, theme }

  useEffect(() => {
    setTheme(mergePalhaAlbumTheme(album.theme))
  }, [album.id])

  function pick<K extends keyof PalhaAlbumTheme>(key: K, value: PalhaAlbumTheme[K]) {
    const next = { ...theme, [key]: value }
    setTheme(next)
    onChange(next)
  }

  return (
    <div className="palha-theme-editor">
      <div className="palha-theme-options">
        <section>
          <h3>Capa</h3>
          <div className="palha-theme-grid">
            {PALHA_COVER_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                className={`palha-theme-card is-cover is-${layout.id}${theme.cover === layout.id ? ' is-on' : ''}`}
                onClick={() => pick('cover', layout.id)}
              >
                <span className="palha-theme-mini">
                  <span>Título</span>
                </span>
                <strong>{layout.label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="palha-theme-look">
          <h3>Data e botão</h3>
          <p className="palha-theme-note">Só deste álbum. Campo vazio usa a paleta da capa.</p>
          <PalhaColorField
            label="Cor da data"
            value={theme.dateColor}
            fallback="#ffffff"
            onChange={(value) => pick('dateColor', value)}
          />
          <label>
            Texto do botão
            <input
              type="text"
              value={theme.galleryCta.label}
              onChange={(e) => pick('galleryCta', { ...theme.galleryCta, label: e.target.value })}
            />
          </label>
          <PalhaButtonLookFields
            title="Aparência do botão (Ver galeria)"
            look={theme.galleryCta}
            onChange={(look) => pick('galleryCta', { ...theme.galleryCta, ...look })}
          />
        </section>

        <section>
          <h3>Tipografia</h3>
          <div className="palha-theme-grid">
            {PALHA_TYPOGRAPHIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`palha-theme-card is-type is-${item.id}${theme.typography === item.id ? ' is-on' : ''}`}
                onClick={() => pick('typography', item.id)}
              >
                <span className="palha-type-sample">{item.label}</span>
                <em>{item.sample}</em>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Cor</h3>
          <div className="palha-theme-grid">
            {PALHA_PALETTES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`palha-theme-card${theme.palette === item.id ? ' is-on' : ''}`}
                onClick={() => pick('palette', item.id)}
              >
                <span className="palha-swatches">
                  {item.swatches.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Grade</h3>
          <h4>Estilo da grade</h4>
          <p className="palha-theme-note">
            Justificada fecha a linha como no Pixieset. O enquadramento de cada foto se muda no preview.
          </p>
          <div className="palha-theme-grid">
            {PALHA_GRID_STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`palha-theme-card is-grid is-${item.id}${theme.grid === item.id ? ' is-on' : ''}`}
                onClick={() => pick('grid', item.id)}
              >
                <span className="palha-grid-icon" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i />
                </span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
          <h4>Tamanho das miniaturas</h4>
          <div className="palha-theme-grid">
            {PALHA_THUMB_SIZES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`palha-theme-card is-grid is-${item.id}${theme.thumb === item.id ? ' is-on' : ''}`}
                onClick={() => pick('thumb', item.id)}
              >
                <span className="palha-grid-icon" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i />
                </span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="palha-theme-preview">
        <p className="palha-label">Prévia da página pública</p>
        <p className="palha-theme-note">Em cada foto do preview, escolha Auto, Larga, Quadrada ou Inteira.</p>
        <PalhaAlbumPresentation album={previewAlbum} preview onFrameChange={onFrameChange} />
      </div>
    </div>
  )
}
