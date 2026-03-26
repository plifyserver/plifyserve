-- Alinha status com a API (draft/sent/...) e com legado open/accepted/ignored.
-- Adiciona coluna slug quando a tabela veio só do FASE5 (só public_slug).

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'proposals'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.proposals DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_status_check
  CHECK (
    status IN ('draft', 'sent', 'viewed', 'accepted', 'open', 'ignored')
  );

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.proposals
SET slug = public_slug
WHERE slug IS NULL AND public_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS proposals_slug_unique_idx
  ON public.proposals (slug)
  WHERE slug IS NOT NULL;
