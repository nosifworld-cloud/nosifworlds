import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Heart,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { Division } from '../types';
import { LuxuryImage } from './BrandLogo';

type AvailabilityFilter = 'all' | 'in_stock' | 'out_of_stock';
type SortMode = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ৳30,000', min: '', max: '30000' },
  { label: '৳30,000 – ৳100,000', min: '30000', max: '100000' },
  { label: '৳100,000+', min: '100000', max: '' },
];

export function SearchModal() {
  const {
    searchModalOpen,
    searchInitialQuery,
    closeSearchModal,
    products,
    categories,
    wishlistIds,
    toggleWishlist,
    addToCart,
    navigate,
  } = useStore();

  const [queryText, setQueryText] = useState('');
  const [division, setDivision] = useState<Division | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('relevance');

  useEffect(() => {
    if (searchModalOpen) {
      setQueryText(searchInitialQuery || '');
    }
  }, [searchModalOpen, searchInitialQuery]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearchModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchModalOpen, closeSearchModal]);

  const availableCategories = useMemo(() => {
    const filteredByDiv =
      division === 'all'
        ? categories
        : categories.filter((c) => c.division === division);
    const names = Array.from(new Set(filteredByDiv.map((c) => c.name)));
    for (const p of products) {
      if (division === 'all' || p.division === division) {
        if (!names.includes(p.category)) names.push(p.category);
      }
    }
    return names;
  }, [categories, products, division]);

  const filteredProducts = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const min = minPrice.trim() !== '' ? Number(minPrice) : null;
    const max = maxPrice.trim() !== '' ? Number(maxPrice) : null;

    const list = products.filter((p) => {
      if (division !== 'all' && p.division !== division) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (availability === 'in_stock' && p.stock <= 0) return false;
      if (availability === 'out_of_stock' && p.stock > 0) return false;
      if (min !== null && !Number.isNaN(min) && p.priceBdt < min) return false;
      if (max !== null && !Number.isNaN(max) && p.priceBdt > max) return false;
      if (q) {
        const hay = [
          p.name,
          p.sku,
          p.category,
          p.division,
          p.description,
          ...(p.specs || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortMode === 'price-asc') {
      return [...list].sort((a, b) => a.priceBdt - b.priceBdt);
    }
    if (sortMode === 'price-desc') {
      return [...list].sort((a, b) => b.priceBdt - a.priceBdt);
    }
    if (sortMode === 'newest') {
      return [...list].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
    }
    return list;
  }, [products, queryText, division, selectedCategory, availability, minPrice, maxPrice, sortMode]);

  const resetFilters = () => {
    setQueryText('');
    setDivision('all');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('all');
    setSortMode('relevance');
  };

  if (!searchModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search NOSIF WORLDS catalog"
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#09090B]/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearchModal();
      }}
    >
      <div className="w-full max-w-6xl bg-[#FAFAF9] border border-zinc-300 shadow-2xl overflow-hidden my-2 sm:my-4">
        {/* Top Search Bar */}
        <div className="bg-[#09090B] text-white px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C8A252] shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search tailored blazers, titanium watches, smartphones, ANC headphones, SKU..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={closeSearchModal}
            aria-label="Close search overlay"
            className="w-9 h-9 flex items-center justify-center border border-white/15 text-zinc-300 hover:text-white hover:border-[#C8A252] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Filter Strip */}
        <div className="bg-white border-b border-zinc-200 px-5 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#09090B]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9E7B31]" />
              <span>Real-Time Filters</span>
              <span className="font-mono text-zinc-500 ml-1 tabular-nums">
                ({filteredProducts.length} of {products.length} pieces)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-[#09090B]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeSearchModal();
                  navigate({
                    page: 'shop',
                    query: queryText.trim() || undefined,
                    division,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
              >
                <span>Open Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Division Filter */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value as Division | 'all');
                  setSelectedCategory('all');
                }}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-[#C8A252]"
              >
                <option value="all">All Divisions</option>
                <option value="fashion">Fashion Store</option>
                <option value="electronics">Electronics Store</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-[#C8A252]"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range BDT */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Price Range (BDT)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  min={0}
                  placeholder="Min ৳"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-zinc-300 px-2.5 py-2 text-xs font-mono tabular-nums focus:outline-none focus:border-[#C8A252]"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max ৳"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-zinc-300 px-2.5 py-2 text-xs font-mono tabular-nums focus:outline-none focus:border-[#C8A252]"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityFilter)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-[#C8A252]"
              >
                <option value="all">All Stock Status</option>
                <option value="in_stock">In Stock Only</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                Sort Results
              </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#09090B] focus:outline-none focus:border-[#C8A252]"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">New Arrivals First</option>
              </select>
            </div>
          </div>

          {/* Quick Price Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 mr-1">
              Quick Budget:
            </span>
            {PRICE_PRESETS.map((preset) => {
              const active = minPrice === preset.min && maxPrice === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    active
                      ? 'bg-[#09090B] text-white border-[#09090B]'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[#C8A252]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Viewport */}
        <div className="max-h-[62vh] overflow-y-auto p-5">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-zinc-200 p-10 text-center space-y-3">
              <p className="font-display text-2xl font-semibold text-[#09090B]">
                No matching pieces found
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Adjust your search keyword, BDT price range, category, or stock availability filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const inStock = product.stock > 0;
                const wishlisted = wishlistIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-zinc-200 flex flex-col justify-between hover:border-[#C8A252] transition-colors"
                  >
                    <div>
                      <div className="relative aspect-[4/3] bg-[#141416] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            closeSearchModal();
                            navigate({ page: 'product', productId: product.id });
                          }}
                          className="w-full h-full block"
                        >
                          <LuxuryImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-[#09090B]/80 text-white flex items-center justify-center hover:bg-[#09090B]"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              wishlisted ? 'fill-[#C8A252] text-[#C8A252]' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                          <span className="text-zinc-500">
                            {product.division} · {product.category}
                          </span>
                          <span
                            className={
                              inStock ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'
                            }
                          >
                            {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            closeSearchModal();
                            navigate({ page: 'product', productId: product.id });
                          }}
                          className="text-left font-sans text-sm font-semibold text-[#09090B] hover:text-[#9E7B31] line-clamp-1"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-zinc-500 line-clamp-2">{product.description}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-[#09090B] tabular-nums">
                        {formatBdt(product.priceBdt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            closeSearchModal();
                            navigate({ page: 'product', productId: product.id });
                          }}
                          className="px-2.5 py-1.5 border border-zinc-300 text-[11px] font-semibold uppercase tracking-wider hover:border-[#09090B]"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          disabled={!inStock}
                          onClick={() => addToCart(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#09090B] text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] disabled:opacity-40"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
