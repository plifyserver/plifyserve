-- Aceitar proposta também quando status for 'open' (compatível com tabela que usa open/accepted/ignored)
CREATE OR REPLACE FUNCTION accept_proposal(p_proposal_id UUID, p_ip_address TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  proposal_owner_id UUID;
  proposal_title TEXT;
  proposal_client TEXT;
BEGIN
  UPDATE proposals
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
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
      'ip_address', p_ip_address
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
