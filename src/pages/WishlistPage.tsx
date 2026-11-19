import React from 'react';
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { LuxuryImage } from '../components/BrandLogo';

export function WishlistPage() {
  const {
    user,
    authReady,
    signInWithGoogle,
    wishlistProducts,
    toggleWishlist,
    moveWishlistToCart,
    navigate,
  } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">
            Private Cloud Collection
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
            Saved Wishlist ({wishlistProducts.length})
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Pieces saved to your NOSIF WORLDS profile persist across devices for future purchase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate({ page: 'shop', division: 'all' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#09090B] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#09090B] hover:text-white transition-colors self-start"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!authReady ? (
        <div className="bg-white border border-zinc-200 p-10 text-center text-sm text-zinc-500">
          Loading saved wishlist...
        </div>
      ) : !user ? (
        <div className="bg-white border border-zinc-200 p-8 sm:p-10 max-w-xl space-y-4">
          <div className="w-11 h-11 bg-[#09090B] text-[#C8A252] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Sign In to Access Your Persistent Wishlist
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Your saved fashion garments, Swiss-grade watches, and flagship electronics are securely stored in your private Firestore collection across sessions.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-12 text-center space-y-4">
          <Heart className="w-8 h-8 text-[#C8A252] mx-auto" />
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Your wishlist is currently empty
          </h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Select the heart icon on any tailoring piece or electronic instrument to save it for later acquisition.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'fashion' })}
              className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
            >
              Browse Fashion
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'electronics' })}
              className="px-6 py-3 border border-[#09090B] text-[#09090B] text-xs font-semibold uppercase tracking-wider"
            >
              Browse Electronics
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {wishlistProducts.map((product) => {
            const inStock = product.stock > 0;
            return (
              <article
                key={product.id}
                className="bg-white border border-zinc-200 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-[#141416] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'product', productId: product.id })}
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
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute top-3 right-3 w-9 h-9 bg-[#09090B]/80 text-white flex items-center justify-center hover:bg-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                      <span className="text-zinc-500">
                        {product.division} · {product.category}
                      </span>
                      <span
                        className={inStock ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}
                      >
                        {inStock ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'product', productId: product.id })}
                      className="font-sans text-base font-semibold text-[#09090B] hover:text-[#9E7B31] text-left"
                    >
                      {product.name}
                    </button>
                    <p className="font-mono text-sm font-semibold text-[#09090B] tabular-nums">
                      {formatBdt(product.priceBdt)}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-zinc-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={() => moveWishlistToCart(product)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] disabled:opacity-40 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{inStock ? 'Move to Bag' : 'Out of Stock'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'product', productId: product.id })}
                    className="px-3.5 py-2.5 border border-zinc-300 text-xs font-semibold uppercase tracking-wider hover:border-[#09090B]"
                  >
                    View
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
