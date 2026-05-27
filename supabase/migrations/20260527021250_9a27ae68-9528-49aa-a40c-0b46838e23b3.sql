ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gift_category text;
CREATE INDEX IF NOT EXISTS idx_products_gift_category ON public.products(gift_category) WHERE category = 'gift';