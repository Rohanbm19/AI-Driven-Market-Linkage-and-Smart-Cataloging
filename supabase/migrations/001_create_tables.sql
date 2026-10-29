-- 1. Artisans Table
CREATE TABLE artisans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    craft VARCHAR(100),
    region VARCHAR(100),
    experience VARCHAR(50),
    bio TEXT,
    avatar TEXT,
    is_verified BOOLEAN DEFAULT true,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    total_sales INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table (Artisan Craft Listings)
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    artisan_name VARCHAR(100),
    artisan_id TEXT,
    region VARCHAR(100),
    description TEXT,
    materials TEXT[] DEFAULT '{}',
    image_url TEXT,
    enhanced_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    stock INT DEFAULT 1,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT true,
    fair_trade BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enquiries Table (Buyer Contact Messages)
CREATE TABLE enquiries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
