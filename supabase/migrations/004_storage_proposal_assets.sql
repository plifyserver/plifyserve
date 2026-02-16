-- Bucket para fotos de propostas (galeria, produto) - leitura pública
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-assets', 'proposal-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "proposal_assets_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "proposal_assets_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'proposal-assets');

CREATE POLICY "proposal_assets_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "proposal_assets_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);
