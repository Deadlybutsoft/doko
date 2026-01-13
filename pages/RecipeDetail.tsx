import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from '../components/Icon';
import { Recipe } from '../types';
import { Badge } from '../components/ui';

export const RecipeDetail: React.FC<{ recipeId: string }> = ({ recipeId }) => {
    const { savedRecipes, allProducts, cart, navigate, toggleSaveRecipe, isRecipeSaved } = useStore();
    const [recipe, setRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        // Try to find in saved recipes first
        const saved = savedRecipes.find(r => r.objectID === recipeId);
        if (saved) {
            setRecipe(saved);
        } else {
            // Fallback: If passed via navigation state (not implemented here) or just show not found for now
            // Enhancment: Fetch from Algolia if we had the ID and index. 
            // For now, if it's not saved, we might not find it unless we persist all loaded recipes globally.
            // Assuming user enters from Saved Items drawer predominantly.
        }
    }, [recipeId, savedRecipes]);

    // Utility to clean ingredient names
    const cleanIngredientName = (name: string) => {
        return name
            .toLowerCase()
            .replace(/^\//, '')
            .replace(/\d+(\.\d+)?\s*(oz|lb|g|kg|cup|tsp|tbsp|dash|pinch|slice|piece|clove)?s?\.?\s+/, '')
            .replace(/\(.*\)/, '')
            .trim();
    };

    const getIngredientsList = (r: Recipe) => {
        if (!r || !r.ingredients) return [];
        return r.ingredients.map(ing => {
            const displayIng = ing.replace(/^\//, '').trim();
            const cleanedIng = cleanIngredientName(displayIng);

            // Match against catalog
            const productMatch = allProducts.find(p => {
                const cleanedProduct = cleanIngredientName(p.name);
                return cleanedProduct.includes(cleanedIng) || cleanedIng.includes(cleanedProduct);
            });

            // Check if in cart or we have a product match that implies we can buy it
            // Note: Logic slightly different from ProductDetail as we don't have a "current product" that we definitely have.
            // So availability = present in cart? Or just "In Shop"?
            // Let's rely on "In Shop" vs "Not in Shop". 
            // If in cart, we can show "In Bag".

            const inCart = cart.some(item => cleanIngredientName(item.name).includes(cleanedIng));

            return {
                name: displayIng,
                productMatch,
                inCart
            };
        });
    };

    if (!recipe) {
        return (
            <div className="min-h-screen bg-premium-bg flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-white mb-4">Recipe Not Found</h2>
                    <button onClick={() => navigate('/')} className="text-sm font-bold text-brand-secondary underline">Return Home</button>
                </div>
            </div>
        );
    }

    const ingredients = getIngredientsList(recipe);
    const isSaved = isRecipeSaved(recipe.objectID);

    return (
        <div className="animate-fade-in bg-premium-bg min-h-screen pb-20">
            <div className="container mx-auto px-4 md:px-6 py-8">
                {/* Navigation */}
                <div className="flex justify-between items-center mb-12">
                    <button
                        onClick={() => window.history.back()}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                        <Icons.Back className="w-4 h-4 text-brand-secondary transition-transform group-hover:-translate-x-1" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Back</span>
                    </button>

                    <button
                        onClick={() => toggleSaveRecipe(recipe)}
                        className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${isSaved ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
                    >
                        <Icons.Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isSaved ? 'Saved' : 'Save Recipe'}</span>
                    </button>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-16">
                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Badge variant="outline" className="text-white/40 border-white/10">Recipe</Badge>
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C6A355]">{ingredients.length} Ingredients</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] mb-8">
                            {recipe.title}
                        </h1>
                        <p className="text-xl text-brand-secondary/60 font-light leading-relaxed max-w-3xl">
                            A curated culinary experience. Follow the instructions below to prepare this dish using premium ingredients.
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                    {/* Ingredients Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <h3 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-4">Ingredients</h3>
                        <ul className="space-y-4">
                            {ingredients.map((ing, idx) => (
                                <li key={idx} className="flex items-start justify-between group">
                                    <div className="flex items-start gap-4 pt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${ing.inCart ? 'bg-green-400' : 'bg-white/20 group-hover:bg-white'}`} />
                                        <span className={`text-sm font-medium leading-relaxed ${ing.inCart ? 'text-green-400/80 line-through' : 'text-brand-secondary'}`}>
                                            {ing.name}
                                        </span>
                                    </div>

                                    {ing.productMatch ? (
                                        ing.inCart ? (
                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded">In Bag</span>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/product/${ing.productMatch?.id}`)}
                                                className="shrink-0 text-[9px] font-black uppercase tracking-widest text-black bg-white px-3 py-1.5 rounded hover:scale-105 transition-transform"
                                            >
                                                Shop
                                            </button>
                                        )
                                    ) : (
                                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-white/20">N/A</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Instructions Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <h3 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-4">Instructions</h3>
                        <div className="prose prose-invert prose-lg max-w-none">
                            {recipe.instructions ? (
                                <div className="space-y-6 text-brand-secondary/80 font-light text-lg leading-loose whitespace-pre-line">
                                    {recipe.instructions}
                                </div>
                            ) : (
                                <p className="text-white/40 italic">No instructions available for this recipe.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
