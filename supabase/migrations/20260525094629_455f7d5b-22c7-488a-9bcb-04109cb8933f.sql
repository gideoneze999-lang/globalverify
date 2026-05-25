
-- products: access link admin sets, shown to buyer after purchase
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS access_link text;

-- product_orders: marketplace purchases
CREATE TYPE product_order_status AS ENUM ('pending', 'delivered');

CREATE TABLE public.product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  amount_ngn numeric NOT NULL,
  access_link text,
  tracking_code text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  status product_order_status NOT NULL DEFAULT 'delivered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own product orders"
  ON public.product_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own product orders"
  ON public.product_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins update product orders"
  ON public.product_orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER product_orders_set_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- gift_orders: send-a-gift flow
CREATE TYPE gift_delivery_tier AS ENUM ('same_day', 'next_day', 'within_week');
CREATE TYPE gift_order_status AS ENUM ('pending', 'processing', 'processed', 'delivered');

CREATE TABLE public.gift_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  recipient_phone text,
  message text,
  delivery_tier gift_delivery_tier NOT NULL,
  amount_ngn numeric NOT NULL,
  status gift_order_status NOT NULL DEFAULT 'pending',
  tracking_code text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own gift orders"
  ON public.gift_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own gift orders"
  ON public.gift_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins update gift orders"
  ON public.gift_orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER gift_orders_set_updated_at
  BEFORE UPDATE ON public.gift_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
