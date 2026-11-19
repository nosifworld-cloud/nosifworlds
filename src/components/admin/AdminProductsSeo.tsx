import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Copy,
  Database,
  Edit3,
  Globe,
  History,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatBdt } from '../../data/catalog';
import {
  CategoryItem,
  Division,
  Product,
  ProductStatus,
  StockHistoryEntry,
  StoreSettings,
} from '../../types';
import { LuxuryImage } from '../BrandLogo';
import {
  computeProductSeoScore,
  STUDIO_IMAGES,
  uploadImageFileToServer,
} from './adminUtils';

interface AdminProductsStockProps {
  products: Product[];
  categories: CategoryItem[];
  stockHistory: StockHistoryEntry[];
  storeSettings: StoreSettings;
  productsFromDb: boolean;
  openAddTrigger?: number;
  onSeedCatalog: () => Promise<void>;
  onSaveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'> & { isEdit?: boolean }) => Promise<void>;
  onDuplicateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onAdjustStock: (product: Product, newStock: number, reason: string) => Promise<void>;
}

const EMPTY_PRODUCT_FORM = {
  id: '',
  sku: '',
  name: '',
  brand: 'NOSIF WORLDS',
  division: 'fashion' as Division,
  category: "Men's Fashion",
  subcategory: '',
  priceBdt: '',
  compareAtBdt: '',
  description: '',
  imageUrl: STUDIO_IMAGES[1].url,
  galleryUrls: [STUDIO_IMAGES[1].url],
  sizes: 'S, M, L, XL',
  colors: 'Obsidian Black, Brushed Gold',
  specs: '',
  tags: 'luxury, exclusive',
  stock: '10',
  featured: true,
  isNewArrival: true,
  isBestSeller: false,
  status: 'active' as ProductStatus,
};

