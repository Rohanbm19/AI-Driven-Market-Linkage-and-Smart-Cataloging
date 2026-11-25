CREATE TABLE IF NOT EXISTS public.artisan_translations (
    artisan_id TEXT NOT NULL
        REFERENCES public.artisans(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL
        CHECK (language_code IN ('kn','hi','ta','te','ml')),
    name TEXT NOT NULL DEFAULT '',
    craft TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT '',
    experience TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    badges TEXT[] NOT NULL DEFAULT '{}',
    source_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (artisan_id, language_code)
);

ALTER TABLE public.artisan_translations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.artisan_translations TO anon, authenticated;

DROP POLICY IF EXISTS public_read_artisan_translations
ON public.artisan_translations;

CREATE POLICY public_read_artisan_translations
ON public.artisan_translations
FOR SELECT
TO anon, authenticated
USING (true);
