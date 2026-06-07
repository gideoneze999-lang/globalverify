ALTER TABLE public.bulk_sms_jobs ADD COLUMN IF NOT EXISTS delivered_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.bulk_sms_recipients ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.bulk_sms_recipients ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_bulk_sms_recipients_twilio_sid ON public.bulk_sms_recipients(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_bulk_sms_recipients_job_id ON public.bulk_sms_recipients(job_id);