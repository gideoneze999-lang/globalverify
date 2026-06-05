
-- Twilio sender numbers pool (admin-managed)
CREATE TABLE public.twilio_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE,
  country_iso2 text NOT NULL,
  label text,
  capabilities jsonb NOT NULL DEFAULT '{"sms":true,"voice":true}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.twilio_numbers TO authenticated;
GRANT ALL ON public.twilio_numbers TO service_role;
ALTER TABLE public.twilio_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage twilio numbers" ON public.twilio_numbers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "authed read active twilio numbers" ON public.twilio_numbers FOR SELECT TO authenticated
  USING (active = true);
CREATE TRIGGER trg_twilio_numbers_updated BEFORE UPDATE ON public.twilio_numbers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bulk SMS jobs
CREATE TYPE bulk_sms_status AS ENUM ('pending','sending','completed','failed','partial');

CREATE TABLE public.bulk_sms_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  total_recipients int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  total_cost_ngn numeric NOT NULL DEFAULT 0,
  status bulk_sms_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bulk_sms_jobs TO authenticated;
GRANT ALL ON public.bulk_sms_jobs TO service_role;
ALTER TABLE public.bulk_sms_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own bulk jobs" ON public.bulk_sms_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own bulk jobs" ON public.bulk_sms_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_bulk_sms_jobs_updated BEFORE UPDATE ON public.bulk_sms_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Per-recipient rows
CREATE TABLE public.bulk_sms_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.bulk_sms_jobs(id) ON DELETE CASCADE,
  to_phone text NOT NULL,
  country_iso2 text,
  from_phone text,
  twilio_sid text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  cost_ngn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bulk_sms_recipients TO authenticated;
GRANT ALL ON public.bulk_sms_recipients TO service_role;
ALTER TABLE public.bulk_sms_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own recipients" ON public.bulk_sms_recipients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bulk_sms_jobs j WHERE j.id = job_id AND (j.user_id = auth.uid() OR has_role(auth.uid(),'admin'))));
CREATE INDEX idx_bulk_sms_recipients_job ON public.bulk_sms_recipients(job_id);

-- Voice calls
CREATE TABLE public.voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  to_phone text NOT NULL,
  from_phone text NOT NULL,
  message text NOT NULL,
  twilio_sid text,
  status text NOT NULL DEFAULT 'queued',
  cost_ngn numeric NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.voice_calls TO authenticated;
GRANT ALL ON public.voice_calls TO service_role;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own calls" ON public.voice_calls FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own calls" ON public.voice_calls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_voice_calls_updated BEFORE UPDATE ON public.voice_calls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Default messaging pricing settings
INSERT INTO public.app_settings(key, value) VALUES
  ('messaging_pricing', '{"sms_per_segment_ngn": 25, "voice_per_call_ngn": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;
