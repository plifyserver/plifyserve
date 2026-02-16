# Plify

SaaS leve com dashboard de métricas Meta Ads, templates de proposta e mini-site da empresa. Projetado para rodar 100% em planos gratuitos (Vercel + Supabase).

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Recharts
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Auth**: Email/senha + Facebook OAuth
- **Deploy**: Vercel

## Como rodar local

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Em **Settings > API** copie `Project URL` e `anon public` key
3. Crie o arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Rodar migrações

No **SQL Editor** do Supabase, execute o conteúdo de `supabase/migrations/001_init.sql`.

### 4. Configurar Facebook OAuth (opcional)

1. Crie um app em [developers.facebook.com](https://developers.facebook.com)
2. Em **Facebook Login > Settings**, adicione a URL de redirecionamento:
   - `https://seu-projeto.supabase.co/auth/v1/callback`
3. No Supabase: **Authentication > Providers > Facebook**
   - Ative e coloque App ID e App Secret

### 5. Subir o app

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Logo

Coloque o arquivo `plify.png` na pasta `public/` para exibir a logo do Plify.

## Deploy na Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Em Supabase, adicione a URL de produção nas URLs permitidas (Authentication > URL Configuration)

## Estrutura

- `/` – Landing
- `/login`, `/cadastro` – Auth (email + Facebook)
- `/dashboard` – Overview de propostas
- `/dashboard/metricas` – Dashboard Meta Ads (impressões, cliques, CPC, leads, etc.)
- `/dashboard/templates` – Escolher template de proposta
- `/dashboard/propostas` – Gerenciar propostas
- `/dashboard/faturamento` – Valor das propostas aceitas
- `/dashboard/minha-pagina` – Editar mini-site da empresa
- `/dashboard/assinatura` – Assinar Pro (MVP: simulado)
- `/p/[slug]` – Proposta pública (aceitar)
- `/empresa/[slug]` – Página pública da empresa

## Planos

- **Free**: 8 propostas, dashboard, templates, mini-site
- **Pro**: Propostas ilimitadas (R$ 4,90/mês) – simulado via flag no banco

## Integração Stripe (futuro)

O código está preparado para plugar o Stripe. Endpoints comentados/estrutura em:

- `src/app/api/subscription/simulate-pro` – trocar por `stripe/checkout`
- `src/app/api/stripe/webhook` – criar para eventos de assinatura
- Campo `stripe_customer_id` e `stripe_subscription_id` em `profiles`

## Banco de dados

Tabelas principais: `profiles`, `subscriptions`, `facebook_accounts`, `ad_snapshots`, `templates`, `proposals`, `proposal_events`, `company_pages`.

RLS ativado. Escrita apenas autenticada. Páginas públicas (`/p/[slug]`, `/empresa/[slug]`) em leitura.
