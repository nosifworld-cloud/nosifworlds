import React, { useState } from 'react';
import {
  Database,
  FileText,
  MessageSquare,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  ELECTRONICS_CATEGORIES,
  FASHION_CATEGORIES,
  formatBdt,
} from '../data/catalog';
import {
  Division,
  FulfillmentStatus,
  PaymentStatus,
  Product,
  SiteContent,
} from '../types';

type AdminTab = 'overview' | 'products' | 'orders' | 'reviews' | 'content' | 'ai';

const STUDIO_IMAGES = [
  { label: 'Hero Tailoring & Audio', url: '/src/assets/images/hero_nosif_luxury_1795002419948.jpg' },
  { label: "Men's Wool Blazer", url: '/src/assets/images/fashion_mens_tailoring_1795002419791.jpg' },
  { label: "Women's Silk & Tote", url: '/src/assets/images/fashion_womens_atelier_1795002420621.jpg' },
  { label: 'Titanium Chronograph', url: '/src/assets/images/fashion_chronograph_watch_1795002421589.jpg' },
  { label: 'Flagship ANC Headphones', url: '/src/assets/images/electronics_flagship_audio_1795002420781.jpg' },
  { label: 'Ultrabook & Smartphone', url: '/src/assets/images/electronics_ultrabook_phone_1795002421300.jpg' },
  { label: 'Chelsea Boots & Duffle', url: '/src/assets/images/fashion_leather_accessories_1795002422420.jpg' },
  { label: 'AMOLED Smart Watch & Buds', url: '/src/assets/images/electronics_smartwatch_gadget_1795002422403.jpg' },
];

