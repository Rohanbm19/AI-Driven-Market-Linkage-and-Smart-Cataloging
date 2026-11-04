CREATE TABLE artisans (
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