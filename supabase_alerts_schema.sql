-- ═══════════════════════════════════════════════════════════════
-- StatusVault — User Alerts Table (idempotent — safe to re-run)
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_email   text,
  whatsapp_phone       text,
  expiring_docs        jsonb DEFAULT '[]'::jsonb,
  updated_at           timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_alerts_user_id_key UNIQUE (user_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies before recreating (safe to re-run)
DROP POLICY IF EXISTS "select_own_alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "insert_own_alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "update_own_alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "delete_own_alerts" ON public.user_alerts;

-- 4. Recreate policies
CREATE POLICY "select_own_alerts" ON public.user_alerts FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "insert_own_alerts" ON public.user_alerts FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_alerts" ON public.user_alerts FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "delete_own_alerts" ON public.user_alerts FOR DELETE  USING (auth.uid() = user_id);

-- 5. Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.handle_alerts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

-- 6. Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS trg_user_alerts_updated ON public.user_alerts;
CREATE TRIGGER trg_user_alerts_updated
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_alerts_updated_at();
