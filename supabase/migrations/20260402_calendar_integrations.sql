-- Integrações de calendário (Google) + feed ICS
-- Execute no Supabase após deploy do app (rotas OAuth e ICS).

CREATE TABLE IF NOT EXISTS calendar_oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_oauth_states_user ON calendar_oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_oauth_states_created ON calendar_oauth_states(created_at);

CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  provider_account_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON calendar_integrations(user_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_ics_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_calendar_ics_token ON profiles(calendar_ics_token) WHERE calendar_ics_token IS NOT NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE calendar_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_oauth_states_own" ON calendar_oauth_states;
CREATE POLICY "calendar_oauth_states_own" ON calendar_oauth_states
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_integrations_own" ON calendar_integrations;
CREATE POLICY "calendar_integrations_own" ON calendar_integrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
