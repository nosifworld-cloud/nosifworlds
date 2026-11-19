import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { HERO_CAMPAIGN_IMAGE } from '../data/catalog';
import { LuxuryImage } from '../components/BrandLogo';
import { ProductCard } from '../components/ProductCard';

export function HomePage() {
  const { products, reviews, siteContent, navigate, openSearchModal } = useStore();
  const [heroSearch, setHeroSearch] = useState('');
  const [collectionTab, setCollectionTab] = useState<'featured' | 'new' | 'bestseller'>('featured');

  const showcasedProducts = useMemo(() => {
    if (collectionTab === 'new') return products.filter((p) => p.isNewArrival).slice(0, 6);
    if (collectionTab === 'bestseller') return products.filter((p) => p.isBestSeller).slice(0, 6);
    return products.filter((p) => p.featured).slice(0, 6);
  }, [products, collectionTab]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    openSearchModal(heroSearch.trim());
  };

  return (
    <div>
      {/* Slim Offer Notice */}
      <div className="bg-[#09090B] text-zinc-200 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs">
          <span className="truncate">{siteContent.offerBanner}</span>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop', division: 'all' })}
            className="text-[#C8A252] hover:underline whitespace-nowrap shrink-0 ml-4"
          >
            Explore Catalog
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative bg-[#09090B] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Hero Copy & Search */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#C8A252]">
                {siteContent.heroEyebrow}
              </p>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.08] tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                {siteContent.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                {siteContent.heroSubtitle}
              </p>

              {/* Integrated Catalog Search */}
              <form
                onSubmit={handleHeroSearch}
                className="flex items-center bg-[#141416] border border-white/15 focus-within:border-[#C8A252] max-w-xl"
              >
                <Search className="w-4 h-4 text-zinc-400 ml-4 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search tailoring, watches, headphones, laptops..."
                  className="flex-1 min-w-0 px-3.5 py-3.5 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664] transition-colors whitespace-nowrap shrink-0"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'fashion' })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] transition-colors whitespace-nowrap"
                >
                  <span>Shop Fashion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'electronics' })}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/25 text-white text-xs font-semibold uppercase tracking-wider hover:border-[#C8A252] hover:text-[#C8A252] transition-colors whitespace-nowrap"
                >
                  <span>Shop Electronics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* 16:9 / Full-Height Campaign Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative min-h-[280px] sm:min-h-[380px] lg:min-h-[460px] border border-white/10 overflow-hidden"
            >
              <LuxuryImage
                src={HERO_CAMPAIGN_IMAGE}
                alt="NOSIF WORLDS tailored cashmere overcoat, gold chronograph, and flagship headphones"
                fallbackTitle="NOSIF WORLDS Campaign"
                className="w-full h-full lg:h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-[#C8A252]">
                  Autumn / Winter Release
                </p>
                <p className="font-display text-xl text-white mt-1">
                  Single-Vendor Provenance · Priced in BDT
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Curated Collection Grid (Featured / New Arrivals / Best Sellers) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Curated Releases</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#09090B]">
              Signature House Selection
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Collection View"
            className="inline-flex items-center p-1 bg-zinc-100 border border-zinc-200 self-start"
          >
            {[
              { id: 'featured' as const, label: 'Featured' },
              { id: 'new' as const, label: 'New Arrivals' },
              { id: 'bestseller' as const, label: 'Best Sellers' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={collectionTab === tab.id}
                onClick={() => setCollectionTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 ${
                  collectionTab === tab.id
                    ? 'bg-[#09090B] text-white'
                    : 'text-zinc-600 hover:text-[#09090B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-8">
          {showcasedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => navigate({ page: 'shop', division: 'all' })}
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#09090B] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#09090B] hover:text-white transition-colors"
          >
            <span>View Complete Catalog ({products.length} Pieces)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Dual Storefront Showcase: Fashion & Electronics */}
      <section className="bg-[#141416] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fashion Store Card */}
            <div className="group relative border border-white/10 overflow-hidden bg-[#09090B] flex flex-col">
              <div className="aspect-[16/10] overflow-hidden">
                <LuxuryImage
                  src="/src/assets/images/fashion_mens_tailoring_1795002419791.jpg"
                  alt="NOSIF WORLDS Fashion Store"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C8A252]">Division 01</p>
                  <h3 className="font-display text-3xl font-semibold">The Fashion Store</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Men&apos;s Fashion, Women&apos;s Fashion, Clothing, Goodyear-welted Shoes, Swiss-grade Watches, Leather Bags, and Accessories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'fashion' })}
                  className="self-start inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664] transition-colors"
                >
                  <span>Enter Fashion Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Electronics Store Card */}
            <div className="group relative border border-white/10 overflow-hidden bg-[#09090B] flex flex-col">
              <div className="aspect-[16/10] overflow-hidden">
                <LuxuryImage
                  src="/src/assets/images/electronics_flagship_audio_1795002420781.jpg"
                  alt="NOSIF WORLDS Electronics Store"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C8A252]">Division 02</p>
                  <h3 className="font-display text-3xl font-semibold">The Electronics Store</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Titanium Smartphones, Reference ANC Headphones, Studio Computers, OLED Laptops, Smart Watches, and Precision Gadgets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'electronics' })}
                  className="self-start inline-flex items-center gap-2 px-5 py-2.5 border border-white/25 text-white text-xs font-semibold uppercase tracking-wider hover:border-[#C8A252] hover:text-[#C8A252] transition-colors"
                >
                  <span>Enter Electronics Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* House Guarantees Strip */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#C8A252] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Single-Vendor Authenticity</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Every garment and electronic instrument ships directly from NOSIF WORLDS inventory with serialized verification.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <Truck className="w-5 h-5 text-[#C8A252] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Insured Bangladesh Delivery</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Complimentary courier across Dhaka above ৳25,000, Cash on Delivery, and bKash / Nagad / SSLCommerz readiness.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-[#C8A252] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">AYAN AI Bilingual Concierge</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Live catalog guidance in English and বাংলা with direct WhatsApp escalation whenever personal assistance is needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-zinc-200">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Client Impressions</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#09090B] mt-1">
              Verified Customer Reviews
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ page: 'reviews' })}
            className="text-xs font-semibold uppercase tracking-wider text-[#09090B] hover:text-[#9E7B31] inline-flex items-center gap-1.5"
          >
            <span>Read & Submit Reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 pt-8">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-white border border-zinc-200 p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#C8A252]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-[#C8A252]" />
                  ))}
                </div>
                <h3 className="font-sans text-base font-semibold text-[#09090B]">{review.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{review.comment}</p>
              </div>
              <div className="pt-4 border-t border-zinc-100 text-xs text-zinc-500">
                <span className="font-semibold text-[#09090B]">{review.authorName}</span>
                <span aria-hidden="true"> · </span>
                <span>{review.productName}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
