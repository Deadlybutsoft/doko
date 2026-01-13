import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button, SectionTitle, SafeImage } from '../components/ui';
import { Icons } from '../components/Icon';

export const Checkout: React.FC = () => {
  const { cart, cartTotal, navigate, clearCart, addOrder } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);

  if (cart.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-sm">
        <h1 className="text-3xl font-display font-medium mb-4">Your bag is empty.</h1>
        <p className="text-black mb-10 font-light">Add some ingredients to get started.</p>
        <Button fullWidth onClick={() => navigate('/')}>Return to Shop</Button>
      </div>
    );
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      addOrder({
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        date: new Date().toISOString(),
        items: [...cart],
        total: cartTotal + 5,
        status: 'Processing'
      });
      setLoading(false);
      clearCart();
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-sm animate-fade-in">
        <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-8">
          <Icons.Check className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-medium mb-4 text-brand-secondary">Order Received</h1>
        <p className="text-brand-secondary/40 text-sm mb-10">Thank you for choosing Toka. We've sent a confirmation to your email.</p>
        <div className="flex flex-col gap-3">
          <Button fullWidth onClick={() => navigate('/')}>Continue Shopping</Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/profile')}>Track Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-20 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-12 text-brand-secondary">Checkout</h1>

          <form onSubmit={handlePayment} className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-secondary/40">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-brand-secondary placeholder:text-brand-secondary/30 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-brand-secondary placeholder:text-brand-secondary/30 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                />
              </div>
            </div>
            <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-4">
              {loading ? "Processing..." : "Confirm Selection"}
            </Button>
          </form>
        </div>

        <div className="lg:sticky lg:top-32 h-fit space-y-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-secondary/40">Order Summary</h2>
            <div className="space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                      <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-brand-secondary/80">{item.name}</p>
                      <p className="text-[10px] text-brand-secondary/40 font-bold uppercase tracking-widest">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold text-brand-secondary/80">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 text-sm">
              <div className="flex justify-between text-brand-secondary/40 font-medium">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-secondary/40 font-medium">
                <span>Shipping</span>
                <span className="text-white">Calculated</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 text-brand-secondary">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};