
ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS voice_sample_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS cost_per_minute_ngn numeric,
  ADD COLUMN IF NOT EXISTS ownership_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS script text;

UPDATE public.app_settings
   SET value = value || jsonb_build_object('voice_per_minute_ngn', COALESCE((value->>'voice_per_minute_ngn')::numeric, 4000))
 WHERE key = 'messaging_pricing';
