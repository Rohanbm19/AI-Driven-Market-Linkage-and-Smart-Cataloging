
import { translateProduct } from './src/services/translationService.js';

const sampleProduct = {
  id: 'test-1',
  title: 'Handcrafted Terracotta Horse',
  description: 'A beautiful handmade clay horse.',
  artisan_name: 'Shankar Das',
  region: 'West Bengal',
  materials: ['Natural Clay'],
  tags: ['Handmade', 'Traditional']
};

try {
  const translated = await translateProduct(sampleProduct, 'kn');

  console.log('Original:', sampleProduct);
  console.log('Kannada:', translated);
} catch (error) {
  console.error('Translation test failed:', error.message);
}
