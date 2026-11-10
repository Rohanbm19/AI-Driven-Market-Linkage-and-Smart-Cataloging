export function generateSmartCatalog({ craftType, region, materials, description, language }) {
  const craft = craftType || 'Artisanal Handcraft';
  const place = region ? region.split(',')[0].trim() : 'India';
  const mat = materials || 'Traditional Raw Materials';

  let title = `${place} Handcrafted ${craft}`;
  const lowerCraft = craft.toLowerCase();

  if (lowerCraft.includes('terracotta') || lowerCraft.includes('clay')) {
    title = `${place} Sacred Hand-Fired Terracotta Sculpture`;
  } else if (lowerCraft.includes('silk') || lowerCraft.includes('textile') || lowerCraft.includes('saree')) {
    title = `${place} Handwoven Pure Mulberry Silk Zari Creation`;
  } else if (lowerCraft.includes('brass') || lowerCraft.includes('metal')) {
    title = `${place} Hand-Chiseled Antique Virgin Brass Vessel`;
  } else if (lowerCraft.includes('wood')) {
    title = `${place} Organic Lacquer Turned Wood Masterpiece`;
  } else if (lowerCraft.includes('pottery') || lowerCraft.includes('ceramic')) {
    title = `${place} Glazed Quartz Blue Pottery Decorative Vessel`;
  }

  const generatedDescription = description && description.trim()
    ? `${description.trim()} Masterfully shaped in ${place} using authentic ${mat}. Created with ancestral methods passed down through generations, embodying rich cultural heritage.`
    : `Masterfully handcrafted in ${place} using authentic ${mat}. Each unique piece preserves time-honored artisanal traditions with precision sculpting, durable craftsmanship, and sustainable materials.`;

  return {
    title,
    description: generatedDescription,
    suggestedPrice: 2450,
    priceRange: { min: 2100, max: 2950 },
    tags: ['Authentic Handmade', 'Eco-friendly', 'GI Certified', 'Fair Trade Direct', 'Artisan Made'],
    seoKeywords: `${craft.toLowerCase()}, handmade indian craft, ${place.toLowerCase()} heritage, fair trade direct`,
    story: 'Every curve, weave, and chisel stroke on this creation is shaped with deep reverence for generations of Indian artistic tradition.'
  };
}
