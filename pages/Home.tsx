import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Icons } from '../components/Icon';
import { Category, DietaryTag, SortOption } from '../types';
import { algoliasearch } from 'algoliasearch';

const client = algoliasearch('ZILYM2P9WA', 'e772dfcd775fb33c4e017f14b7c245ed');

export const Home: React.FC = () => {
  const { allProducts, searchQuery, setSearchQuery, navigate } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState<number>(20);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Search recipes when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const fetchRecipes = async () => {
        setLoadingRecipes(true);
        try {
          const res: any = await client.search({
            requests: [{ indexName: 'food', query: searchQuery, hitsPerPage: 6 }]
          });
          setRecipes(res.results[0].hits);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingRecipes(false);
        }
      };
      const timer = setTimeout(fetchRecipes, 300);
      return () => clearTimeout(timer);
    } else {
      setRecipes([]);
    }
  }, [searchQuery]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (selectedDietary.length > 0) {
      result = result.filter(p =>
        selectedDietary.every(tag => p.dietary.includes(tag as DietaryTag))
      );
    }
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()); break;
      default: break;
    }
    return result;
  }, [allProducts, selectedCategory, selectedDietary, sortBy, searchQuery]);

  const toggleDietary = (tag: string) => {
    setSelectedDietary(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setVisibleCount(20);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(20);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(20);
  };

  const categories = ['All', ...Object.values(Category)];
  const dietaryOptions = Object.values(DietaryTag);

  return (
    <div className="min-h-screen flex flex-col bg-[#062016]">
      <header className="sticky top-0 z-50 w-full bg-[#062016]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 py-3 overflow-x-auto no-scrollbar">
            {/* Categories */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-white border-white text-black shadow-lg shadow-white/10' : 'bg-white/5 border-white/5 text-brand-secondary hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="hidden md:block w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

            {/* Dietary */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {dietaryOptions.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleDietary(tag)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedDietary.includes(tag) ? 'bg-brand-accent border-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-transparent border-white/10 text-brand-secondary/60 hover:border-white/30 hover:text-white'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div id="catalog" className="container mx-auto px-4 md:px-6 py-8 flex-1">
        {/* Content Area */}
        <div className="flex flex-col gap-12">
          {selectedCategory === 'All' && searchQuery === '' && selectedDietary.length === 0 ? (
            // Categorized View
            Object.values(Category).map(cat => {
              const categoryProducts = allProducts.filter(p => p.category === cat);
              if (categoryProducts.length === 0) return null;

              return (
                <section key={cat} className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-white rounded-full" />
                      <h2 className="text-2xl font-display font-medium text-white">{cat}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs font-bold uppercase tracking-widest text-brand-secondary hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      View All Items
                      <Icons.Back className="w-3.5 h-3.5 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                    {categoryProducts.slice(0, 5).map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            // Filtered View
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-xs font-bold text-brand-secondary uppercase tracking-widest pl-1">
                    {filteredAndSortedProducts.length} <span className="text-brand-secondary/40 ml-1">Result{filteredAndSortedProducts.length !== 1 && 's'}</span>
                  </p>
                  {searchQuery && (
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/5 scale-90">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Powered by Algolia</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                    <Icons.Sliders className="w-3.5 h-3.5 text-brand-secondary" />
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as SortOption); setVisibleCount(20); }}
                      className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer text-brand-secondary outline-none pr-1"
                    >
                      <option value="featured" className="bg-[#062016]">Featured</option>
                      <option value="newest" className="bg-[#062016]">Newest</option>
                      <option value="price-low" className="bg-[#062016]">Price: Low</option>
                      <option value="price-high" className="bg-[#062016]">Price: High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                {filteredAndSortedProducts.slice(0, visibleCount).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {filteredAndSortedProducts.length > visibleCount && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="group flex flex-col items-center gap-3"
                  >
                    <div className="px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] rounded-full hover:bg-brand-accent hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-black/20">
                      Load More Items
                    </div>
                    <div className="flex flex-col items-center animate-bounce">
                      <div className="w-px h-8 bg-gradient-to-b from-white to-transparent opacity-20" />
                      <Icons.Back className="w-3 h-3 rotate-[270deg] text-white/40" />
                    </div>
                  </button>
                </div>
              )}

              {filteredAndSortedProducts.length === 0 && !loadingRecipes && recipes.length === 0 && (
                <div className="py-32 text-center animate-fade-in border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Icons.Search className="w-6 h-6 text-brand-secondary/40" />
                  </div>
                  <p className="text-brand-secondary/40 text-sm font-light mb-6">No results match your current selection.</p>
                  <button
                    onClick={() => { setSelectedCategory('All'); setSelectedDietary([]); setSearchQuery(''); }}
                    className="text-xs font-bold uppercase tracking-widest border-b border-brand-secondary text-brand-secondary pb-1 hover:text-white hover:border-white transition-all"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              {/* Algolia Powered Recipe Suggestions */}
              {searchQuery && (recipes.length > 0 || loadingRecipes) && (
                <div className="mt-24 pt-16 border-t border-white/5 animate-fade-in">
                  <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#C6A355] rounded-full" />
                        <h3 className="text-2xl font-display font-medium text-white">Suggested Recipes</h3>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 pl-5">Intelligence powered by Algolia</p>
                    </div>
                  </div>

                  {loadingRecipes ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recipes.map(recipe => (
                        <div
                          key={recipe.objectID}
                          onClick={() => navigate(`/recipe/${recipe.objectID}`)}
                          className="group bg-white/[0.03] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.06] hover:border-[#C6A355]/30 transition-all cursor-pointer"
                        >
                          <h4 className="font-display font-medium text-lg mb-4 line-clamp-1 group-hover:text-[#C6A355] transition-colors">{recipe.title}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{recipe.ingredients.length} Ingredients</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#C6A355] opacity-0 group-hover:opacity-100 transition-all">View Recipe →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};