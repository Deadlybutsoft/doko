import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Icons } from './Icon';
import { Badge, SafeImage } from './ui';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, navigate, toggleWishlist, isInWishlist } = useStore();
  const isWishlisted = isInWishlist(product.id);

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div
      className="group relative flex flex-col cursor-pointer bg-transparent"
      onClick={handleProductClick}
    >
      <div className="relative aspect-[1/1.1] bg-white/5 rounded-xl overflow-hidden mb-4 transition-all duration-300 group-hover:bg-white/10">
        <SafeImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {product.isNew && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge variant="black">NEW</Badge>
            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-[8px]">RECIPE READY</Badge>
          </div>
        )}
        {!product.isNew && (
          <div className="absolute top-4 left-4">
            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-[8px] text-brand-secondary/60">INTELLIGENT PAIRING</Badge>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:bg-white"
        >
          <Icons.Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-black text-black' : 'text-black'}`} />
        </button>

        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full h-10 bg-white text-black text-xs font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Quick Add
          </button>
        </div>
      </div>

      <div className="px-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm text-brand-secondary hover:opacity-70 transition-colors truncate pr-2">{product.name}</h3>
          <p className="text-sm font-bold text-brand-secondary">${product.price.toFixed(2)}</p>
        </div>
        <p className="text-[10px] text-brand-secondary/40 uppercase font-bold tracking-tight">{product.category}</p>
      </div>
    </div>
  );
};