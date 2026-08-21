'use client'

import { useState } from 'react'

function palhaAdminHome() {
  return window.location.pathname.startsWith('/palhaweddings')
    ? '/palhaweddings/admin/painel'
    : '/admin/painel'
}

export default function PalhaAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const emailUsed = email.trim()
    const passwordUsed = password

    if (!emailUsed || !passwordUsed) {
      setLoading(false)
      setError('Preencha o e-mail e a senha.')
      return
    }

    try {
      const login = await fetch('/api/palha/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailUsed, password: passwordUsed }),
      })
      const loginData = (await login.json()) as { error?: string }
      if (!login.ok) {
        setError(loginData.error || 'Não foi possível entrar.')
        setLoading(false)
        return
      }

      window.location.assign(palhaAdminHome())
    } catch {
      setError('Não foi possível entrar. Tente de novo.')
      setLoading(false)
    }
  }

  return (
    <main className="palha-admin-login">
      <p className="palha-label">Admin</p>
      <h1 className="palha-kicker" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', margin: '0.8rem 0 1.6rem' }}>
        Entrar
      </h1>
      <form className="palha-admin-form" onSubmit={onSubmit}>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="palha-admin-error">{error}</p> : null}
        <button type="submit" className="palha-btn" disabled={loading}>
          {loading ? 'Aguarde…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
