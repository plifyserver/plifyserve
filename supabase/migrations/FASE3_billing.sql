-- =============================================
-- FASE 3: SISTEMA DE BILLING
-- Execute este SQL no Supabase
-- =============================================

-- Atualizar tabela profiles com campos de billing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'essential' CHECK (plan_type IN ('essential', 'pro', 'admin')),
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive', 'trial', 'cancelled')),
ADD COLUMN IF NOT EXISTS templates_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Criar índices para queries de billing
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_status ON profiles(plan_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id) WHERE subscription_id IS NOT NULL;

-- Função para verificar limite de templates
CREATE OR REPLACE FUNCTION check_user_template_limit(p_user_id UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  current_count INTEGER,
  max_limit INTEGER,
  plan_type TEXT
) AS $$
DECLARE
  user_plan_type TEXT;
  user_templates_limit INTEGER;
  user_templates_count INTEGER;
BEGIN
  -- Buscar dados do usuário
  SELECT 
    COALESCE(p.plan_type, 'essential'),
    p.templates_limit,
    COALESCE(p.templates_count, 0)
  INTO user_plan_type, user_templates_limit, user_templates_count
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Admin e Pro não têm limite
  IF user_plan_type IN ('admin', 'pro') OR user_templates_limit IS NULL THEN
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      user_templates_count,
      NULL::INTEGER,
      user_plan_type;
    RETURN;
  END IF;

  -- Verificar limite para Essential
  RETURN QUERY SELECT 
    (user_templates_count < user_templates_limit)::BOOLEAN,
    user_templates_count,
    user_templates_limit,
    user_plan_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_user_template_limit(UUID) TO authenticated;

-- Função para atualizar plano do usuário
CREATE OR REPLACE FUNCTION update_user_plan(
  p_user_id UUID,
  p_plan_type TEXT,
  p_subscription_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  new_limit INTEGER;
BEGIN
  -- Definir limite baseado no plano
  IF p_plan_type = 'essential' THEN
    new_limit := 50;
  ELSE
    new_limit := NULL; -- ilimitado para pro e admin
  END IF;

  UPDATE profiles
  SET 
    plan_type = p_plan_type,
    templates_limit = new_limit,
    subscription_id = COALESCE(p_subscription_id, subscription_id),
    plan_started_at = NOW(),
    plan_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_plan(UUID, TEXT, TEXT) TO authenticated;

-- Atualizar usuários existentes para usar novo campo plan_type
-- (migrar do campo 'plan' existente se houver)
UPDATE profiles
SET plan_type = CASE 
  WHEN account_type = 'admin' THEN 'admin'
  WHEN plan = 'pro' THEN 'pro'
  ELSE 'essential'
END,
templates_limit = CASE 
  WHEN account_type = 'admin' OR plan = 'pro' THEN NULL
  ELSE 50
END
WHERE plan_type IS NULL OR plan_type = 'essential';
