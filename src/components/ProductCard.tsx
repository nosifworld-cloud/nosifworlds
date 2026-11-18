import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { Product } from '../types';
import { LuxuryImage } from './BrandLogo';

export function ProductCard({ product }: { product: Product }) {
  const { navigate, addToCart, wishlistIds, toggleWishlist } = useStore();
  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.stock > 0;

  return (
    <article className="group bg-white border border-zinc-200 flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      {/* 4:3 Studio Image Container */}
      <div className="relative aspect-[4/3] bg-[#141416] overflow-hidden">
        <button
          type="button"
          onClick={() => navigate({ page: 'product', productId: product.id })}
          className="w-full h-full block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
        >
          <LuxuryImage
            src={product.imageUrl}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 w-9 h-9 bg-[#09090B]/75 backdrop-blur-sm text-white flex items-center justify-center hover:bg-[#09090B] transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-[#C8A252] text-[#C8A252]' : 'text-white'}`}
          />
        </button>
      </div>

      {/* Product Metadata */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="uppercase tracking-wider">
              {product.division === 'fashion' ? 'Fashion' : 'Electronics'} · {product.category}
            </span>
            <span className={inStock ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
              {inStock ? 'In Stock' : 'Sold Out'}
            </span>
          </div>

          <h3 className="font-sans text-base font-semibold text-[#09090B] leading-snug">
            <button
              type="button"
              onClick={() => navigate({ page: 'product', productId: product.id })}
              className="text-left hover:text-[#9E7B31] transition-colors"
            >
              {product.name}
            </button>
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="font-mono text-sm font-semibold text-[#09090B]">
              {formatBdt(product.priceBdt)}
            </span>
            {product.compareAtBdt && product.compareAtBdt > product.priceBdt && (
              <span className="font-mono text-xs text-zinc-400 line-through">
                {formatBdt(product.compareAtBdt)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={() => addToCart(product)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
