# 🍽️ DOKO — Intelligent Grocery Discovery

<div align="center">

![DOKO Banner](https://img.shields.io/badge/DOKO-Intelligent%20Grocery%20Discovery-C6A355?style=for-the-badge&labelColor=0D0D0D)

**Where premium ingredients meet recipe intelligence.**

[![Built with Algolia](https://img.shields.io/badge/Powered%20by-Algolia-5468FF?style=flat-square&logo=algolia&logoColor=white)](https://www.algolia.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

[Live Demo](#) · [View on GitHub](https://github.com/Deadlybutsoft/doko)

</div>

---

## 🎯 The Problem

Traditional grocery apps show you products—but they don't help you **cook**. Users are left browsing aimlessly, unsure what to make with their ingredients, and often forget key items for recipes they want to try.

## 💡 The Solution: DOKO

**DOKO** bridges the gap between grocery shopping and cooking by using **Algolia's powerful search and discovery** to create an intelligent, recipe-aware shopping experience.

When you view an ingredient, DOKO instantly suggests recipes that use it. When you search, you find both products *and* culinary inspiration. It's not just a grocery store—it's a **culinary discovery platform**.

---

## ✨ Key Features

### 🔍 Algolia-Powered Search
- **Instant, typo-tolerant search** across 23,000+ ingredients
- Real-time search-as-you-type with sub-50ms response times
- Smart query understanding that finds what you mean, not just what you type

### 🍳 Recipe Intelligence Engine
- Powered by Algolia's `food` index containing thousands of professional recipes
- **Ingredient-based matching**: View "Lemon" → See recipes that actually contain lemon
- Visual badge system: "Uses [Ingredient]" confirms why each recipe is relevant
- One-click recipe saving to your personal collection

### 🛒 Smart Ingredient Matching
- View any recipe and instantly see which ingredients you already have in your cart
- "Got It" / "Add" / "Not in Shop" status for each ingredient
- Direct navigation from recipe ingredients to product pages

### 📦 Your DOKO Collection
- Save recipes and pantry items for quick access
- Persistent wishlist with intelligent grouping
- Quick "Shop" buttons to purchase missing ingredients

---

## 🛠️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DOKO Frontend                        │
│                   React + TypeScript + Vite                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Algolia Search API                       │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Ingredients    │    │         Recipes (food)          │ │
│  │     Index       │    │  - title, ingredients[], steps  │ │
│  │  23,000+ items  │    │  - Professional culinary data   │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Algolia Integration Points

| Feature | Algolia Usage |
|---------|---------------|
| **Product Search** | Full-text search with typo tolerance |
| **Recipe Discovery** | Query `food` index based on ingredient names |
| **Ingredient Matching** | Cross-reference recipe ingredients with catalog |
| **Smart Sorting** | Custom ranking: title matches → ingredient matches |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Deadlybutsoft/doko.git
cd doko

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Algolia credentials to .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ALGOLIA_APP_ID=your_algolia_app_id
VITE_ALGOLIA_SEARCH_KEY=your_algolia_search_api_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

---

## 📁 Project Structure

```
doko/
├── components/
│   ├── Header.tsx          # Search bar with Algolia branding
│   ├── ProductCard.tsx     # Product display with quick-add
│   ├── CartDrawer.tsx      # Shopping cart sidebar
│   └── WishlistDrawer.tsx  # Saved items collection
├── pages/
│   ├── Home.tsx            # Main catalog + recipe suggestions
│   ├── ProductDetail.tsx   # Product view + Recipe Intelligence
│   └── RecipeDetail.tsx    # Full recipe with ingredient shopping
├── context/
│   └── StoreContext.tsx    # Global state management
├── types.ts                # TypeScript interfaces
├── data.ts                 # Product catalog generation
└── ingredients_final.json  # 23,000+ ingredient database
```

---

## 🎨 Design Philosophy

DOKO uses a **premium dark aesthetic** inspired by luxury e-commerce:

- **Color Palette**: Deep blacks (`#0D0D0D`), warm gold accents (`#C6A355`)
- **Typography**: Display fonts for headings, clean sans-serif for body
- **Micro-interactions**: Smooth hover states, subtle animations
- **Glassmorphism**: Frosted glass effects on overlays and cards

---

## 🏆 Hackathon Highlights

### Why Algolia?

1. **Speed**: Sub-50ms search responses create a fluid, premium feel
2. **Relevance**: Typo-tolerance and synonyms ensure users always find what they need
3. **Flexibility**: Single API powers both product search AND recipe discovery
4. **Scalability**: 23,000 ingredients + thousands of recipes with no performance hit

### Innovation Points

- **Cross-index intelligence**: Products and recipes work together, not separately
- **Contextual discovery**: Recipe suggestions adapt to what you're currently viewing
- **Zero-friction shopping**: See a recipe, buy the ingredients—all in one flow

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| Total Ingredients | 23,000+ |
| Recipe Index | Algolia `food` |
| Search Latency | < 50ms |
| Categories | Vegetables, Fruits, Pantry, Dairy, Snacks, Other |

---

## 🔮 Future Roadmap

- [ ] **Meal Planning**: Weekly meal calendar with auto-generated shopping lists
- [ ] **Dietary Filters**: Vegan, Keto, Gluten-Free recipe filtering
- [ ] **Voice Search**: "Hey DOKO, what can I make with chicken and lemon?"
- [ ] **AI Recommendations**: Personalized recipe suggestions based on purchase history

---

## 👥 Team

Built with ❤️ for the Algolia Hackathon.

---

## 📄 License

MIT License - feel free to use this project as inspiration!

---

<div align="center">

**[⬆ Back to Top](#-doko--intelligent-grocery-discovery)**

</div>
