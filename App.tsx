import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';

import { WishlistDrawer } from './components/WishlistDrawer';
import { RecipeDetail } from './pages/RecipeDetail';

const AppContent: React.FC = () => {
  const { currentRoute } = useStore();

  const renderRoute = () => {
    if (currentRoute === '/' || currentRoute === '') {
      return <Home />;
    }

    if (currentRoute.startsWith('/product/')) {
      const productId = currentRoute.split('/product/')[1];
      return <ProductDetail productId={productId} />;
    }

    if (currentRoute === '/checkout') {
      return <Checkout />;
    }

    if (currentRoute === '/profile') {
      return <Profile />;
    }

    if (currentRoute.startsWith('/recipe/')) {
      const recipeId = currentRoute.split('/recipe/')[1];
      return <RecipeDetail recipeId={recipeId} />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-premium-bg">
        <h1 className="text-8xl font-display font-bold mb-4 text-brand-secondary">404</h1>
        <p className="text-brand-secondary">Page not found</p>
        <button
          onClick={() => window.location.hash = '/'}
          className="mt-8 text-brand-secondary underline hover:opacity-70 transition-opacity font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-premium-bg text-brand-secondary font-sans antialiased">
      <Header />
      <main className="flex-1">
        {renderRoute()}
      </main>
      <footer className="bg-black overflow-hidden py-10">
        <div className="w-full flex justify-center items-center">
          <h2 className="font-display font-black text-[22vw] leading-none tracking-tighter text-white select-none whitespace-nowrap">
            DOKO
          </h2>
        </div>
      </footer>
      <CartDrawer />
      <WishlistDrawer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;