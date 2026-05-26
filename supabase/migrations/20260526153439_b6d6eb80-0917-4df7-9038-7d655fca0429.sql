
ALTER TABLE public.gift_orders
  ADD CONSTRAINT gift_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.gift_orders
  ADD CONSTRAINT gift_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.product_orders
  ADD CONSTRAINT product_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.product_orders
  ADD CONSTRAINT product_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TYPE public.gift_order_status ADD VALUE IF NOT EXISTS 'cancelled';

INSERT INTO public.app_settings (key, value)
VALUES ('gift_orders', jsonb_build_object('auto_refund_hours', 24))
ON CONFLICT (key) DO UPDATE
SET value = public.app_settings.value || EXCLUDED.value;
