import { Product, Category, DietaryTag } from './types';
import rawIngredients from './ingredients_final.json';

// Helper to map JSON category strings to enum values
const mapCategory = (cat: string): Category => {
  const c = cat.toLowerCase();
  if (c.includes('produce') || c.includes('veg') || c.includes('fruit')) {
    return c.includes('fruit') ? Category.FRUITS : Category.VEGETABLES;
  }
  if (c.includes('dairy') || c.includes('cheese')) return Category.DAIRY;
  if (c.includes('snack') || c.includes('sweet') || c.includes('candy')) return Category.SNACKS;
  if (c.includes('bev') || c.includes('wine') || c.includes('beer') || c.includes('spirit')) return Category.BEVERAGES;
  return Category.PANTRY; // Default for Pantry, Meat, Spices, etc.
};

// Limit to top 2000 for performance while keeping it massive
export const products: Product[] = rawIngredients.slice(0, 2000).map((ing: any) => ({
  id: ing.objectID,
  name: ing.name,
  price: Math.floor(Math.random() * 15) + 1.99, // Random price for demo
  category: mapCategory(ing.category || 'Pantry'),
  image: `https://tse2.mm.bing.net/th?q=${encodeURIComponent(ing.name + ' ' + (ing.category || 'food'))}&w=800&h=800&c=7&rs=1&p=0`, // Dynamic search image
  rating: 4.0 + Math.random(),
  reviews: Math.floor(Math.random() * 200),
  isNew: Math.random() > 0.8,
  dietary: [DietaryTag.ORGANIC],
  description: ing.name + ' - Fresh and high quality ingredient sourced for your kitchen.',
  popularity: Math.floor(Math.random() * 100),
  dateAdded: new Date().toISOString()
}));

