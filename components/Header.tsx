import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from './Icon';

export const Header: React.FC = () => {
  const { cartCount, setIsCartOpen, navigate, searchQuery, setSearchQuery, currentRoute, wishlist, savedRecipes, setIsWishlistOpen } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query && currentRoute !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-premium-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#C6A355] rounded-lg flex items-center justify-center text-black">
              <Icons.Leaf className="w-4 h-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-brand-secondary uppercase">
              DOKO
            </span>
          </button>

        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group">
            <Icons.Search className="w-4 h-4 text-brand-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredients, recipes..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-32 text-xs font-medium text-brand-secondary placeholder:text-brand-secondary/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all focus:bg-white/[0.08]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <div className="w-px h-4 bg-white/10 mx-2" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.15em] whitespace-nowrap">Powered by Algolia</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white transition-all hover:bg-white/10 relative"
          >
            <Icons.Heart className={`w-4 h-4 ${(wishlist.length + savedRecipes.length) > 0 ? 'fill-white' : ''}`} />
            {(wishlist.length + savedRecipes.length) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">
                {wishlist.length + savedRecipes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full transition-all hover:opacity-90 shadow-lg shadow-white/5"
          >
            <Icons.Bag className="w-4 h-4 ml-[-2px]" />
            <span className="text-[11px] font-black uppercase tracking-widest">{cartCount}</span>
          </button>

          <button
            className="lg:hidden p-2 hover:bg-white/10 rounded-full text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Icons.Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-premium-bg z-[60] p-6 animate-fade-in flex flex-col">
          <div className="flex flex-col gap-4 text-2xl font-display font-medium">
            <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="text-left py-2 text-brand-secondary">Collection</button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-auto w-full py-4 border-t border-white/10 text-sm font-medium text-brand-secondary"
          >
            Close Menu
          </button>
        </div>
      )}
    </header>
  );
};