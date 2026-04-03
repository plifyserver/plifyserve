-- Remove integração Outlook/Microsoft (dados e coluna legada).
-- Rode se já tinha aplicado uma versão anterior de 20260402 com 'microsoft'.

DELETE FROM calendar_integrations WHERE provider = 'microsoft';
DELETE FROM calendar_oauth_states WHERE provider = 'microsoft';

ALTER TABLE events DROP COLUMN IF EXISTS microsoft_event_id;

ALTER TABLE calendar_integrations DROP CONSTRAINT IF EXISTS calendar_integrations_provider_check;
ALTER TABLE calendar_oauth_states DROP CONSTRAINT IF EXISTS calendar_oauth_states_provider_check;

ALTER TABLE calendar_integrations
  ADD CONSTRAINT calendar_integrations_provider_check CHECK (provider IN ('google'));
ALTER TABLE calendar_oauth_states
  ADD CONSTRAINT calendar_oauth_states_provider_check CHECK (provider IN ('google'));
