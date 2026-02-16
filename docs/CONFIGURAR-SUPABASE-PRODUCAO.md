# Configurar Supabase para produção (plifyserve.vercel.app)

## 1. No Supabase Dashboard

Acesse: **https://supabase.com/dashboard** → seu projeto → **Authentication** → **URL Configuration**.

### Site URL
- **Site URL:** `https://plifyserve.vercel.app`  
  (Usado nos links de recuperação de senha, confirmação de email, etc.)

### Redirect URLs
Adicione estas URLs (uma por linha ou conforme a interface):

- `https://plifyserve.vercel.app`
- `https://plifyserve.vercel.app/**`
- `https://plifyserve.vercel.app/api/auth/callback`
- `https://plifyserve.vercel.app/atualizar-senha` (para o link de recuperação de senha)

Salve as alterações.

---

## 2. Na Vercel (variáveis de ambiente)

No projeto **plifyserve** na Vercel: **Settings** → **Environment Variables**.

Garanta que existam (e para **Production**):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | (igual ao do seu `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (igual ao do seu `.env.local`) |
| `SUPABASE_SERVICE_ROLE_KEY` | (igual ao do seu `.env.local`) |
| `NEXT_PUBLIC_SITE_URL` | `https://plifyserve.vercel.app` |

Depois de salvar, faça um **Redeploy** para as variáveis valerem no build.

---

## 3. Email templates (opcional)

Em **Authentication** → **Email Templates** você pode ajustar os textos de:

- **Confirm signup** – confirmação de cadastro
- **Reset password** – recuperação de senha

O link que o Supabase coloca nos emails usa o **Site URL** que você definiu no passo 1, então os links já vão apontar para `https://plifyserve.vercel.app`.

---

Resumo: **Site URL** e **Redirect URLs** no Supabase + **NEXT_PUBLIC_SITE_URL** na Vercel garantem que login, callback e recuperação de senha funcionem em produção.
