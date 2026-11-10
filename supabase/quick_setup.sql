DROP TABLE IF EXISTS public.enquiries;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.artisans CASCADE;

CREATE TABLE public.artisans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    craft TEXT NOT NULL,
    region TEXT NOT NULL,
    experience TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    total_sales INTEGER NOT NULL DEFAULT 0,
    badges TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    artisan_name TEXT NOT NULL,
    artisan_id TEXT REFERENCES public.artisans(id) ON DELETE SET NULL,
    region TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    materials TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT NOT NULL DEFAULT '',
    original_image_url TEXT,
    enhanced_image_url TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    fair_trade BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.enquiries (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    quantity TEXT NOT NULL DEFAULT 'Single piece / Inquiry',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);