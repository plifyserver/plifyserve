'use client'

import { useEffect } from 'react'

/**
 * Garante que a tecla Espaço funcione em inputs e textareas em toda a aplicação.
 * Alguns navegadores ou extensões podem capturar o espaço; este listener insere
 * o espaço manualmente quando o foco está em campo de texto.
 */
export function SpaceKeyFix() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return
      const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | HTMLElement | null
      if (!el) return
      const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
      const isContentEditable = el.isContentEditable
      if (!isInput && !isContentEditable) return

      const input = el as HTMLInputElement | HTMLTextAreaElement
      const type = input.type?.toLowerCase()
      if (el.tagName === 'INPUT' && (type === 'checkbox' || type === 'radio' || type === 'submit' || type === 'button')) return

      e.preventDefault()
      e.stopPropagation()

      if (isContentEditable) {
        document.execCommand('insertText', false, ' ')
        return
      }

      const start = input.selectionStart ?? input.value.length
      const end = input.selectionEnd ?? input.value.length
      const value = input.value ?? ''
      const newValue = value.slice(0, start) + ' ' + value.slice(end)
      input.value = newValue
      input.setSelectionRange(start + 1, start + 1)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return null
}
