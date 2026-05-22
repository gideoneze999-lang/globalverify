
-- enums
CREATE TYPE public.deposit_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.transaction_type AS ENUM ('deposit','purchase','number','refund','adjustment');
CREATE TYPE public.number_status AS ENUM ('pending','received','cancelled','finished','timeout');

-- app_settings
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable by all" ON public.app_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "settings writable by admin" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.app_settings(key,value) VALUES
 ('pricing', '{"markup_percent":20,"exchange_rate_ngn_per_usd":1600}'::jsonb),
 ('bank', '{"account_name":"Gideon Eze Nnachi","bank":"Moniepoint","account_number":"9160819483"}'::jsonb);

-- deposits
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  screenshot_url TEXT,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX deposits_user_idx ON public.deposits(user_id);
CREATE INDEX deposits_status_idx ON public.deposits(status);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own deposits" ON public.deposits FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own deposits" ON public.deposits FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admins update deposits" ON public.deposits FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER deposits_updated BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price_ngn NUMERIC(14,2) NOT NULL CHECK (price_ngn >= 0),
  category TEXT NOT NULL,
  description TEXT,
  asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products readable by all" ON public.products FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "products writable by admin" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_idx ON public.transactions(user_id, created_at DESC);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- cart_items
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- number_orders
CREATE TABLE public.number_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sim5_order_id TEXT,
  country TEXT NOT NULL,
  service TEXT NOT NULL,
  phone TEXT,
  price_ngn NUMERIC(14,2) NOT NULL,
  status public.number_status NOT NULL DEFAULT 'pending',
  sms JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX number_orders_user_idx ON public.number_orders(user_id, created_at DESC);
ALTER TABLE public.number_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own numbers" ON public.number_orders FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER number_orders_updated BEFORE UPDATE ON public.number_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.number_orders;
ALTER TABLE public.deposits REPLICA IDENTITY FULL;
ALTER TABLE public.number_orders REPLICA IDENTITY FULL;

-- storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products','products',true) ON CONFLICT DO NOTHING;

-- receipts policies (user-scoped: first folder = user id)
CREATE POLICY "users upload own receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users read own receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));

-- products policies (public read, admin write)
CREATE POLICY "products bucket public read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id='products');
CREATE POLICY "admins write products bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='products' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update products bucket" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='products' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete products bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='products' AND public.has_role(auth.uid(),'admin'));
