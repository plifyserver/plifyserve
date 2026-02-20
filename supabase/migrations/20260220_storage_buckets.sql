-- =============================================
-- STORAGE: BUCKETS E POLÍTICAS
-- Execute este arquivo SEPARADAMENTE no SQL Editor
-- após executar o arquivo principal
-- =============================================

-- Criar bucket para imagens de templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- POLÍTICAS DE STORAGE (executar uma por vez se der erro)
-- =============================================

-- Remover políticas existentes (ignorar erros)
DROP POLICY IF EXISTS "Users can upload template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Políticas para template-images
CREATE POLICY "Users can upload template images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'template-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view template images" ON storage.objects
  FOR SELECT USING (bucket_id = 'template-images');

CREATE POLICY "Users can delete own template images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'template-images' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Políticas para avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
