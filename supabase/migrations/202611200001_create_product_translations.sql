CREATE TABLE IF NOT EXISTS public.product_translations (
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL CHECK (language_code IN ('en','kn','hi','ta','te','ml')),
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT '',
    materials TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    story TEXT NOT NULL DEFAULT '',
    seo_keywords TEXT NOT NULL DEFAULT '',
    source_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, language_code)
);

ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.product_translations TO anon, authenticated;

DROP POLICY IF EXISTS public_read_product_translations
ON public.product_translations;

CREATE POLICY public_read_product_translations
ON public.product_translations
FOR SELECT
TO anon, authenticated
USING (true);
