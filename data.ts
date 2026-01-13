import { Product, Category, DietaryTag } from './types';
import rawIngredients from './ingredients_final.json';

// Helper to map JSON category strings to enum values
const mapCategory = (name: string, cat: string): Category => {
  const combined = (name + ' ' + cat).toLowerCase();

  if (combined.includes('fruit') || combined.includes('berry') || combined.includes('apple') || combined.includes('banana')) {
    return Category.FRUITS;
  }

  if (combined.includes('produce') || combined.includes('veg')) {
    return Category.VEGETABLES;
  }

  if (combined.includes('dairy') || combined.includes('cheese') || combined.includes('milk')) return Category.DAIRY;
  if (combined.includes('snack') || combined.includes('sweet') || combined.includes('candy') || combined.includes('chocolate')) return Category.SNACKS;

  return Category.PANTRY; // Default for Pantry, Meat, Spices, and former Beverages
};

// Limit to top 2000 for performance while keeping it massive
export const products: Product[] = rawIngredients.slice(0, 2000).map((ing: any) => ({
  id: ing.objectID,
  name: ing.name,
  price: Math.floor(Math.random() * 15) + 1.99, // Random price for demo
  category: mapCategory(ing.name, ing.category || 'Pantry'),
  image: `https://tse2.mm.bing.net/th?q=${encodeURIComponent(ing.name + ' ' + (ing.category || 'food'))}&w=800&h=800&c=7&rs=1&p=0`, // Dynamic search image
  rating: 4.0 + Math.random(),
  reviews: Math.floor(Math.random() * 200),
  isNew: Math.random() > 0.8,
  dietary: [DietaryTag.ORGANIC],
  description: ing.name + ' - Fresh and high quality ingredient sourced for your kitchen.',
  popularity: Math.floor(Math.random() * 100),
  dateAdded: new Date().toISOString()
}));

