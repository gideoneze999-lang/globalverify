
-- 1) Restrict products.access_link from public reads via column-level grants.
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (id, title, description, asset_url, category, price_ngn, created_at, updated_at)
  ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

-- 2) Allow users to update/delete their own receipt files (folder = their user id).
CREATE POLICY "users update own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
