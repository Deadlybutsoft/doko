import React, { useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from './Icon';
import { Button, SafeImage } from './ui';

export const WishlistDrawer: React.FC = () => {
    const {
        isWishlistOpen,
        setIsWishlistOpen,
        wishlist,
        savedRecipes,
        allProducts,
        toggleWishlist,
        toggleSaveRecipe,
        navigate
    } = useStore();

    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isWishlistOpen) {
                setIsWishlistOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isWishlistOpen, setIsWishlistOpen]);

    useEffect(() => {
        if (isWishlistOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isWishlistOpen]);

    if (!isWishlistOpen) return null;

    const savedProducts = allProducts.filter(p => wishlist.includes(p.id));

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-md transition-opacity">
            <div
                ref={drawerRef}
                className="w-full max-w-md bg-premium-bg h-full shadow-3xl flex flex-col transform transition-transform animate-slide-in-right border-l border-white/10"
            >
                <div className="p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Icons.Heart className="w-5 h-5 text-white fill-white" />
                        <h2 className="text-xl font-display font-bold text-white tracking-tight">Your DOKO Collection</h2>
                    </div>
                    <button
                        onClick={() => setIsWishlistOpen(false)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {savedProducts.length === 0 && savedRecipes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Icons.Heart className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-white font-display text-lg mb-2">Your collection is empty</p>
                            <p className="text-white/30 text-sm max-w-[200px] mx-auto">Start saving your favorite ingredients and recipes.</p>
                            <button
                                onClick={() => setIsWishlistOpen(false)}
                                className="mt-8 px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                            >
                                Start Exploring
                            </button>
                        </div>
                    ) : (
                        <>
                            {savedProducts.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 py-4 border-b border-white/5 sticky top-0 bg-premium-bg z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C6A355]" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Pantry Items</h3>
                                        <span className="ml-auto text-[10px] font-bold text-white/20">{savedProducts.length}</span>
                                    </div>
                                    <div className="grid gap-4">
                                        {savedProducts.map(product => (
                                            <div key={product.id} className="group flex gap-5 bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:border-[#C6A355]/30 transition-all hover:bg-white/[0.05]">
                                                <div
                                                    className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden cursor-pointer"
                                                    onClick={() => {
                                                        navigate(`/product/${product.id}`);
                                                        setIsWishlistOpen(false);
                                                    }}
                                                >
                                                    <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 flex flex-col py-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-sm font-bold text-white group-hover:text-[#C6A355] transition-colors cursor-pointer" onClick={() => {
                                                            navigate(`/product/${product.id}`);
                                                            setIsWishlistOpen(false);
                                                        }}>{product.name}</h4>
                                                        <button onClick={() => toggleWishlist(product.id)} className="text-white/20 hover:text-white transition-colors">
                                                            <Icons.Close className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs font-medium text-white/40 mt-1">${product.price.toFixed(2)}</p>
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/product/${product.id}`);
                                                            setIsWishlistOpen(false);
                                                        }}
                                                        className="mt-auto text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all text-left"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {savedRecipes.length > 0 && (
                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-4 py-4 border-b border-white/5 sticky top-0 bg-premium-bg z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Saved Recipes</h3>
                                        <span className="ml-auto text-[10px] font-bold text-white/20">{savedRecipes.length}</span>
                                    </div>
                                    <div className="grid gap-4">
                                        {savedRecipes.map(recipe => (
                                            <div
                                                key={recipe.objectID}
                                                onClick={() => {
                                                    navigate(`/recipe/${recipe.objectID}`);
                                                    setIsWishlistOpen(false);
                                                }}
                                                className="group relative flex flex-col bg-white/[0.03] p-6 rounded-[1.5rem] border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.05] cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="text-lg font-display font-bold text-white group-hover:text-[#C6A355] transition-colors leading-tight max-w-[85%]">
                                                        {recipe.title}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSaveRecipe(recipe);
                                                        }}
                                                        className="text-white/20 hover:text-white transition-colors -mt-1 -mr-1 p-2"
                                                    >
                                                        <Icons.Close className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Icons.Sliders className="w-3 h-3 text-white/30" />
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{recipe.ingredients.length} Ingredients</span>
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#C6A355]">
                                                        Saved
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    <Button fullWidth onClick={() => setIsWishlistOpen(false)} variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest">
                        Continue Browsing
                    </Button>
                </div>
            </div>
        </div>
    );
};
