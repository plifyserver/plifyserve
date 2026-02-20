-- PASSO 5: RLS para template_images
-- Execute APENAS este código

ALTER TABLE template_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view images of own templates" ON template_images;
DROP POLICY IF EXISTS "Users can insert images to own templates" ON template_images;
DROP POLICY IF EXISTS "Users can delete images from own templates" ON template_images;

CREATE POLICY "Users can view images of own templates" ON template_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images to own templates" ON template_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from own templates" ON template_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );
