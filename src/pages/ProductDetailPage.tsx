import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Heart, Minus, Plus, Shield, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { LuxuryImage } from '../components/BrandLogo';

export function ProductDetailPage({ productId }: { productId: string }) {
  const {
    products,
    reviews,
    user,
    wishlistIds,
    toggleWishlist,
    addToCart,
    navigate,
    submitReview,
  } = useStore();

  const product = products.find((p) => p.id === productId);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === productId),
    [reviews, productId],
  );

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-display text-3xl font-semibold text-[#09090B]">Product Not Found</h1>
        <p className="text-sm text-zinc-600">
          This piece may have been archived or removed from the NOSIF WORLDS catalog.
        </p>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop', division: 'all' })}
          className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  const activeSize = selectedSize || product.sizes[0] || 'Standard';
  const activeColor = selectedColor || product.colors[0] || 'Signature';
  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.stock > 0;

  const handleBuyNow = () => {
    addToCart(product, activeSize, activeColor, quantity);
    navigate({ page: 'checkout' });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ page: 'account' });
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        productId: product.id,
        productName: product.name,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-16">
      <button
        type="button"
        onClick={() =>
          navigate({ page: product.division === 'fashion' ? 'fashion' : 'electronics' })
        }
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-[#09090B]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {product.division === 'fashion' ? 'Fashion Store' : 'Electronics Store'}</span>
      </button>

      {/* Main Contiguous PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Sticky Gallery Left */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 bg-[#141416] border border-zinc-200 aspect-[4/3] overflow-hidden">
          <LuxuryImage
            src={product.imageUrl}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Purchase Module Right */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 p-7 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-zinc-100 pb-5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="uppercase tracking-wider">
                {product.division} · {product.category}
              </span>
              <span className="font-mono">{product.sku}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#09090B] leading-tight">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-3 pt-2 tabular-nums">
              <span className="font-mono text-2xl font-semibold text-[#09090B]">
                {formatBdt(product.priceBdt)}
              </span>
              {product.compareAtBdt && product.compareAtBdt > product.priceBdt && (
                <span className="font-mono text-sm text-zinc-400 line-through">
                  {formatBdt(product.compareAtBdt)}
                </span>
              )}
            </div>
            <p className={`text-xs font-semibold pt-1 ${inStock ? 'text-emerald-700' : 'text-red-700'}`}>
              {inStock ? `In Stock (${product.stock} available for dispatch)` : 'Currently Out of Stock'}
            </p>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 block">
                Select Size / Configuration
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
                      activeSize === size
                        ? 'bg-[#09090B] text-white border-[#09090B]'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-[#C8A252]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 block">
                Select Finish / Color
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
                      activeColor === color
                        ? 'bg-[#09090B] text-white border-[#09090B]'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-[#C8A252]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center border border-zinc-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-mono text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Increase quantity"
                  className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="inline-flex items-center gap-2 px-4 h-10 border border-zinc-300 text-xs font-semibold text-zinc-800 hover:border-[#C8A252]"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#C8A252] text-[#C8A252]' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!inStock}
                onClick={() => addToCart(product, activeSize, activeColor, quantity)}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1C1C1F] disabled:opacity-40 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#C8A252]" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={!inStock}
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664] disabled:opacity-40 transition-colors"
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Specs List */}
          {product.specs && product.specs.length > 0 && (
            <div className="pt-5 border-t border-zinc-100 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Specifications & Craftsmanship
              </h2>
              <ul className="space-y-1.5 text-xs text-zinc-600">
                {product.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#9E7B31] shrink-0 mt-0.5" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100 flex items-start gap-2.5 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-[#9E7B31] shrink-0 mt-0.5" />
            <span>
              Sold exclusively by NOSIF WORLDS. Cash on Delivery available across Bangladesh; bKash, Nagad & SSLCommerz gateway-ready.
            </span>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <section className="border-t border-zinc-200 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-display text-3xl font-semibold text-[#09090B]">
            Client Reviews ({productReviews.length})
          </h2>
          {productReviews.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No reviews submitted for this item yet. Be the first verified client to share feedback.
            </p>
          ) : (
            <div className="space-y-4">
              {productReviews.map((r) => (
                <div key={r.id} className="bg-white border border-zinc-200 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#C8A252]">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#C8A252]" />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">{r.authorName}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#09090B]">{r.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-zinc-200 p-6 space-y-4">
          <h3 className="font-display text-2xl font-semibold text-[#09090B]">Write a Review</h3>
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                Sign in with your verified account to publish a review for this piece.
              </p>
              <button
                type="button"
                onClick={() => navigate({ page: 'account' })}
                className="px-5 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Sign In to Review
              </button>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Rating
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white"
                >
                  <option value={5}>5 Stars — Exceptional</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Satisfactory</option>
                  <option value={2}>2 Stars — Fair</option>
                  <option value={1}>1 Star — Poor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summary of your experience"
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Review
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share fit, material, or hardware impressions..."
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1C1C1F] disabled:opacity-50"
              >
                {submittingReview ? 'Publishing...' : 'Publish Review'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
