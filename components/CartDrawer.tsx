import React, { useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from './Icon';
import { Button, SafeImage } from './ui';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, navigate } = useStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCartOpen, setIsCartOpen]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-opacity">
      <div
        ref={drawerRef}
        className="w-full max-w-sm bg-[#062016] h-full shadow-2xl flex flex-col transform transition-transform animate-slide-in-right border-l border-white/5"
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <h2 className="text-lg font-display font-bold text-brand-secondary">Shopping Bag</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg transition-all text-brand-secondary"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Icons.Bag className="w-12 h-12 text-brand-secondary mb-4 opacity-20" />
              <p className="text-brand-secondary/40 text-sm">Your bag is empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-xs font-bold border-b border-brand-secondary text-brand-secondary pb-1"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-24 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0">
                  <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-brand-secondary">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="text-brand-secondary/40 hover:text-brand-secondary transition-colors">
                      <Icons.Close className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-bold mb-auto text-brand-secondary">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-white/10 rounded-lg bg-white/5">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:text-brand-secondary text-brand-secondary/60"><Icons.Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center text-xs font-bold text-brand-secondary">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:text-brand-secondary text-brand-secondary/60"><Icons.Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm text-brand-secondary/60">Total</span>
              <span className="text-xl font-bold text-brand-secondary">${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              fullWidth
              size="lg"
              className="rounded-xl"
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
            >
              Checkout
            </Button>
            <p className="text-[10px] text-brand-secondary/30 text-center uppercase tracking-widest">Shipping calculated at checkout</p>
          </div>
        )}
      </div>
    </div>
  );
};