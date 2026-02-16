# Supabase: sem confirmar email no cadastro + email bonito de recuperação

## 1. Desativar confirmação de email no cadastro

1. Acesse **Supabase Dashboard** → seu projeto.
2. Vá em **Authentication** → **Providers** → **Email**.
3. Desative a opção **"Confirm email"** (toggle OFF).
4. Salve.

Assim o usuário pode usar a conta logo após se cadastrar, sem precisar clicar em link no email.

---

## 2. Usar o template de recuperação de senha (HTML bonito)

1. No Supabase: **Authentication** → **Email Templates**.
2. Selecione o template **"Reset Password"** (Recuperar senha).
3. No campo **Body (HTML)** ou **Message**, substitua todo o conteúdo pelo HTML que está no arquivo:
   - `docs/email-templates/recovery.html`
4. Ajuste a variável `{{ .ConfirmationURL }}` se o Supabase usar outra (ex.: `{{ .ConfirmationURL }}`).
5. Salve.

O template usa a logo da Plify e o estilo do produto. A URL da logo no email é `https://plifyserve.vercel.app/plify.png` (ou seu domínio em produção).

---

## 3. Redirect URL no Supabase

Para o link “Redefinir senha” levar o usuário de volta ao seu site:

- **Authentication** → **URL Configuration** → **Redirect URLs**  
  Inclua: `https://plifyserve.vercel.app/atualizar-senha` (e o mesmo com seu domínio se for outro).

Isso evita erro de “redirect URL não permitida” ao clicar no link do email.
