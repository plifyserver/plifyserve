-- Aceite público: mescla opcional em content (comentário do cliente, plano escolhido) e atualiza valor
DROP FUNCTION IF EXISTS accept_proposal(UUID, TEXT);

CREATE OR REPLACE FUNCTION accept_proposal(
  p_proposal_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_content_patch JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  proposal_owner_id UUID;
  proposal_title TEXT;
  proposal_client TEXT;
  new_value DECIMAL(12,2);
BEGIN
  new_value := NULL;
  IF p_content_patch IS NOT NULL
     AND jsonb_typeof(p_content_patch->'acceptedPlan') = 'object'
     AND (p_content_patch->'acceptedPlan' ? 'price')
  THEN
    BEGIN
      new_value := (p_content_patch->'acceptedPlan'->>'price')::DECIMAL(12,2);
    EXCEPTION WHEN OTHERS THEN
      new_value := NULL;
    END;
  END IF;

  UPDATE proposals
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW(),
      content = CASE
        WHEN p_content_patch IS NOT NULL
          AND jsonb_typeof(COALESCE(content, '{}'::jsonb)) = 'object'
        THEN COALESCE(content, '{}'::jsonb) || p_content_patch
        ELSE content
      END,
      proposal_value = COALESCE(new_value, proposal_value)
  WHERE id = p_proposal_id AND status IN ('sent', 'viewed', 'open')
  RETURNING user_id, title, client_name INTO proposal_owner_id, proposal_title, proposal_client;

  IF proposal_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    proposal_owner_id,
    'proposal_accepted',
    'Proposta aceita!',
    COALESCE(proposal_client, 'Cliente') || ' aceitou sua proposta!',
    jsonb_build_object(
      'proposal_id', p_proposal_id,
      'proposal_title', proposal_title,
      'client_name', proposal_client,
      'accepted_at', NOW(),
      'ip_address', p_ip_address,
      'client_comment', COALESCE(p_content_patch->>'acceptanceClientComment', ''),
      'selected_plan_id', COALESCE(p_content_patch->>'acceptedPlanId', '')
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_proposal(UUID, TEXT, JSONB) TO anon, authenticated;
-- Chamadas legadas com 2 args usam default NULL no patch
