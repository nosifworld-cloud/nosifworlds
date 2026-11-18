import React, { useState } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandCrest } from './BrandLogo';

export function Header() {
  const { route, navigate, cartCount, user, isAdmin } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ page: 'shop', query: searchQuery.trim() || undefined, division: 'all' });
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b ${
      active
        ? 'text-[#09090B] border-[#C8A252]'
        : 'text-zinc-600 border-transparent hover:text-[#09090B] hover:border-zinc-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Title */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            navigate({ page: 'home' });
          }}
          className="flex items-center gap-2.5 text-[#09090B] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
        >
          <BrandCrest className="w-6 h-6" />
          <span className="font-display text-xl font-bold tracking-[0.14em] uppercase">
            NOSIF WORLDS
          </span>
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: 'home' });
            }}
            className={navLinkClass(route.page === 'home')}
          >
            Home
          </a>
          <a
            href="#/fashion"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: 'fashion' });
            }}
            className={navLinkClass(route.page === 'fashion')}
          >
            Fashion
          </a>
          <a
            href="#/electronics"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: 'electronics' });
            }}
            className={navLinkClass(route.page === 'electronics')}
          >
            Electronics
          </a>
          <a
            href="#/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: 'shop', division: 'all' });
            }}
            className={navLinkClass(route.page === 'shop' || route.page === 'product')}
          >
            Catalog
          </a>
          <a
            href="#/journal"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: 'journal' });
            }}
            className={navLinkClass(route.page === 'journal' || route.page === 'about')}
          >
            Journal
          </a>
        </nav>

        {/* Zone 3: Single Primary Action & Utility Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search catalog"
            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-[#09090B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ page: 'account' })}
            aria-label="My Account"
            className="hidden sm:flex w-10 h-10 items-center justify-center text-zinc-700 hover:text-[#09090B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ page: 'cart' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#1C1C1F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#C8A252]" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#09090B]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-zinc-200 bg-white">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blazers, watches, smartphones, ANC headphones..."
              autoFocus
              className="flex-1 text-sm bg-transparent text-[#09090B] placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1C1C1F] transition-colors whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm font-medium">
            {[
              { label: 'Home', target: { page: 'home' } as const },
              { label: 'Fashion Store', target: { page: 'fashion' } as const },
              { label: 'Electronics Store', target: { page: 'electronics' } as const },
              { label: 'All Products', target: { page: 'shop', division: 'all' } as const },
              { label: 'About Us', target: { page: 'about' } as const },
              { label: 'Journal', target: { page: 'journal' } as const },
              { label: 'Customer Reviews', target: { page: 'reviews' } as const },
              { label: 'Contact Us', target: { page: 'contact' } as const },
              { label: user ? 'My Account' : 'Sign In', target: { page: 'account' } as const },
              { label: 'My Orders', target: { page: 'orders' } as const },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate(item.target);
                }}
                className="text-left py-2.5 px-3 border border-zinc-200 hover:border-[#C8A252] text-[#09090B] transition-colors"
              >
                {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate({ page: 'admin' });
                }}
                className="col-span-2 text-left py-2.5 px-3 bg-[#09090B] text-[#C8A252] font-semibold"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