export function AdminDashboardPage() {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    products,
    productsFromDb,
    allOrders,
    allReviews,
    allInquiries,
    allAiLogs,
    articles,
    siteContent,
    seedFirestoreCatalog,
    saveProduct,
    deleteProduct,
    updateOrderStatus,
    updateReviewStatus,
    deleteReview,
    saveSiteContent,
    saveArticle,
    deleteArticle,
    resolveInquiry,
    navigate,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pDivision, setPDivision] = useState<Division>('fashion');
  const [pCategory, setPCategory] = useState<string>("Men's Fashion");
  const [pPrice, setPPrice] = useState('25000');
  const [pStock, setPStock] = useState('10');
  const [pImageUrl, setPImageUrl] = useState(STUDIO_IMAGES[0].url);
  const [pDesc, setPDesc] = useState('');
  const [pSizes, setPSizes] = useState('S, M, L, XL');
  const [pColors, setPColors] = useState('Obsidian Black, Charcoal');
  const [pFeatured, setPFeatured] = useState(true);
  const [pNew, setPNew] = useState(true);
  const [pBest, setPBest] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Content Form State
  const [contentForm, setContentForm] = useState<SiteContent>(siteContent);
  const [savingContent, setSavingContent] = useState(false);

  // Article Form State
  const [artTitle, setArtTitle] = useState('');
  const [artCat, setArtCat] = useState('Fashion Craft');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artBody, setArtBody] = useState('');
  const [artImg, setArtImg] = useState(STUDIO_IMAGES[1].url);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="bg-white border border-zinc-200 p-8 space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Restricted Area</p>
          <h1 className="font-display text-3xl font-semibold text-[#09090B]">
            Authorized Administrator Access Only
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            This management suite is protected by Firebase Authentication and Firestore Security Rules. Only verified NOSIF WORLDS administrators may manage inventory, orders, reviews, and site content.
          </p>
          <div className="flex flex-wrap gap-3">
            {!user && (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-5 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Sign In with Admin Google Account
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="px-5 py-2.5 border border-zinc-300 text-xs font-semibold uppercase tracking-wider"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenueBdt = allOrders
    .filter((o) => o.fulfillmentStatus !== 'cancelled')
    .reduce((acc, o) => acc + o.totalBdt, 0);

  const loadProductForEdit = (p: Product) => {
    setEditingProductId(p.id);
    setPName(p.name);
    setPSku(p.sku);
    setPDivision(p.division);
    setPCategory(p.category);
    setPPrice(String(p.priceBdt));
    setPStock(String(p.stock));
    setPImageUrl(p.imageUrl);
    setPDesc(p.description);
    setPSizes(p.sizes.join(', '));
    setPColors(p.colors.join(', '));
    setPFeatured(p.featured);
    setPNew(p.isNewArrival);
    setPBest(p.isBestSeller);
    setTab('products');
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPName('');
    setPSku('');
    setPPrice('25000');
    setPStock('10');
    setPDesc('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length <= 950) {
        setPImageUrl(reader.result);
      } else {
        // Resize to compact JPEG under 900 chars or guide URL usage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 48;
          canvas.height = 36;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, 48, 36);
          const smallData = canvas.toDataURL('image/jpeg', 0.6);
          setPImageUrl(smallData.slice(0, 990));
        };
        if (typeof reader.result === 'string') img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const id =
        editingProductId ||
        `nw-${pName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 40)}-${Date.now().toString(36)}`;
      await saveProduct({
        id,
        sku: pSku || `NW-${Date.now().toString().slice(-4)}`,
        name: pName,
        division: pDivision,
        category: pCategory,
        priceBdt: Number(pPrice) || 0,
        description: pDesc,
        imageUrl: pImageUrl,
        sizes: pSizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: pColors
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        stock: Number(pStock) || 0,
        featured: pFeatured,
        isNewArrival: pNew,
        isBestSeller: pBest,
      });
      resetProductForm();
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `art-${Date.now().toString(36)}`;
    await saveArticle({
      id,
      title: artTitle,
      category: artCat,
      excerpt: artExcerpt,
      body: artBody,
      imageUrl: artImg,
      readTime: '4 min read',
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
    setArtTitle('');
    setArtExcerpt('');
    setArtBody('');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Database className="w-4 h-4" /> },
    { id: 'products', label: 'Products & Stock', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { id: 'content', label: 'Content & Journal', icon: <FileText className="w-4 h-4" /> },
    { id: 'ai', label: 'Inquiries & AYAN AI', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          <div className="bg-[#09090B] text-white p-5 mb-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A252]">
              Admin Suite
            </p>
            <h1 className="font-display text-2xl font-semibold mt-1">NOSIF WORLDS</h1>
            <p className="text-xs text-zinc-400 mt-1 truncate">{user.email}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                  tab === item.id
                    ? 'bg-[#09090B] text-white border-[#09090B]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#C8A252]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Admin / Overview
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-[#09090B]">
                    Storefront Operations
                  </h2>
                </div>
                {!productsFromDb && (
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={async () => {
                      setSeeding(true);
                      try {
                        await seedFirestoreCatalog();
                      } finally {
                        setSeeding(false);
                      }
                    }}
                    className="px-5 py-2.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664]"
                  >
                    {seeding ? 'Seeding Firestore...' : 'Seed Default Catalog to Firestore'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Gross Order Value', value: formatBdt(totalRevenueBdt) },
                  { label: 'Total Orders', value: String(allOrders.length) },
                  { label: 'Active Products', value: String(products.length) },
                  { label: 'Open Inquiries', value: String(allInquiries.filter((i) => i.status === 'open').length) },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white border border-zinc-200 p-5">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">{kpi.label}</p>
                    <p className="font-mono text-2xl font-semibold text-[#09090B] mt-2 tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-zinc-200 p-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold text-[#09090B]">
                  Recent Customer Orders
                </h3>
                {allOrders.length === 0 ? (
                  <p className="text-sm text-zinc-500">No customer orders recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 uppercase">
                          <th className="py-2.5 pr-4">Order</th>
                          <th className="py-2.5 pr-4">Client</th>
                          <th className="py-2.5 pr-4">Payment</th>
                          <th className="py-2.5 pr-4">Status</th>
                          <th className="py-2.5 text-right">Total (BDT)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrders.slice(0, 8).map((o) => (
                          <tr key={o.id} className="border-b border-zinc-100">
                            <td className="py-3 pr-4 font-mono font-semibold">{o.orderNumber}</td>
                            <td className="py-3 pr-4">{o.customerName}</td>
                            <td className="py-3 pr-4">
                              {o.paymentMethod} ({o.paymentStatus})
                            </td>
                            <td className="py-3 pr-4 uppercase">{o.fulfillmentStatus}</td>
                            <td className="py-3 text-right font-mono tabular-nums">
                              {formatBdt(o.totalBdt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCTS & INVENTORY */}
          {tab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white border border-zinc-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-xs font-semibold text-zinc-500 hover:text-[#09090B]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      required
                      value={pSku}
                      onChange={(e) => setPSku(e.target.value)}
                      placeholder="NW-FSH-201"
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Division
                    </label>
                    <select
                      value={pDivision}
                      onChange={(e) => {
                        const div = e.target.value as Division;
                        setPDivision(div);
                        setPCategory(
                          div === 'fashion' ? FASHION_CATEGORIES[0] : ELECTRONICS_CATEGORIES[0],
                        );
                      }}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="fashion">Fashion</option>
                      <option value="electronics">Electronics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Category
                    </label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white"
                    >
                      {(pDivision === 'fashion' ? FASHION_CATEGORIES : ELECTRONICS_CATEGORIES).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Price (BDT)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Inventory Stock
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Available Sizes (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={pSizes}
                      onChange={(e) => setPSizes(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Available Colors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={pColors}
                      onChange={(e) => setPColors(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                        Studio Image Preset or URL
                      </label>
                      <select
                        value={pImageUrl}
                        onChange={(e) => setPImageUrl(e.target.value)}
                        className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white mb-2"
                      >
                        {STUDIO_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={pImageUrl}
                        onChange={(e) => setPImageUrl(e.target.value)}
                        className="w-full border border-zinc-300 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                        Upload Product Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="w-full text-xs text-zinc-600 border border-zinc-300 p-2 bg-zinc-50"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      minLength={10}
                      rows={3}
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-5 text-xs font-medium">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pFeatured}
                        onChange={(e) => setPFeatured(e.target.checked)}
                      />
                      <span>Featured</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pNew}
                        onChange={(e) => setPNew(e.target.checked)}
                      />
                      <span>New Arrival</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pBest}
                        onChange={(e) => setPBest(e.target.checked)}
                      />
                      <span>Best Seller</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Ledger */}
              <div className="bg-white border border-zinc-200 p-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold text-[#09090B]">
                  Catalog Inventory ({products.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 uppercase">
                        <th className="py-2.5 pr-4">SKU</th>
                        <th className="py-2.5 pr-4">Name</th>
                        <th className="py-2.5 pr-4">Category</th>
                        <th className="py-2.5 pr-4 text-right">Stock</th>
                        <th className="py-2.5 pr-4 text-right">Price</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-zinc-100">
                          <td className="py-3 pr-4 font-mono">{p.sku}</td>
                          <td className="py-3 pr-4 font-medium text-[#09090B]">{p.name}</td>
                          <td className="py-3 pr-4">
                            {p.division} / {p.category}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">{p.stock}</td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            {formatBdt(p.priceBdt)}
                          </td>
                          <td className="py-3 text-right space-x-3">
                            <button
                              type="button"
                              onClick={() => loadProductForEdit(p)}
                              className="text-[#9E7B31] font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              className="text-red-700 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            <div className="bg-white border border-zinc-200 p-6 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                Manage Customer Orders ({allOrders.length})
              </h2>
              {allOrders.length === 0 ? (
                <p className="text-sm text-zinc-500">No orders placed yet.</p>
              ) : (
                <div className="space-y-4">
                  {allOrders.map((o) => (
                    <div key={o.id} className="border border-zinc-200 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                          <p className="text-xs text-zinc-500">
                            {o.customerName} · {o.customerPhone} · {o.shippingAddress}, {o.city}
                          </p>
                        </div>
                        <span className="font-mono text-base font-semibold tabular-nums">
                          {formatBdt(o.totalBdt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
                        <label className="flex items-center gap-2">
                          <span className="text-zinc-500">Fulfillment:</span>
                          <select
                            value={o.fulfillmentStatus}
                            onChange={(e) =>
                              updateOrderStatus(o.id, {
                                fulfillmentStatus: e.target.value as FulfillmentStatus,
                                paymentStatus: o.paymentStatus,
                              })
                            }
                            className="border border-zinc-300 px-2 py-1 bg-white"
                          >
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                              (st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="text-zinc-500">Payment ({o.paymentMethod}):</span>
                          <select
                            value={o.paymentStatus}
                            onChange={(e) =>
                              updateOrderStatus(o.id, {
                                fulfillmentStatus: o.fulfillmentStatus,
                                paymentStatus: e.target.value as PaymentStatus,
                              })
                            }
                            className="border border-zinc-300 px-2 py-1 bg-white"
                          >
                            {['pending_gateway', 'cod_pending', 'verified', 'failed'].map((ps) => (
                              <option key={ps} value={ps}>
                                {ps}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {tab === 'reviews' && (
            <div className="bg-white border border-zinc-200 p-6 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                Moderate Customer Reviews ({allReviews.length})
              </h2>
              {allReviews.length === 0 ? (
                <p className="text-sm text-zinc-500">No Firestore-persisted reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {allReviews.map((rev) => (
                    <div key={rev.id} className="border border-zinc-200 p-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">
                          {rev.authorName} · {rev.productName} · {rev.rating}/5
                        </p>
                        <p className="text-sm font-semibold text-[#09090B]">{rev.title}</p>
                        <p className="text-xs text-zinc-600">{rev.comment}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={rev.status}
                          onChange={(e) =>
                            updateReviewStatus(
                              rev.id,
                              e.target.value as 'approved' | 'pending' | 'hidden',
                            )
                          }
                          className="border border-zinc-300 px-2 py-1 text-xs bg-white"
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="hidden">Hidden</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteReview(rev.id)}
                          aria-label="Delete review"
                          className="p-1.5 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTENT & JOURNAL */}
          {tab === 'content' && (
            <div className="space-y-8">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingContent(true);
                  try {
                    await saveSiteContent(contentForm);
                  } finally {
                    setSavingContent(false);
                  }
                }}
                className="bg-white border border-zinc-200 p-6 space-y-4"
              >
                <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                  Website Copy & Contact Placeholders
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Hero Eyebrow
                    </label>
                    <input
                      type="text"
                      value={contentForm.heroEyebrow}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, heroEyebrow: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Top Offer Banner
                    </label>
                    <input
                      type="text"
                      value={contentForm.offerBanner}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, offerBanner: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      value={contentForm.heroTitle}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, heroTitle: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Hero Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={contentForm.heroSubtitle}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, heroSubtitle: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Support Email
                    </label>
                    <input
                      type="text"
                      value={contentForm.supportEmail}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, supportEmail: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={contentForm.whatsappNumber}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, whatsappNumber: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-zinc-600 block mb-1">
                      Showroom Address
                    </label>
                    <input
                      type="text"
                      value={contentForm.showroomAddress}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, showroomAddress: e.target.value })
                      }
                      className="w-full border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingContent}
                  className="px-6 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {savingContent ? 'Saving...' : 'Save Storefront Content'}
                </button>
              </form>

              <div className="bg-white border border-zinc-200 p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                  Publish Journal Article
                </h2>
                <form onSubmit={handleSaveArticle} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      minLength={4}
                      placeholder="Article title"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      className="border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Category"
                      value={artCat}
                      onChange={(e) => setArtCat(e.target.value)}
                      className="border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <select
                    value={artImg}
                    onChange={(e) => setArtImg(e.target.value)}
                    className="w-full border border-zinc-300 px-3 py-2 text-sm bg-white"
                  >
                    {STUDIO_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    minLength={10}
                    placeholder="Short excerpt"
                    value={artExcerpt}
                    onChange={(e) => setArtExcerpt(e.target.value)}
                    className="w-full border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    required
                    minLength={20}
                    rows={4}
                    placeholder="Full article body"
                    value={artBody}
                    onChange={(e) => setArtBody(e.target.value)}
                    className="w-full border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Publish Article
                  </button>
                </form>

                <div className="pt-4 border-t border-zinc-100 space-y-2">
                  {articles.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100">
                      <span className="font-medium text-[#09090B]">{a.title}</span>
                      <button
                        type="button"
                        onClick={() => deleteArticle(a.id)}
                        className="text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INQUIRIES & AYAN AI LOGS */}
          {tab === 'ai' && (
            <div className="space-y-8">
              <div className="bg-white border border-zinc-200 p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                  Customer Support Inquiries ({allInquiries.length})
                </h2>
                {allInquiries.length === 0 ? (
                  <p className="text-sm text-zinc-500">No Firestore customer inquiries yet.</p>
                ) : (
                  <div className="space-y-3">
                    {allInquiries.map((inq) => (
                      <div key={inq.id} className="border border-zinc-200 p-4 flex justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-500">
                            {inq.name} ({inq.email}) · {inq.status}
                          </p>
                          <p className="text-sm font-semibold">{inq.subject}</p>
                          <p className="text-xs text-zinc-600">{inq.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            resolveInquiry(inq.id, inq.status === 'open' ? 'resolved' : 'open')
                          }
                          className="self-start px-3 py-1.5 border border-zinc-300 text-xs font-semibold"
                        >
                          {inq.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-zinc-200 p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#09090B]">
                  Authenticated AYAN AI Sessions ({allAiLogs.length})
                </h2>
                {allAiLogs.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No authenticated customer AI conversation logs recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {allAiLogs.map((log) => (
                      <div key={log.id} className="border border-zinc-200 p-4 space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-500">
                          <span>{log.customerEmail || log.userId}</span>
                          <span>
                            Lang: {log.language.toUpperCase()} · Turns: {log.messageCount}
                          </span>
                        </div>
                        <p className="text-[#09090B] font-medium">Prompt: {log.lastPrompt}</p>
                        <p className="text-zinc-600">AYAN AI: {log.lastReply}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
