
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.auto_refund_stale_gift_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_hours int;
  r record;
  refunded int := 0;
BEGIN
  SELECT COALESCE((value->>'auto_refund_hours')::int, 24)
    INTO cutoff_hours
  FROM public.app_settings WHERE key = 'gift_orders';
  cutoff_hours := COALESCE(cutoff_hours, 24);

  FOR r IN
    SELECT * FROM public.gift_orders
    WHERE status = 'pending'
      AND created_at < now() - make_interval(hours => cutoff_hours)
  LOOP
    UPDATE public.profiles
       SET wallet_balance = wallet_balance + r.amount_ngn
     WHERE id = r.user_id;

    INSERT INTO public.transactions(user_id, type, amount, description, meta)
    VALUES (
      r.user_id, 'refund', r.amount_ngn,
      'Auto-refund — gift order not processed within ' || cutoff_hours || 'h',
      jsonb_build_object('gift_order_id', r.id, 'tracking_code', r.tracking_code)
    );

    UPDATE public.gift_orders
       SET status = 'cancelled',
           admin_note = COALESCE(admin_note,'') ||
             E'\n[auto] Refunded after ' || cutoff_hours || 'h (no admin action).'
     WHERE id = r.id;

    refunded := refunded + 1;
  END LOOP;
  RETURN refunded;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_refund_stale_gift_orders() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'auto-refund-stale-gift-orders',
  '0 * * * *',
  $$SELECT public.auto_refund_stale_gift_orders();$$
);
