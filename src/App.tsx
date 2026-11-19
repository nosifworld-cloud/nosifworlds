import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AyanAiWidget } from './components/AyanAiWidget';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { CartPage, CheckoutPage } from './pages/CartCheckoutPages';
import { AccountPage, OrdersPage } from './pages/AccountOrdersPages';
import {
  AboutPage,
  ContactPage,
  JournalPage,
  PrivacyPolicyPage,
  ReviewsPage,
  TermsPage,
} from './pages/EditorialPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function StorefrontShell() {
  const { route, toastMessage } = useStore();
  const isAdminRoute = route.page === 'admin' || route.page === 'admin-login';

  const renderPage = () => {
    switch (route.page) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage />;
      case 'fashion':
        return (
          <CatalogPage
            key={`fashion-${route.category || 'all'}`}
            mode="fashion"
            initialCategory={route.category}
          />
        );
      case 'electronics':
        return (
          <CatalogPage
            key={`electronics-${route.category || 'all'}`}
            mode="electronics"
            initialCategory={route.category}
          />
        );
      case 'shop':
        return (
          <CatalogPage
            key={`shop-${route.division || 'all'}-${route.query || ''}`}
            mode="all"
            initialQuery={route.query}
            initialDivision={route.division}
          />
        );
      case 'product':
        return <ProductDetailPage key={route.productId} productId={route.productId} />;
      case 'wishlist':
        return <WishlistPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'account':
        return <AccountPage />;
      case 'orders':
        return <OrdersPage />;
      case 'journal':
        return <JournalPage articleId={route.articleId} />;
      case 'reviews':
        return <ReviewsPage />;
      case 'contact':
        return <ContactPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsPage />;
      case 'admin':
        return <AdminDashboardPage />;
      case 'admin-login':
        return <AdminLoginPage />;
    }
  };

  return (
    <div className={isAdminRoute ? 'min-h-screen bg-[#09090B] text-white' : 'min-h-screen flex flex-col bg-[#FAFAF9] text-[#09090B]'}>
      {!isAdminRoute && <Header />}
      <main className={isAdminRoute ? '' : 'flex-1'}>{renderPage()}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SearchModal />}
      {!isAdminRoute && <AyanAiWidget />}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-5 z-50 bg-[#09090B] text-white border border-[#C8A252]/60 px-4 py-3 text-xs font-medium shadow-lg max-w-xs print:hidden"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StorefrontShell />
      </StoreProvider>
    </ErrorBoundary>
  );
}
