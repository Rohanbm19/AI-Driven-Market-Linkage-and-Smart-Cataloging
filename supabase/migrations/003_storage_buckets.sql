-- 003_storage_buckets.sql
-- Setup Supabase Storage bucket for product images

-- Create the bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public craft images are viewable by all" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload craft images" ON storage.objects;

-- Allow public viewing of images in product-images bucket
CREATE POLICY "Public craft images are viewable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow uploading images into product-images bucket
CREATE POLICY "Anyone can upload craft images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');
