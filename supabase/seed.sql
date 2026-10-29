-- seed.sql
-- Seed data for KalaSetu artisan marketplace

INSERT INTO public.artisans (id, name, craft, region, experience, bio, avatar, is_verified, rating, total_sales, badges)
VALUES (
    'art-1',
    'Shankar Das',
    'Terracotta & Alluvial Clay Sculpting',
    'Bishnupur, West Bengal',
    '28 years',
    'Third-generation terracotta master craftsman honored with State Handicrafts Merit Award. Dedicated to keeping Bishnupur temple terracotta motifs alive in modern functional art.',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    true,
    4.9,
    342,
    ARRAY['Master Craftsman', 'Fair Trade Certified', 'GI Custodian']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (
    id, title, category, price, artisan_name, artisan_id, region, description,
    materials, image_url, enhanced_image_url, tags, stock, rating, reviews_count, is_verified, fair_trade
)
VALUES
(
    'prod-1',
    'Bankura Terracotta Sacred Horse',
    'pottery',
    1850,
    'Shankar Das',
    'art-1',
    'Bishnupur, West Bengal',
    'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns. Fired in traditional clay kilns using age-old alluvial clay.',
    ARRAY['Natural Alluvial Clay', 'Mineral Oxide Slip'],
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=90',
    ARRAY['GI Tagged', 'Terracotta', 'Handmade'],
    12,
    4.9,
    28,
    true,
    true
),
(
    'prod-2',
    'Kanjivaram Pure Mulberry Silk Saree',
    'textiles',
    14200,
    'Meenakshi Sundaram',
    'art-2',
    'Kanchipuram, Tamil Nadu',
    'Woven with three-ply silk thread and pure gold-dipped silver zari. Features traditional temple gopuram border motif and rich pallu crafted on historic pit looms.',
    ARRAY['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90',
    ARRAY['Silk Mark', 'Handloom', 'Zari Work'],
    4,
    5.0,
    42,
    true,
    true
),
(
    'prod-3',
    'Moradabad Engraved Brass Urli Bowl',
    'metal',
    3200,
    'Mohammad Rais',
    'art-3',
    'Moradabad, Uttar Pradesh',
    'Solid sand-cast brass urli bowl with intricate floral hand-chiseling (Naqshi work). Ideal for floating flowers, candles, and heritage home decor.',
    ARRAY['Virgin Brass', 'Antique Patina Finish'],
    'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=90',
    ARRAY['Brass', 'Chiseled', 'Heritage'],
    9,
    4.8,
    19,
    true,
    true
),
(
    'prod-4',
    'Channapatna Lacquerware Wooden Nesting Dolls',
    'woodwork',
    1450,
    'Gowramma & Venkatesh',
    'art-4',
    'Channapatna, Karnataka',
    'Hand-turned Ivory Wood (Wrightia Tinctoria) toys coated with safe non-toxic organic vegetable dyes and lustrous natural shellac polish.',
    ARRAY['Aale Mara (Ivory Wood)', 'Natural Vegetable Dyes'],
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=90',
    ARRAY['GI Tagged', 'Eco-friendly', 'Child-safe'],
    25,
    4.9,
    67,
    true,
    true
),
(
    'prod-5',
    'Blue Pottery Jaipur Floral Ceramic Vase',
    'pottery',
    2100,
    'Ramkishan Kumhar',
    'art-5',
    'Jaipur, Rajasthan',
    'Unique quartz-based pottery fired once with Egyptian blue and cobalt oxide glazes. Delicately hand-painted with Persian floral vine motifs.',
    ARRAY['Quartz Powder', 'Glass Frit', 'Cobalt Glaze'],
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=90',
    ARRAY['GI Tagged', 'Blue Pottery', 'Lead Free'],
    15,
    4.7,
    31,
    true,
    true
),
(
    'prod-6',
    'Pochampally Ikat Handwoven Cotton Shawl',
    'textiles',
    2450,
    'Yadagiri Chary',
    'art-6',
    'Bhoodan Pochampally, Telangana',
    'Distinctive geometric tie-and-dye motifs achieved through precision warp and weft tieing. Breathable handspun cotton with natural indigo dye accents.',
    ARRAY['Organic Handspun Cotton', 'Azo-Free Dyes'],
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=90',
    ARRAY['Ikat', 'Handloom', 'Natural Dye'],
    8,
    4.85,
    14,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;
