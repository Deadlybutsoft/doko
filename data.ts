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

  if (combined.includes('pantry') || combined.includes('spice') || combined.includes('meat') || combined.includes('oil') || combined.includes('sauce') || combined.includes('canned') || combined.includes('grain') || combined.includes('bread') || combined.includes('pasta') || combined.includes('rice')) {
    return Category.PANTRY;
  }

  return Category.OTHER; // Default for miscellaneous items

};

// Priority list for "Better" options
const POPULAR_ITEMS = [
  'Tomato', 'Potato', 'Onion', 'Garlic', 'Carrot', 'Spinach', 'Broccoli', 'Cucumber', 'Pumpkin', // Veg
  'Apple', 'Banana', 'Orange', 'Strawberry', 'Grape', 'Lemon', 'Lime', 'Mango', // Fruits
  'Milk', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Egg', // Dairy
  'Rice', 'Pasta', 'Bread', 'Flour', 'Oil', 'Salt', 'Sugar', 'Honey', 'Coffee', 'Tea', 'Water', // Pantry
  'Chocolate', 'Chip', 'Cookie', 'Nut', 'Popcorn', 'Cracker' // Snacks
];

// Sort ingredients to prioritize popular ones
const sortedIngredients = rawIngredients.sort((a: any, b: any) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  // Check if matches any popular item
  const aPopular = POPULAR_ITEMS.find(k => aName.includes(k.toLowerCase()));
  const bPopular = POPULAR_ITEMS.find(k => bName.includes(k.toLowerCase()));

  // If both popular, prioritize shorter names (likely closer to "Whole" item)
  if (aPopular && bPopular) {
    if (aName.length !== bName.length) return aName.length - bName.length;
    return 0;
  }

  // If one is popular, prioritize it
  if (aPopular) return -1;
  if (bPopular) return 1;

  return 0;
});

// Use sorted list but reshuffle slightly to avoid all "Apples" being together
export const products: Product[] = sortedIngredients.slice(0, 2000).map((ing: any) => ({
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

