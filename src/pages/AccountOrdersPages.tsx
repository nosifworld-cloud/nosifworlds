import React, { useEffect, useState } from 'react';
import { LogOut, Package, Shield, User as UserIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { ProductCard } from '../components/ProductCard';

export function AccountPage() {
  const {
    user,
    authReady,
    isAdmin,
    userProfile,
    signInWithGoogle,
    signOutUser,
    updateUserProfile,
    products,
    wishlistIds,
    myOrders,
    navigate,
  } = useStore();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setCity(userProfile.city || 'Dhaka');
      setAddress(userProfile.address || '');
      setPostalCode(userProfile.postalCode || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, userProfile]);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (!authReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-zinc-500">
        Verifying client session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="bg-white border border-zinc-200 p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Client Access</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#09090B]">
              Sign In to NOSIF WORLDS
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Sign in with Google to manage your saved Bangladesh delivery profile, wishlist, verified reviews, and private order ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full py-3.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({ displayName, phone, city, address, postalCode });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#09090B] text-[#C8A252] flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9E7B31]">Client Profile</p>
            <h1 className="font-display text-3xl font-semibold text-[#09090B]">
              {user.displayName || user.email}
            </h1>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ page: 'orders' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-300 text-xs font-semibold uppercase tracking-wider hover:border-[#09090B]"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders ({myOrders.length})</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate({ page: 'admin' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => signOutUser()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Private Delivery Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-zinc-200 p-6 sm:p-8 max-w-3xl space-y-5"
      >
        <h2 className="font-display text-2xl font-semibold text-[#09090B]">
          Saved Shipping Preferences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1XXX-XXXXXX"
              className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Road, Block, Dhaka"
              className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

      {/* Wishlist */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-[#09090B]">
            Saved Wishlist ({wishlistProducts.length})
          </h2>
          <button
            type="button"
            onClick={() => navigate({ page: 'wishlist' })}
            className="text-xs font-semibold uppercase tracking-wider text-[#9E7B31] hover:underline"
          >
            Open Dedicated Wishlist View
          </button>
        </div>
        {wishlistProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Tap the heart icon on any piece across the catalog to curate your private wishlist.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {wishlistProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function OrdersPage() {
  const { user, myOrders, signInWithGoogle, navigate } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Order Ledger</p>
        <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
          My Orders
        </h1>
      </div>

      {!user ? (
        <div className="bg-white border border-zinc-200 p-8 max-w-xl space-y-4">
          <p className="text-sm text-zinc-600">
            Sign in with Google to view your authenticated NOSIF WORLDS orders and fulfillment status.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Sign In with Google
          </button>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-10 text-center space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            No orders placed yet
          </h2>
          <p className="text-sm text-zinc-600">
            Once you complete checkout, your BDT order receipts and live dispatch updates appear here.
          </p>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop', division: 'all' })}
            className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map((order) => (
            <div key={order.id} className="bg-white border border-zinc-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-[#09090B]">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Placed {new Date(order.createdAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })} · {order.city}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span>
                    Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus.replace('_', ' ')})
                  </span>
                  <span className="uppercase font-semibold text-[#9E7B31]">
                    Status: {order.fulfillmentStatus}
                  </span>
                  <span className="font-mono text-base font-semibold text-[#09090B] tabular-nums">
                    {formatBdt(order.totalBdt)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-zinc-700">
                    <span>
                      {item.name} ({item.selectedSize}, {item.selectedColor}) × {item.quantity}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatBdt(item.priceBdt * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <div className="pt-3 border-t border-zinc-100 text-xs text-zinc-600">
                  <span className="font-semibold text-[#09090B]">Delivery Note:</span>{' '}
                  {order.specialInstructions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
