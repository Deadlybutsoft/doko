import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from '../components/Icon';
import { Button, Badge, SafeImage } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { algoliasearch } from 'algoliasearch';

const client = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || '',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || ''
);

interface Recipe {
  objectID: string;
  title: string;
  ingredients: string[];
  ingredients_text: string;
  instructions: string;
  image: string;
}

export const ProductDetail: React.FC<{ productId: string }> = ({ productId }) => {
  const {
    getProduct,
    allProducts,
    addToCart,
    navigate,
    toggleWishlist,
    isInWishlist,
    cart,
    toggleSaveRecipe,
    isRecipeSaved
  } = useStore();
  const [qty, setQty] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(3);

  const product = getProduct(productId);

  useEffect(() => {
    if (product) {
      setVisibleRecipeCount(3);
      const fetchRecipes = async () => {
        setLoadingRecipes(true);

        const baseName = product.name
          .toLowerCase()
          .replace(/other|fresh|organic|raw|whole|sliced|chopped|diced|fillet|breast|thigh|wing|rinse|garnish|dash|splash|pinch|style|flavored|extract|essence|powder|dried|ground/g, '')
          .trim();

        const query = baseName.length > 2 ? baseName : product.name;
        console.log("🔍 [1] Searching for:", query);

        try {
          let res: any = await client.search({
            requests: [{ indexName: 'food', query: query, hitsPerPage: 50 }]
          });

          let hits = res.results[0].hits;

          if (hits.length === 0 && query.includes(' ')) {
            const words = query.split(' ');
            const lastWord = words[words.length - 1];
            if (lastWord.length > 2) {
              res = await client.search({
                requests: [{ indexName: 'food', query: lastWord, hitsPerPage: 50 }]
              });
              hits = res.results[0].hits;
            }
          }

          // Custom Sorting: Title Matches -> Ingredient Matches
          const sortedHits = hits.sort((a: Recipe, b: Recipe) => {
            const cleanProd = cleanIngredientName(product.name);

            const aTitleMatch = cleanIngredientName(a.title).includes(cleanProd);
            const bTitleMatch = cleanIngredientName(b.title).includes(cleanProd);

            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;

            // Count ingredient matches
            const aIngMatchCount = a.ingredients.filter(i => cleanIngredientName(i).includes(cleanProd)).length;
            const bIngMatchCount = b.ingredients.filter(i => cleanIngredientName(i).includes(cleanProd)).length;

            return bIngMatchCount - aIngMatchCount;
          });

          console.log(`✅ Final Sorted Results: ${sortedHits.length} recipes found`);
          setRecipes(sortedHits);
        } catch (e) {
          console.error("❌ Algolia Search Error:", e);
        } finally {
          setLoadingRecipes(false);
        }
      };

      fetchRecipes();
    }
  }, [product]);

  if (!product) return <div className="p-20 text-center">Product not found</div>;

  const isWishlisted = isInWishlist(product.id);
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Utility to clean ingredient names for better matching
  const cleanIngredientName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/^\//, '') // Remove leading slash
      .replace(/\d+(\.\d+)?\s*(oz|lb|g|kg|cup|tsp|tbsp|dash|pinch|slice|piece|clove)?s?\.?\s+/, '') // Remove measurements
      .replace(/\(.*\)/, '') // Remove text in parentheses
      .trim();
  };

  const getIngredientsList = (recipe: Recipe) => {
    return recipe.ingredients.map(ing => {
      // Clean formatting for display
      const displayIng = ing.replace(/^\//, '').trim();
      const cleanedIng = cleanIngredientName(displayIng);
      const cleanedProduct = cleanIngredientName(product.name);

      // Check if ingredient matches current product OR any item in cart
      const matchesProduct = cleanedIng.includes(cleanedProduct) || cleanedProduct.includes(cleanedIng);
      const matchesCart = cart.some(cartItem => {
        const cleanedCartItem = cleanIngredientName(cartItem.name);
        return cleanedIng.includes(cleanedCartItem) || cleanedCartItem.includes(cleanedIng);
      });

      const isAvailable = matchesProduct || matchesCart;

      return {
        name: displayIng,
        isAvailable,
        productMatch: isIngredientInCatalog(displayIng)
      };
    });
  };

  const isIngredientInCatalog = (ingName: string) => {
    const cleanedIng = cleanIngredientName(ingName);
    // Try fairly loose matching to find *something* relevant
    return allProducts.find(p => {
      const cleanedProduct = cleanIngredientName(p.name);
      return cleanedProduct.includes(cleanedIng) || cleanedIng.includes(cleanedProduct);
    });
  };

  return (
    <div className="animate-fade-in bg-premium-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-12"
        >
          <Icons.Back className="w-4 h-4 text-brand-secondary transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Collection</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-32 items-start">
          {/* Product Image Gallery */}
          <div className="relative group">
            <div className="aspect-square bg-white/[0.03] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl shadow-black/50 backdrop-blur-3xl">
              <SafeImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            {/* Absolute Badges if needed */}
            <div className="absolute top-8 left-8">
              <Badge variant="black" className="px-4 py-2 text-[10px] tracking-[0.2em]">{product.category}</Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col pt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Icons.Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-white text-white' : 'fill-white/10 text-white/10'}`}
                  />
                ))}
                <span className="text-[11px] font-black tracking-widest text-white/40 ml-2">
                  {product.rating} / {product.reviews} REVIEWS
                </span>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isWishlisted ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <Icons.Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="text-5xl md:text-6xl xl:text-7xl font-display font-medium leading-[1.1] tracking-tight text-white mb-6">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-4xl font-display font-bold text-white">
                ${(product.price * qty).toFixed(2)}
              </span>
              <span className="text-white/20 text-sm font-medium line-through">
                ${(product.price * 1.2 * qty).toFixed(2)}
              </span>
            </div>

            <p className="text-brand-secondary/70 leading-relaxed text-lg font-light mb-12 max-w-xl">
              {product.description || "A premium, high-quality ingredient sourced specifically for your kitchen and refined culinary needs."}
            </p>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-12">
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2 h-16 min-w-[160px]">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Icons.Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1 h-16 rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-black/40 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => addToCart(product, qty)}
              >
                Add to Bag
              </Button>
            </div>

            {/* Product Meta Info */}
            <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
              <div>
                <span className="block text-[10px] font-black text-white/30 tracking-[0.2em] mb-2 uppercase">Category</span>
                <span className="text-sm font-medium text-white">{product.category}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-white/30 tracking-[0.2em] mb-2 uppercase">Estimated Delivery</span>
                <span className="text-sm font-medium text-white">24 - 48 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Intelligence Section - Full Width */}
        <div className="mt-20 pt-16 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-white rounded-full" />
                <h3 className="text-4xl font-display font-medium tracking-tight">Recipe Intelligence</h3>
              </div>
              <p className="text-brand-secondary/40 font-light text-xl max-w-2xl">
                Curation of professional culinary applications for <span className="text-white font-medium underline underline-offset-8 decoration-white/20">"{product.name}"</span>
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 shrink-0">
              <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Algolia</span>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Ready</span>
            </div>
          </div>

          {loadingRecipes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-white/[0.02] rounded-[2rem] animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.slice(0, visibleRecipeCount).map(recipe => (
                  <div
                    key={recipe.objectID}
                    onClick={() => setSelectedId(selectedId === recipe.objectID ? null : recipe.objectID)}
                    className={`group relative p-8 rounded-[2rem] transition-all duration-500 cursor-pointer border ${selectedId === recipe.objectID ? 'bg-white/10 border-white/40 shadow-4xl scale-[1.02] z-10 mx-[-4px]' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <h4 className="font-display font-bold text-2xl leading-[1.2] pr-4 text-white group-hover:text-[#C6A355] transition-colors">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center gap-3 shrink-0">
                        {recipe.ingredients.some(i => cleanIngredientName(i).includes(cleanIngredientName(product.name))) && (
                          <div className="px-3 py-1 bg-[#C6A355]/20 border border-[#C6A355]/30 rounded-full">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#C6A355]">Uses {cleanIngredientName(product.name)}</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveRecipe(recipe);
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecipeSaved(recipe.objectID) ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                        >
                          <Icons.Heart className={`w-5 h-5 ${isRecipeSaved(recipe.objectID) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <p className="text-brand-secondary/60 line-clamp-2 text-sm leading-relaxed mb-8 h-10">
                      {recipe.ingredients_text || `A professional application featuring ${cleanIngredientName(product.name)} and other premium elements.`}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C6A355]" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{recipe.ingredients.length} Ingredients</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                        Expand Recipe →
                      </div>
                    </div>
                    {selectedId === recipe.objectID ? (
                      <div className="space-y-8 animate-fade-in">
                        <div className="h-px w-full bg-white/10" />
                        <ul className="space-y-4">
                          {getIngredientsList(recipe).map((ing, idx) => (
                            <li key={idx} className="flex items-center justify-between group/item">
                              <div className="flex items-center gap-4">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ing.isAvailable ? 'bg-white/20' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]'}`} />
                                <span className={`text-sm font-medium transition-all ${ing.isAvailable ? 'text-white/30 line-through' : 'text-white'}`}>
                                  {ing.name}
                                </span>
                              </div>

                              {ing.isAvailable ? (
                                <div className="text-[10px] font-black tracking-widest text-green-400 bg-green-400/10 px-3 py-1 rounded uppercase">Got It</div>
                              ) : ing.productMatch ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/product/${ing.productMatch?.id}`);
                                  }}
                                  className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                                >
                                  Add
                                </button>
                              ) : (
                                <span className="text-[11px] font-black text-white bg-white/10 px-3 py-1 rounded uppercase tracking-[0.1em] shadow-[0_0_15px_rgba(255,255,255,0.05)]">Not in Shop</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-auto pt-4 flex flex-col gap-6">
                        <div className="flex flex-wrap gap-2">
                          {getIngredientsList(recipe).slice(0, 3).map((ing, i) => (
                            <span key={i} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border ${ing.isAvailable ? 'bg-white/5 border-white/5 text-white/20' : 'bg-white/10 border-white/10 text-white/60'}`}>
                              {ing.name.split(' ').slice(0, 1).join(' ')}
                            </span>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <span className="text-[10px] font-black px-2 py-1.5 text-white/20">+{recipe.ingredients.length - 3}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-t border-white/5 pt-4">
                          <Icons.Sliders className="w-3.5 h-3.5" />
                          {recipe.ingredients.length} Ingredients
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {recipes.length > visibleRecipeCount && (
                <div className="flex justify-center mt-20">
                  <button
                    onClick={() => setVisibleRecipeCount(prev => prev + 6)}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-white blur-2xl opacity-5 group-hover:opacity-10 transition-opacity" />
                    <div className="relative px-12 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-full transform transition-all group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95">
                      Show More Recipes
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-white/5">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-white rounded-full" />
                <h3 className="text-4xl font-display font-medium tracking-tight">Related Items</h3>
              </div>
              <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all"
              >
                View Collection
                <Icons.Back className="w-4 h-4 rotate-180 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};