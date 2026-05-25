
-- 1. app_settings: contains bank details — restrict reads to admins only
DROP POLICY IF EXISTS "settings readable by all" ON public.app_settings;
CREATE POLICY "settings readable by admin"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. profiles: add explicit INSERT policy
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. number_orders: add INSERT (self), UPDATE/DELETE (admin) policies
CREATE POLICY "users insert own number orders"
  ON public.number_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins update number orders"
  ON public.number_orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete number orders"
  ON public.number_orders FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Realtime: remove sensitive tables from broadcast publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.deposits;
ALTER PUBLICATION supabase_realtime DROP TABLE public.number_orders;

-- 5. Lock down SECURITY DEFINER trigger functions from being called directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
