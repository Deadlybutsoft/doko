import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Icons } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { Badge, SafeImage } from '../components/ui';

export const Profile: React.FC = () => {
  const { wishlist, orders, allProducts, navigate } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-8 border-b border-zinc-100">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2 text-brand-secondary">My Account</h1>
          <p className="text-brand-secondary/40 text-sm font-light">Manage your history and saved items.</p>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-black' : 'text-brand-secondary/60 hover:text-brand-secondary'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'wishlist' ? 'bg-white shadow-sm text-black' : 'text-brand-secondary/60 hover:text-brand-secondary'}`}
          >
            Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-brand-secondary/40 text-sm mb-4">You haven't placed any orders yet.</p>
                <button onClick={() => navigate('/')} className="text-xs font-bold border-b border-brand-secondary text-brand-secondary pb-1">Start Shopping</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                  <div className="bg-white/5 px-6 py-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
                    <div className="flex gap-8">
                      <span>Date: {new Date(order.date).toLocaleDateString()}</span>
                      <span>Order ID: #{order.id}</span>
                      <span className="text-brand-secondary">Total: ${order.total.toFixed(2)}</span>
                    </div>
                    <Badge variant="black">{order.status}</Badge>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-8">
                      {order.items.map(item => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-12 h-14 bg-zinc-50 rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-xs">
                            <p className="font-bold text-brand-secondary/80">{item.name}</p>
                            <p className="text-brand-secondary/40">{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-brand-secondary/40 text-sm mb-4">No items saved.</p>
                <button onClick={() => navigate('/')} className="text-xs font-bold border-b border-brand-secondary text-brand-secondary pb-1">Browse catalog</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {wishlistProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};