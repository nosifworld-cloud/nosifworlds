import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AyanAiWidget } from './components/AyanAiWidget';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
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

function StorefrontShell() {
  const { route, toastMessage } = useStore();

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#09090B]">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <AyanAiWidget />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-5 z-50 bg-[#09090B] text-white border border-[#C8A252]/60 px-4 py-3 text-xs font-medium shadow-lg max-w-xs"
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