export function AdminProductsStock({
  products,
  categories,
  stockHistory,
  storeSettings,
  productsFromDb,
  openAddTrigger = 0,
  onSeedCatalog,
  onSaveProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onAdjustStock,
}: AdminProductsStockProps) {
  const [subTab, setSubTab] = useState<'catalog' | 'alerts' | 'history'>('catalog');
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'all' | Division>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [galleryInput, setGalleryInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [customStockEdit, setCustomStockEdit] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (openAddTrigger > 0) {
      openAddModal();
    }
  }, [openAddTrigger]);

  const threshold = storeSettings.lowStockThreshold ?? 5;

  const openAddModal = () => {
    setIsEditing(false);
    setForm({
      ...EMPTY_PRODUCT_FORM,
      id: `nw-prod-${Date.now().toString(36)}`,
      sku: `NW-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setIsEditing(true);
    setForm({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand || 'NOSIF WORLDS',
      division: p.division,
      category: p.category,
      subcategory: p.subcategory || '',
      priceBdt: String(p.priceBdt),
      compareAtBdt: p.compareAtBdt ? String(p.compareAtBdt) : '',
      description: p.description,
      imageUrl: p.imageUrl,
      galleryUrls: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : [p.imageUrl],
      sizes: p.sizes.join(', '),
      colors: p.colors.join(', '),
      specs: (p.specs || []).join(', '),
      tags: (p.tags || []).join(', '),
      stock: String(p.stock),
      featured: p.featured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      status: p.status || 'active',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    asGallery = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError(null);
    try {
      const url = await uploadImageFileToServer(file);
      if (asGallery) {
        setForm((prev) => ({
          ...prev,
          galleryUrls: Array.from(new Set([...prev.galleryUrls, url])).slice(0, 12),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          imageUrl: url,
          galleryUrls: Array.from(new Set([url, ...prev.galleryUrls])).slice(0, 12),
        }));
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.name.trim().length < 2) {
      setFormError('Product name must be at least 2 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      setFormError('Description must be at least 10 characters.');
      return;
    }
    setSaving(true);
    try {
      const cleanId = (form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        .replace(/[^a-zA-Z0-9_\-]/g, '-')
        .slice(0, 128);
      await onSaveProduct({
        id: cleanId,
        sku: form.sku.trim() || `NW-${Date.now().toString(36).toUpperCase()}`,
        name: form.name.trim(),
        brand: form.brand.trim() || 'NOSIF WORLDS',
        division: form.division,
        category: form.category.trim(),
        subcategory: form.subcategory.trim(),
        priceBdt: Number(form.priceBdt) || 0,
        compareAtBdt: form.compareAtBdt ? Number(form.compareAtBdt) : undefined,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        galleryUrls: form.galleryUrls.length > 0 ? form.galleryUrls : [form.imageUrl.trim()],
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        specs: form.specs.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        stock: Math.max(0, Math.round(Number(form.stock) || 0)),
        featured: form.featured,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        status: form.status,
        isEdit: isEditing,
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (divisionFilter !== 'all' && p.division !== divisionFilter) return false;
      if (stockFilter === 'in' && p.stock <= 0) return false;
      if (stockFilter === 'low' && (p.stock <= 0 || p.stock > threshold)) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;
      if (stockFilter === 'inactive' && p.status !== 'inactive' && p.status !== 'draft') return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.category} ${p.brand || ''} ${p.subcategory || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, divisionFilter, stockFilter, threshold]);

  const alertProducts = useMemo(
    () => products.filter((p) => p.stock <= threshold).sort((a, b) => a.stock - b.stock),
    [products, threshold],
  );

  const divisionCategories = useMemo(
    () => categories.filter((c) => c.division === form.division),
    [categories, form.division],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#09090B]">Products &amp; Stock Control</h1>
          <p className="text-sm text-zinc-500">
            Manage luxury Fashion &amp; Electronics products, gallery media, variants, real-time stock alerts, and inventory logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!productsFromDb && (
            <button
              type="button"
              disabled={seeding}
              onClick={async () => {
                setSeeding(true);
                try {
                  await onSeedCatalog();
                } finally {
                  setSeeding(false);
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? 'Syncing...' : 'Sync Initial Catalog to Firestore'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] text-xs font-bold shadow-xs hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="inline-flex bg-white border border-zinc-200 rounded-xl p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('catalog')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
            subTab === 'catalog' ? 'bg-[#09090B] text-white' : 'text-zinc-600 hover:text-[#09090B]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Product Catalog ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('alerts')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
            subTab === 'alerts' ? 'bg-[#09090B] text-white' : 'text-zinc-600 hover:text-[#09090B]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Low &amp; Out of Stock ({alertProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
            subTab === 'history' ? 'bg-[#09090B] text-white' : 'text-zinc-600 hover:text-[#09090B]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Stock History ({stockHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: Product Catalog */}
      {subTab === 'catalog' && (
        <>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, brand, category..."
                className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A252]"
              />
            </div>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value as 'all' | Division)}
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white"
            >
              <option value="all">All Divisions</option>
              <option value="fashion">Fashion Store</option>
              <option value="electronics">Electronics Store</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(e.target.value as 'all' | 'in' | 'low' | 'out' | 'inactive')
              }
              className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white"
            >
              <option value="all">All Availability</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock (≤ {threshold})</option>
              <option value="out">Out of Stock (0)</option>
              <option value="inactive">Inactive / Draft</option>
            </select>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (BDT)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProducts.map((product) => {
                    const isOut = product.stock <= 0;
                    const isLow = product.stock > 0 && product.stock <= threshold;
                    const prodStatus = product.status || 'active';

                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/70">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                              <LuxuryImage
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#09090B] truncate max-w-[230px]">
                                {product.name}
                              </p>
                              <p className="font-mono text-[11px] text-zinc-500">
                                {product.sku} · {product.brand || 'NOSIF WORLDS'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="capitalize font-medium text-[#09090B]">
                            {product.division}
                          </span>
                          <p className="text-[11px] text-zinc-500">
                            {product.category}
                            {product.subcategory ? ` / ${product.subcategory}` : ''}
                          </p>
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                          <p className="font-bold text-[#09090B]">{formatBdt(product.priceBdt)}</p>
                          {product.compareAtBdt && product.compareAtBdt > product.priceBdt && (
                            <p className="text-[11px] text-zinc-400 line-through">
                              {formatBdt(product.compareAtBdt)}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold border ${
                              isOut
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isLow
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isOut ? 'Out of Stock (0)' : `${product.stock} units`}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap space-y-1">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                              prodStatus === 'active'
                                ? 'bg-zinc-900 text-[#E5BC64] border-zinc-800'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            {prodStatus}
                          </span>
                          {product.featured && (
                            <p className="text-[10px] font-semibold text-[#9E7B31]">Featured</p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {confirmDeleteId === product.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteProduct(product.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-[11px] text-zinc-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                title="Edit product"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5D687] hover:bg-[#E5BC64] text-[#09090B] font-semibold"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicateProduct(product)}
                                title="Duplicate product as draft"
                                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-[#C8A252] hover:text-[#09090B]"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
                                title="Delete product"
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Low & Out-of-Stock Alerts */}
      {subTab === 'alerts' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#09090B]">
                Low Stock &amp; Out-of-Stock Replenishment Queue
              </h2>
              <p className="text-xs text-zinc-500">
                Showing items with stock ≤ {threshold} units (configured in Settings). Adjust directly to restock and record in Stock History.
              </p>
            </div>
          </div>

          {alertProducts.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500">
              All catalog products are currently healthy above your {threshold}-unit threshold.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {alertProducts.map((p) => {
                const draftVal = customStockEdit[p.id] ?? String(p.stock);
                return (
                  <div
                    key={p.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                        <LuxuryImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#09090B] truncate">{p.name}</p>
                        <p className="font-mono text-[11px] text-zinc-500">
                          {p.sku} · Current:{' '}
                          <span className={p.stock <= 0 ? 'text-red-700 font-bold' : 'text-amber-700 font-bold'}>
                            {p.stock} units
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={draftVal}
                        onChange={(e) =>
                          setCustomStockEdit((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="w-20 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onAdjustStock(p, Math.max(0, Number(draftVal) || 0), 'Admin stock replenishment')
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#09090B] text-white text-xs font-semibold hover:bg-[#C8A252] hover:text-[#09090B]"
                      >
                        Update Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustStock(p, p.stock + 10, 'Quick +10 restock')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FDF6E7] border border-[#E5BC64]/50 text-[#8C6818] text-xs font-semibold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Stock History Audit Log */}
      {subTab === 'history' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          {stockHistory.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              No stock movements logged yet. Stock adjustments, confirmed orders, and cancellations appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Product &amp; SKU</th>
                    <th className="py-3 px-4">Delta</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stockHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('en-BD', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#09090B]">{entry.productName}</p>
                        <p className="font-mono text-[11px] text-zinc-400">{entry.sku}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">
                        <span className={entry.change >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {entry.change >= 0 ? `+${entry.change}` : entry.change}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700 tabular-nums">
                        {entry.previousStock} → <strong>{entry.newStock}</strong>
                      </td>
                      <td className="py-3 px-4 text-zinc-700">{entry.reason}</td>
                      <td className="py-3 px-4 text-zinc-500">{entry.actorEmail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSave}
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-[#09090B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#E5BC64]">
                  NOSIF WORLDS Catalog
                </p>
                <h2 className="text-lg font-bold">
                  {isEditing ? `Edit Product: ${form.name}` : 'Add New Luxury Product'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg border border-white/20 text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="font-semibold text-zinc-600 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Division *</label>
                  <select
                    value={form.division}
                    onChange={(e) => setForm({ ...form, division: e.target.value as Division })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="fashion">Fashion Store</option>
                    <option value="electronics">Electronics Store</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Category *</label>
                  <input
                    list="admin-category-options"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                  <datalist id="admin-category-options">
                    {divisionCategories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    placeholder="e.g. Tailoring, ANC Audio"
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.priceBdt}
                    onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">
                    Compare-At / Original Price (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.compareAtBdt}
                    onChange={(e) => setForm({ ...form, compareAtBdt: e.target.value })}
                    placeholder="Optional strikethrough price"
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Visibility Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="active">Active (Live on Storefront)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-600 block mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Sizes / Editions</label>
                  <input
                    type="text"
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Colors / Finishes</label>
                  <input
                    type="text"
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-600 block mb-1">Specs (comma-separated)</label>
                  <input
                    type="text"
                    value={form.specs}
                    onChange={(e) => setForm({ ...form, specs: e.target.value })}
                    className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Primary Image + Upload + Studio Presets */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#09090B]">Primary Image &amp; Gallery Media</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#09090B] text-white cursor-pointer hover:bg-[#1C1C1F]">
                      <Upload className="w-3.5 h-3.5 text-[#E5BC64]" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Main Image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, false)}
                      />
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[#09090B] cursor-pointer hover:border-[#C8A252]">
                      <ImagePlus className="w-3.5 h-3.5 text-[#9E7B31]" />
                      <span>Add Gallery Photo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, true)}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Primary Image URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Studio Photography Preset
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setForm((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                          galleryUrls: Array.from(new Set([e.target.value, ...prev.galleryUrls])).slice(
                            0,
                            12,
                          ),
                        }));
                      }}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Choose studio preset...</option>
                      {STUDIO_IMAGES.map((img) => (
                        <option key={img.url} value={img.url}>
                          {img.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gallery URLs */}
                <div className="flex flex-wrap gap-2 items-center">
                  {form.galleryUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="relative w-16 h-12 rounded-lg overflow-hidden border border-zinc-300 bg-white group"
                    >
                      <LuxuryImage src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            galleryUrls: prev.galleryUrls.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Remove gallery photo"
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="text"
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      placeholder="Paste additional photo URL..."
                      className="border border-zinc-300 rounded-lg px-2.5 py-1.5 bg-white font-mono w-48"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!galleryInput.trim()) return;
                        setForm((prev) => ({
                          ...prev,
                          galleryUrls: Array.from(
                            new Set([...prev.galleryUrls, galleryInput.trim()]),
                          ).slice(0, 12),
                        }));
                        setGalleryInput('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white font-semibold"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Merchandising Flags */}
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="accent-[#09090B]"
                  />
                  <span>Featured Product</span>
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                    className="accent-[#09090B]"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                    className="accent-[#09090B]"
                  />
                  <span>Best Seller</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
                >
                  {saving ? 'Saving to Firestore...' : isEditing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface AdminProductSeoProps {
  products: Product[];
  onSaveSeo: (
    productId: string,
    seo: {
      seoTitle: string;
      metaDescription: string;
      focusKeyword: string;
      slug: string;
      imageAlt: string;
      ogImageUrl: string;
    },
  ) => Promise<void>;
}

export function AdminProductSeo({ products, onSaveSeo }: AdminProductSeoProps) {
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id || '');
  const [search, setSearch] = useState('');
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) || products[0] || null,
    [products, selectedId],
  );

  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [slug, setSlug] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (selectedProduct) {
      setSeoTitle(selectedProduct.seoTitle || `${selectedProduct.name} | NOSIF WORLDS`);
      setMetaDescription(selectedProduct.metaDescription || selectedProduct.description.slice(0, 155));
      setFocusKeyword(selectedProduct.focusKeyword || selectedProduct.name.split(' ').slice(0, 3).join(' '));
      setSlug(selectedProduct.slug || selectedProduct.id);
      setImageAlt(selectedProduct.imageAlt || selectedProduct.name);
      setOgImageUrl(selectedProduct.ogImageUrl || selectedProduct.imageUrl);
    }
  }, [selectedProduct?.id]);

  const liveScore = useMemo(
    () =>
      computeProductSeoScore({
        id: selectedProduct?.id,
        name: selectedProduct?.name,
        description: selectedProduct?.description,
        imageUrl: selectedProduct?.imageUrl,
        seoTitle,
        metaDescription,
        focusKeyword,
        slug,
        imageAlt,
        ogImageUrl,
      }),
    [selectedProduct, seoTitle, metaDescription, focusKeyword, slug, imageAlt, ogImageUrl],
  );

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await onSaveSeo(selectedProduct.id, {
        seoTitle,
        metaDescription,
        focusKeyword,
        slug,
        imageAlt,
        ogImageUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#09090B]">Product SEO Studio</h1>
        <p className="text-sm text-zinc-500">
          Optimize search engine titles, meta descriptions, slugs, image alt tags, and inspect live Google SERP previews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Product Selector List */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter products..."
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs"
            />
          </div>

          <div className="max-h-[540px] overflow-y-auto divide-y divide-zinc-100">
            {filteredList.map((p) => {
              const res = computeProductSeoScore(p);
              const active = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left py-3 px-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                    active ? 'bg-[#FDF6E7] border border-[#E5BC64]/60' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                      <LuxuryImage src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#09090B] truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{p.sku}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                      res.score >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : res.score >= 50
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {res.score}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEO Editor + Live SERP Preview */}
        {selectedProduct && (
          <form
            onSubmit={handleSave}
            className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#9E7B31] font-semibold">
                  Editing SEO Metadata
                </p>
                <h2 className="text-lg font-bold text-[#09090B]">{selectedProduct.name}</h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200">
                <Sparkles className="w-4 h-4 text-[#C8A252]" />
                <span className="font-semibold text-zinc-600">SEO Score:</span>
                <span
                  className={`font-mono text-base font-bold ${
                    liveScore.score >= 80
                      ? 'text-emerald-700'
                      : liveScore.score >= 50
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }`}
                >
                  {liveScore.score}/100
                </span>
              </div>
            </div>

            {/* Google Search SERP Live Preview */}
            <div className="bg-[#FAFAFB] border border-zinc-200 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Globe className="w-3.5 h-3.5 text-[#9E7B31]" />
                <span>Live Search Engine Snippet Preview</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-mono truncate">
                https://nosifworlds.com/product/{slug || selectedProduct.id}
              </p>
              <p className="text-base font-medium text-[#1A0DAB] leading-snug">
                {seoTitle || selectedProduct.name}
              </p>
              <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                {metaDescription || selectedProduct.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-zinc-600">SEO Title</label>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {seoTitle.length} / 65 recommended
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={160}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-zinc-600">Meta Description</label>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {metaDescription.length} / 160 recommended
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={320}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-600 block mb-1">Focus Keyword</label>
                <input
                  type="text"
                  maxLength={80}
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-600 block mb-1">URL Slug</label>
                <input
                  type="text"
                  maxLength={140}
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-'))
                  }
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-600 block mb-1">Image Alt Text</label>
                <input
                  type="text"
                  maxLength={200}
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-600 block mb-1">OG Social Image URL</label>
                <input
                  type="text"
                  maxLength={1000}
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            {/* SEO Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {liveScore.checks.map((chk) => (
                <div
                  key={chk.label}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border ${
                    chk.ok ? 'bg-emerald-50/50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      chk.ok ? 'text-emerald-600' : 'text-zinc-300'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-[#09090B]">{chk.label}</p>
                    <p className="text-[11px] text-zinc-500">{chk.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
              >
                {saving ? 'Saving SEO...' : 'Save SEO Metadata'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
