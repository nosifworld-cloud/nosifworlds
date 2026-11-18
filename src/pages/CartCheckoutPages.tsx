import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { Order, PaymentMethod } from '../types';
import { LuxuryImage } from '../components/BrandLogo';

export function CartPage() {
  const { cart, cartSubtotalBdt, updateCartQty, removeFromCart, navigate } = useStore();
  const estimatedShipping = cartSubtotalBdt >= 25000 ? 0 : cartSubtotalBdt > 0 ? 150 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">NOSIF WORLDS Bag</p>
        <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
          Shopping Cart
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-12 text-center space-y-5">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Your shopping bag is currently empty
          </h2>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Explore our tailored fashion collections and flagship personal electronics priced in BDT.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'fashion' })}
              className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
            >
              Shop Fashion
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'electronics' })}
              className="px-6 py-3 border border-[#09090B] text-[#09090B] text-xs font-semibold uppercase tracking-wider"
            >
              Shop Electronics
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                className="bg-white border border-zinc-200 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
              >
                <div className="w-full sm:w-28 aspect-[4/3] bg-[#141416] shrink-0 overflow-hidden">
                  <LuxuryImage src={item.imageUrl} alt={item.name} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    {item.division} · {item.sku}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'product', productId: item.productId })}
                    className="font-sans text-base font-semibold text-[#09090B] hover:text-[#9E7B31] text-left"
                  >
                    {item.name}
                  </button>
                  <p className="text-xs text-zinc-600">
                    {item.selectedSize} · {item.selectedColor}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="inline-flex items-center border border-zinc-300">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(
                          item.productId,
                          item.selectedSize,
                          item.selectedColor,
                          item.quantity - 1,
                        )
                      }
                      aria-label="Decrease quantity"
                      className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono text-xs tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(
                          item.productId,
                          item.selectedSize,
                          item.selectedColor,
                          item.quantity + 1,
                        )
                      }
                      aria-label="Increase quantity"
                      className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono text-sm font-semibold text-[#09090B] tabular-nums min-w-[92px] text-right">
                    {formatBdt(item.priceBdt * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.productId, item.selectedSize, item.selectedColor)
                    }
                    aria-label={`Remove ${item.name}`}
                    className="p-2 text-zinc-400 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 bg-white border border-zinc-200 p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#09090B]">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm border-b border-zinc-100 pb-4">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatBdt(cartSubtotalBdt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Dhaka Courier Estimate</span>
                <span className="font-mono font-medium tabular-nums">
                  {estimatedShipping === 0 ? 'Complimentary' : formatBdt(estimatedShipping)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#09090B]">Estimated Total</span>
              <span className="font-mono text-xl font-semibold text-[#09090B] tabular-nums">
                {formatBdt(cartSubtotalBdt + estimatedShipping)}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Complimentary insured delivery inside Dhaka on orders above ৳25,000.
            </p>
            <button
              type="button"
              onClick={() => navigate({ page: 'checkout' })}
              className="w-full py-3.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const {
    cart,
    cartSubtotalBdt,
    user,
    userProfile,
    signInWithGoogle,
    placeOrder,
    navigate,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [shippingAddress, setShippingAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || userProfile?.displayName || user.displayName || '');
      setCustomerEmail((prev) => prev || userProfile?.email || user.email || '');
      setCustomerPhone((prev) => prev || userProfile?.phone || '');
      setCity((prev) => prev || userProfile?.city || 'Dhaka');
      setShippingAddress((prev) => prev || userProfile?.address || '');
      setPostalCode((prev) => prev || userProfile?.postalCode || '');
    }
  }, [user, userProfile]);

  const isDhaka = city.trim().toLowerCase().includes('dhaka');
  const shippingBdt = cartSubtotalBdt >= 25000 ? 0 : isDhaka ? 150 : 300;
  const totalBdt = cartSubtotalBdt + shippingBdt;

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white border border-zinc-200 p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em]">Order Recorded</p>
              <h1 className="font-display text-3xl font-semibold text-[#09090B]">
                Order {confirmedOrder.orderNumber}
              </h1>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Payment Method</span>
              <span className="font-semibold text-[#09090B]">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Payment Verification Status</span>
              <span className="font-mono text-xs font-semibold text-amber-700">
                {confirmedOrder.paymentStatus === 'cod_pending'
                  ? 'Cash on Delivery (Pay Upon Receipt)'
                  : 'Pending Merchant Payment Gateway'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Order Total</span>
              <span className="font-mono font-semibold text-[#09090B] tabular-nums">
                {formatBdt(confirmedOrder.totalBdt)}
              </span>
            </div>
          </div>

          {confirmedOrder.paymentStatus === 'pending_gateway' && (
            <div className="border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
              Your order has been securely logged with status <strong>Pending Gateway Verification</strong>. Live {confirmedOrder.paymentMethod} payment processing requires merchant API credentials in production; our concierge can also arrange COD confirmation.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'orders' })}
              className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop', division: 'all' })}
              className="px-6 py-3 border border-zinc-300 text-xs font-semibold uppercase tracking-wider"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        postalCode,
        paymentMethod,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Bangladesh BDT Checkout</p>
        <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
          Client Delivery & Settlement
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-10 text-center space-y-4">
          <p className="text-sm text-zinc-600">Add items to your bag before checking out.</p>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop', division: 'all' })}
            className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Explore Catalog
          </button>
        </div>
      ) : !user ? (
        <div className="bg-white border border-zinc-200 p-8 max-w-xl space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Sign In Required for Order Tracking
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Sign in with Google so your order receipt, delivery tracking, and AYAN AI order lookup stay securely bound to your private customer account.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 bg-white border border-zinc-200 p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-2xl font-semibold text-[#09090B]">
              1. Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C8A252]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Phone Number (Bangladesh)
                </label>
                <input
                  type="tel"
                  required
                  minLength={6}
                  placeholder="+880 1XXX-XXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C8A252]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C8A252]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  City / Division
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#C8A252]"
                >
                  <option value="Dhaka">Dhaka Metro</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barishal">Barishal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Full Street Address
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  placeholder="House, Road, Block / Sector, Area"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C8A252]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1212"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C8A252]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                2. Payment Method (Bangladesh BDT)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: 'COD' as const,
                      title: 'Cash on Delivery (COD)',
                      desc: 'Pay in BDT upon insured courier arrival.',
                    },
                    {
                      id: 'bKash' as const,
                      title: 'bKash (Gateway-Ready)',
                      desc: 'Requires merchant bKash API credentials to charge.',
                    },
                    {
                      id: 'Nagad' as const,
                      title: 'Nagad (Gateway-Ready)',
                      desc: 'Requires merchant Nagad API credentials to charge.',
                    },
                    {
                      id: 'SSLCommerz' as const,
                      title: 'SSLCommerz (Cards / MFS)',
                      desc: 'Requires SSLCommerz store credentials to charge.',
                    },
                  ] as const
                ).map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 border text-left transition-colors ${
                      paymentMethod === method.id
                        ? 'border-[#09090B] bg-zinc-50'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#09090B]">{method.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{method.desc}</p>
                  </button>
                ))}
              </div>

              {paymentMethod !== 'COD' && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Honest Gateway Notice: {paymentMethod} merchant credentials are not yet connected in this deployment. Placing this order will record it as <strong>Pending Gateway Verification</strong> rather than simulating a completed online payment.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#09090B]">
              Order Summary
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#09090B] truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.selectedSize} · {item.selectedColor} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums shrink-0">
                    {formatBdt(item.priceBdt * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-mono tabular-nums">{formatBdt(cartSubtotalBdt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Delivery ({city})</span>
                <span className="font-mono tabular-nums">
                  {shippingBdt === 0 ? 'Complimentary' : formatBdt(shippingBdt)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-100 font-semibold text-base">
                <span>Total (BDT)</span>
                <span className="font-mono tabular-nums">{formatBdt(totalBdt)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Recording Order...' : 'Place Order'}
            </button>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-[#9E7B31] shrink-0" />
              <span>Single-vendor direct fulfillment by NOSIF WORLDS.</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
