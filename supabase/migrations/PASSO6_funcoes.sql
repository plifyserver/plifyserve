-- PASSO 6: Funções de contagem
-- Execute APENAS este código

CREATE OR REPLACE FUNCTION increment_templates_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET templates_count = COALESCE(templates_count, 0) + 1,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_templates_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET templates_count = GREATEST(0, COALESCE(templates_count, 0) - 1),
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_templates_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_templates_count(UUID) TO authenticated;
