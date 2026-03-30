-- ═══════════════════════════════════════════════════════════════
-- StatusVault — User Alerts Table
-- Run in Supabase Dashboard → SQL Editor
-- This stores notification preferences unencrypted (contact info only)
-- and a list of expiring docs so the edge function can send alerts
-- without needing to decrypt user_data
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_alerts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_email   text,
  whatsapp_phone       text,
  expiring_docs        jsonb DEFAULT '[]'::jsonb,  -- [{id, label, icon, expiryDate}]
  updated_at           timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_alerts_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_alerts" ON public.user_alerts FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "insert_own_alerts" ON public.user_alerts FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_alerts" ON public.user_alerts FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "delete_own_alerts" ON public.user_alerts FOR DELETE  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_alerts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

CREATE TRIGGER trg_user_alerts_updated
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_alerts_updated_at();
