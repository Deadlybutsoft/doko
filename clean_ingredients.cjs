const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('ingredients_final.json', 'utf8'));

const JUNK_KEYWORDS = [
    'paper', 'accompaniment', 'rinsed', 'washed', 'scrubbed', 'see note',
    'optional', 'approx', 'divided', 'plus', 'more', 'extra', 'julienned',
    'accordian', 'fold', 'equipment', 'pan', 'bowl', 'tool', 'utensil', 'garnish', 'sprigs'
];

const Category = {
    VEGETABLES: 'Vegetables',
    FRUITS: 'Fruits',
    PANTRY: 'Pantry',
    DAIRY: 'Dairy',
    SNACKS: 'Snacks'
};

const mapCategory = (name) => {
    const n = name.toLowerCase();

    // Fruit
    if (n.includes('fruit') || n.includes('berry') || n.includes('apple') || n.includes('banana') ||
        n.includes('grape') || n.includes('lemon') || n.includes('lime') || n.includes('orange') ||
        n.includes('melon') || n.includes('cherry') || n.includes('peach') || n.includes('plum') ||
        n.includes('strawberry') || n.includes('raspberry') || n.includes('mango') || n.includes('pear')) {
        return Category.FRUITS;
    }

    // Vegetables
    if (n.includes('vegetable') || n.includes('bean') || n.includes('lettuce') || n.includes('onion') ||
        n.includes('garlic') || n.includes('potato') || n.includes('carrot') || n.includes('pepper') ||
        n.includes('tomato') || n.includes('broccoli') || n.includes('cabbage') || n.includes('cucumber') ||
        n.includes('spinach') || n.includes('kale') || n.includes('mushroom') || n.includes('zucchini') ||
        n.includes('produce') || n.includes('greens')) {
        return Category.VEGETABLES;
    }

    // Dairy
    if (n.includes('dairy') || n.includes('cheese') || n.includes('milk') || n.includes('butter') ||
        n.includes('yogurt') || n.includes('cream') || n.includes('egg')) {
        return Category.DAIRY;
    }

    // Snacks
    if (n.includes('snack') || n.includes('sweet') || n.includes('candy') || n.includes('chocolate') ||
        n.includes('cookie') || n.includes('cracker') || n.includes('chip') || n.includes('popcorn') ||
        n.includes('nut') || n.includes('pretzel')) {
        return Category.SNACKS;
    }

    // Everything else (Meat, Grains, Spices, Oils, Canned) -> Pantry
    return Category.PANTRY;
};

const cleanName = (name) => {
    return name
        .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove unicode
        .replace(/[®™©]/g, '') // Remove symbols
        .replace(/\(.*\)/g, '') // Remove parenthesis
        .replace(/other|fresh|raw|whole|sliced|chopped|diced|fillet|breast|thigh|wing|rinse|garnish|dash|splash|pinch|style|flavored|extract|essence|powder|dried|ground|crushed|shredded|melted|frozen|prepared|canned|organic|natural|premium|large|small|medium/gi, '')
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) // Title case
        .join(' ');
};

const cleaned = [];
const seen = new Set();

rawData.forEach(item => {
    // 1. Skip Junk
    const nameLower = item.name.toLowerCase();
    if (JUNK_KEYWORDS.some(k => nameLower.includes(k))) return;
    if (nameLower.length < 3) return;

    // 2. Clean Name
    const name = cleanName(item.name);
    if (!name || name.length < 3) return;

    // 3. Deduplicate
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    // 4. Final Metadata
    cleaned.push({
        objectID: name.toLowerCase().replace(/\s+/g, '_'),
        name: name,
        category: mapCategory(name)
    });
});

// Sort by category then name
cleaned.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
});

fs.writeFileSync('ingredients_cleaned.json', JSON.stringify(cleaned, null, 2));
console.log(`Original count: ${rawData.length}`);
console.log(`Cleaned count: ${cleaned.length}`);
