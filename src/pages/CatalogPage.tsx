import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ELECTRONICS_CATEGORIES, FASHION_CATEGORIES } from '../data/catalog';
import { Division } from '../types';
import { ProductCard } from '../components/ProductCard';

interface CatalogPageProps {
  mode: 'fashion' | 'electronics' | 'all';
  initialCategory?: string;
  initialQuery?: string;
  initialDivision?: Division | 'all';
}

export function CatalogPage({
  mode,
  initialCategory,
  initialQuery = '',
  initialDivision = 'all',
}: CatalogPageProps) {
  const { products, visibleCategories: managedCategories } = useStore();
  const [selectedDivision, setSelectedDivision] = useState<Division | 'all'>(
    mode === 'all' ? initialDivision : mode,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const activeDivision = mode === 'all' ? selectedDivision : mode;

  const categories = useMemo(() => {
    const dynamicFashion = managedCategories
      .filter((c) => c.division === 'fashion')
      .map((c) => c.name);
    const dynamicElectronics = managedCategories
      .filter((c) => c.division === 'electronics')
      .map((c) => c.name);
    const fList = dynamicFashion.length > 0 ? dynamicFashion : [...FASHION_CATEGORIES];
    const eList = dynamicElectronics.length > 0 ? dynamicElectronics : [...ELECTRONICS_CATEGORIES];

    if (activeDivision === 'fashion') return ['All', ...Array.from(new Set(fList))];
    if (activeDivision === 'electronics') return ['All', ...Array.from(new Set(eList))];
    return ['All', ...Array.from(new Set([...fList, ...eList]))];
  }, [activeDivision, managedCategories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeDivision !== 'all' && p.division !== activeDivision) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (q) {
        const hay = `${p.name} ${p.category} ${p.description} ${p.sku} ${(p.specs || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.priceBdt - b.priceBdt);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.priceBdt - a.priceBdt);
    if (sortBy === 'newest') return [...list].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, activeDivision, selectedCategory, searchQuery, sortBy, inStockOnly]);

  const title =
    mode === 'fashion'
      ? 'NOSIF WORLDS Fashion Store'
      : mode === 'electronics'
        ? 'NOSIF WORLDS Electronics Store'
        : 'Complete Luxury Catalog';

  const subtitle =
    mode === 'fashion'
      ? "Tailored menswear, silk womenswear, Goodyear-welted footwear, horology, leather bags, and refined accessories."
      : mode === 'electronics'
        ? 'Flagship titanium smartphones, reference ANC audio, workstations, OLED ultrabooks, smartwatches, and everyday precision gadgets.'
        : 'Browse our complete single-vendor assortment across luxury fashion and flagship personal electronics.';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">
          Single-Vendor Assortment · Priced in BDT
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B]">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or spec..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 text-sm text-[#09090B] focus:outline-none focus:border-[#C8A252]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {mode === 'all' && (
              <div className="inline-flex items-center p-1 bg-zinc-100 border border-zinc-200">
                {(['all', 'fashion', 'electronics'] as const).map((div) => (
                  <button
                    key={div}
                    type="button"
                    onClick={() => {
                      setSelectedDivision(div);
                      setSelectedCategory('All');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                      selectedDivision === div
                        ? 'bg-[#09090B] text-white'
                        : 'text-zinc-600 hover:text-[#09090B]'
                    }`}
                  >
                    {div === 'all' ? 'All Divisions' : div}
                  </button>
                ))}
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer px-3 py-2 border border-zinc-300 bg-white">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#09090B]"
              />
              <span>In Stock Only</span>
            </label>

            <div className="inline-flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort products"
                className="text-xs font-medium text-[#09090B] bg-transparent focus:outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="newest">Sort: New Arrivals</option>
                <option value="price-asc">Price: Low to High (BDT)</option>
                <option value="price-desc">Price: High to Low (BDT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#09090B] text-white border-[#09090B]'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#C8A252]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-12 text-center space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            No matching pieces found
          </h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Try clearing your search keyword or switching to another category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setInStockOnly(false);
            }}
            className="px-5 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
