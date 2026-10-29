-- Enable Row Level Security
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public viewing and inserting of products
CREATE POLICY "Public products view" ON products FOR SELECT USING (true);
CREATE POLICY "Public products insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public products update" ON products FOR UPDATE USING (true);

-- Allow public viewing and inserting of artisans
CREATE POLICY "Public artisans view" ON artisans FOR SELECT USING (true);
CREATE POLICY "Public artisans insert" ON artisans FOR INSERT WITH CHECK (true);

-- Allow public viewing and inserting of enquiries
CREATE POLICY "Public enquiries view" ON enquiries FOR SELECT USING (true);
CREATE POLICY "Public enquiries insert" ON enquiries FOR INSERT WITH CHECK (true);
