import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Mail,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatBdt } from '../../data/catalog';
import {
  CategoryItem,
  Division,
  FulfillmentStatus,
  Order,
  PaymentStatus,
  Product,
  RefundStatus,
  StoreSettings,
  UserProfile,
} from '../../types';
import { LuxuryImage } from '../BrandLogo';
import {
  downloadCsvFile,
  FULFILLMENT_BADGE_CLASSES,
  FULFILLMENT_LABELS,
  PAYMENT_BADGE_CLASSES,
  PAYMENT_LABELS,
  STUDIO_IMAGES,
  uploadImageFileToServer,
} from './adminUtils';

/* ==================== CATEGORIES ==================== */
interface AdminCategoriesProps {
  categories: CategoryItem[];
  products: Product[];
  onSaveCategory: (cat: Omit<CategoryItem, 'updatedAt'>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function AdminCategories({
  categories,
  products,
  onSaveCategory,
  onDeleteCategory,
}: AdminCategoriesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division>('fashion');
  const [description, setDescription] = useState('');
  const [subcategoriesInput, setSubcategoriesInput] = useState('');
  const [imageUrl, setImageUrl] = useState(STUDIO_IMAGES[0].url);
  const [isVisible, setIsVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDivision(cat.division);
    setDescription(cat.description || '');
    setSubcategoriesInput((cat.subcategories || []).join(', '));
    setImageUrl(cat.imageUrl || STUDIO_IMAGES[0].url);
    setIsVisible(cat.isVisible !== false);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDivision('fashion');
    setDescription('');
    setSubcategoriesInput('');
    setImageUrl(STUDIO_IMAGES[0].url);
    setIsVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    try {
      const id =
        editingId ||
        `cat-${division}-${name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`;
      await onSaveCategory({
        id,
        name: name.trim(),
        division,
        description: description.trim(),
        subcategories: subcategoriesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: imageUrl.trim(),
        isVisible,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#09090B]">Category &amp; Subcategory Control</h1>
        <p className="text-sm text-zinc-500">
          Add, rename, organize subcategories, assign photography, and control storefront visibility in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#09090B]">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-zinc-500 hover:text-[#09090B]">
                Reset
              </button>
            )}
          </div>

          <div>
            <label className="font-semibold text-zinc-600 block mb-1">Category Name *</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fine Fragrances"
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-600 block mb-1">Division *</label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value as Division)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2 bg-white"
            >
              <option value="fashion">Fashion Store</option>
              <option value="electronics">Electronics Store</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-zinc-600 block mb-1">
              Subcategories (comma-separated)
            </label>
            <input
              type="text"
              value={subcategoriesInput}
              onChange={(e) => setSubcategoriesInput(e.target.value)}
              placeholder="e.g. Tailored Blazers, Wool Trousers"
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-600 block mb-1">Description</label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-600">Category Cover Image</label>
              <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white cursor-pointer">
                <Upload className="w-3 h-3 text-[#E5BC64]" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const url = await uploadImageFileToServer(file);
                      setImageUrl(url);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
            />
            <select
              value=""
              onChange={(e) => e.target.value && setImageUrl(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-1.5 bg-zinc-50"
            >
              <option value="">Or pick studio preset...</option>
              {STUDIO_IMAGES.map((img) => (
                <option key={img.url} value={img.url}>
                  {img.label}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 font-semibold text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="accent-[#09090B]"
            />
            <span>Visible on Storefront</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
          >
            {saving ? 'Saving...' : editingId ? 'Update Category' : 'Save Category'}
          </button>
        </form>

        {/* Categories List */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Subcategories</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.division === cat.division && p.category === cat.name,
                  ).length;
                  const visible = cat.isVisible !== false;
                  return (
                    <tr key={cat.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                            <LuxuryImage
                              src={cat.imageUrl || STUDIO_IMAGES[0].url}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-[#09090B]">{cat.name}</p>
                            {cat.description && (
                              <p className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-zinc-700">
                        {cat.division}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {cat.subcategories && cat.subcategories.length > 0
                          ? cat.subcategories.join(', ')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#09090B]">{count}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            onSaveCategory({
                              ...cat,
                              isVisible: !visible,
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            visible
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{visible ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-[#C8A252] hover:text-[#09090B]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== CUSTOMERS ==================== */
interface AdminCustomersProps {
  users: UserProfile[];
  orders: Order[];
  onOpenOrder: (order: Order) => void;
}

export function AdminCustomers({ users, orders, onOpenOrder }: AdminCustomersProps) {
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const enrichedCustomers = useMemo(() => {
    const map = new Map<
      string,
      {
        uid: string;
        name: string;
        email: string;
        phone: string;
        city: string;
        address: string;
        registeredAt: string;
        orders: Order[];
        totalSpendBdt: number;
      }
    >();

    for (const u of users) {
      map.set(u.uid, {
        uid: u.uid,
        name: u.displayName || 'NOSIF Client',
        email: u.email,
        phone: u.phone || '',
        city: u.city || 'Dhaka',
        address: u.address || '',
        registeredAt: u.createdAt || '',
        orders: [],
        totalSpendBdt: 0,
      });
    }

    for (const o of orders) {
      const existing = map.get(o.userId) || {
        uid: o.userId,
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        city: o.city,
        address: o.shippingAddress,
        registeredAt: o.createdAt,
        orders: [],
        totalSpendBdt: 0,
      };
      existing.orders.push(o);
      if (o.fulfillmentStatus !== 'cancelled') {
        existing.totalSpendBdt += o.totalBdt;
      }
      if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
      if (!existing.address && o.shippingAddress) existing.address = o.shippingAddress;
      map.set(o.userId, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpendBdt - a.totalSpendBdt);
  }, [users, orders]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enrichedCustomers;
    return enrichedCustomers.filter((c) =>
      `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q),
    );
  }, [enrichedCustomers, search]);

  const selectedCustomer = useMemo(
    () => enrichedCustomers.find((c) => c.uid === selectedUid) || null,
    [enrichedCustomers, selectedUid],
  );

  const handleExportCustomers = () => {
    const rows: string[][] = [
      ['Name', 'Email', 'Phone', 'City', 'Address', 'Total Orders', 'Total Spend (BDT)', 'Registered At'],
      ...filteredCustomers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.city,
        c.address,
        String(c.orders.length),
        String(c.totalSpendBdt),
        c.registeredAt ? new Date(c.registeredAt).toLocaleString('en-BD') : '',
      ]),
    ];
    downloadCsvFile(`nosif-worlds-customers-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#09090B]">Customer Directory</h1>
          <p className="text-sm text-zinc-500">
            Verified customer profiles, BDT lifetime purchase totals, and individual order history (passwords are never accessible or stored).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCustomers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#09090B] text-white text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5 text-[#E5BC64]" />
          <span>Export Customer CSV ({filteredCustomers.length})</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone, or city..."
            className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A252]"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            No registered customers match your search yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Purchase (BDT)</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.uid} className="hover:bg-zinc-50/70">
                    <td className="py-3.5 px-4 font-bold text-[#09090B]">{c.name}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-zinc-700">{c.email}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{c.phone || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 max-w-[200px] truncate">
                      {c.city}
                      {c.address ? ` · ${c.address}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#09090B]">
                      {c.orders.length}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#09090B] tabular-nums">
                      {formatBdt(c.totalSpendBdt)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                      {c.registeredAt
                        ? new Date(c.registeredAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUid(c.uid)}
                        className="px-3 py-1 rounded-lg bg-[#F5D687] hover:bg-[#E5BC64] text-[#09090B] font-semibold"
                      >
                        Profile &amp; Orders
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUid(null);
          }}
        >
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#09090B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#E5BC64]">
                  Client Dossier
                </p>
                <h2 className="text-lg font-bold">{selectedCustomer.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUid(null)}
                className="p-1.5 rounded-lg border border-white/20 text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <div className="space-y-1">
                  <p className="text-zinc-500">Email</p>
                  <p className="font-semibold text-[#09090B]">{selectedCustomer.email}</p>
                  <p className="text-zinc-500 pt-1">Phone</p>
                  <p className="font-mono font-semibold text-[#09090B]">
                    {selectedCustomer.phone || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Saved Delivery Address</p>
                  <p className="font-medium text-[#09090B]">
                    {selectedCustomer.address || 'No street address saved'} ({selectedCustomer.city})
                  </p>
                  <p className="text-zinc-500 pt-1">Total Spend (Non-Cancelled)</p>
                  <p className="font-mono text-base font-bold text-[#9E7B31]">
                    {formatBdt(selectedCustomer.totalSpendBdt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${selectedCustomer.email}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 font-semibold hover:border-[#C8A252]"
                >
                  <Mail className="w-3.5 h-3.5 text-[#9E7B31]" />
                  <span>Send Email</span>
                </a>
                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Client</span>
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#09090B]">
                  Order History ({selectedCustomer.orders.length})
                </h3>
                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-zinc-500">This client has not placed any orders yet.</p>
                ) : (
                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
                    {selectedCustomer.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50"
                      >
                        <div>
                          <p className="font-mono font-bold text-[#09090B]">{ord.orderNumber}</p>
                          <p className="text-[11px] text-zinc-500">
                            {new Date(ord.createdAt).toLocaleString('en-BD')} · {ord.paymentMethod}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${FULFILLMENT_BADGE_CLASSES[ord.fulfillmentStatus]}`}
                          >
                            {FULFILLMENT_LABELS[ord.fulfillmentStatus]}
                          </span>
                          <span className="font-mono font-bold text-[#09090B]">
                            {formatBdt(ord.totalBdt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUid(null);
                              onOpenOrder(ord);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#F5D687] text-[#09090B] font-semibold"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== PAYMENTS ==================== */
interface AdminPaymentsProps {
  orders: Order[];
  storeSettings: StoreSettings;
  onSaveSettings: (s: Omit<StoreSettings, 'id' | 'updatedAt'>) => Promise<void>;
  onUpdateOrder: (
    orderId: string,
    updates: {
      fulfillmentStatus: FulfillmentStatus;
      paymentStatus: PaymentStatus;
      transactionId?: string;
      refundStatus?: RefundStatus;
      discountBdt?: number;
    },
  ) => Promise<void>;
}

export function AdminPayments({
  orders,
  storeSettings,
  onSaveSettings,
  onUpdateOrder,
}: AdminPaymentsProps) {
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all');
  const [txDrafts, setTxDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const verified = orders
      .filter((o) => o.paymentStatus === 'verified')
      .reduce((a, o) => a + o.totalBdt, 0);
    const codPending = orders
      .filter((o) => o.paymentStatus === 'cod_pending')
      .reduce((a, o) => a + o.totalBdt, 0);
    const gatewayPending = orders
      .filter((o) => o.paymentStatus === 'pending_gateway')
      .reduce((a, o) => a + o.totalBdt, 0);
    const refunded = orders
      .filter((o) => o.paymentStatus === 'refunded' || o.refundStatus === 'refunded')
      .reduce((a, o) => a + o.totalBdt, 0);
    return { verified, codPending, gatewayPending, refunded };
  }, [orders]);

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.paymentStatus === filter)),
    [orders, filter],
  );

  const toggleGateway = async (
    key: 'codEnabled' | 'bkashEnabled' | 'nagadEnabled' | 'sslcommerzEnabled',
  ) => {
    await onSaveSettings({
      ...storeSettings,
      [key]: !storeSettings[key],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#09090B]">Payments &amp; Gateway Readiness</h1>
        <p className="text-sm text-zinc-500">
          Control Bangladesh payment methods, verify transaction IDs, separate Paid vs Unpaid ledgers, and track refunds.
        </p>
      </div>

      {/* Honest Gateway Architecture Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Merchant API Credentials &amp; Truthful Gateway Status</p>
          <p className="leading-relaxed">
            Cash on Delivery (COD) is active live. <strong>bKash, Nagad, and SSLCommerz</strong> are gateway-ready on Checkout: until real server-side merchant keys/webhooks are attached, orders placed via those methods record transparently as <em>Pending Gateway Verification</em> so you can manually verify Transaction IDs or process refunds here without fabricating online captures.
          </p>
        </div>
      </div>

      {/* Gateway Switchboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              key: 'codEnabled' as const,
              name: 'Cash on Delivery',
              mode: 'Active Live (BDT)',
              enabled: storeSettings.codEnabled,
            },
            {
              key: 'bkashEnabled' as const,
              name: 'bKash Checkout',
              mode: 'Gateway-Ready (Needs App Key)',
              enabled: storeSettings.bkashEnabled,
            },
            {
              key: 'nagadEnabled' as const,
              name: 'Nagad MFS',
              mode: 'Gateway-Ready (Needs Merchant ID)',
              enabled: storeSettings.nagadEnabled,
            },
            {
              key: 'sslcommerzEnabled' as const,
              name: 'SSLCommerz',
              mode: 'Gateway-Ready (Needs Store ID)',
              enabled: storeSettings.sslcommerzEnabled,
            },
          ] as const
        ).map((gw) => (
          <div
            key={gw.key}
            className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C8A252]" />
                <p className="text-xs font-bold text-[#09090B]">{gw.name}</p>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">{gw.mode}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleGateway(gw.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                gw.enabled
                  ? 'bg-[#09090B] text-[#E5BC64]'
                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
              }`}
            >
              {gw.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>

      {/* Paid vs Unpaid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-zinc-500">Verified / Paid Revenue</p>
          <p className="font-mono text-xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatBdt(totals.verified)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-zinc-500">COD Unpaid (Collect on Delivery)</p>
          <p className="font-mono text-xl font-bold text-[#09090B] mt-1 tabular-nums">
            {formatBdt(totals.codPending)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-zinc-500">Pending Gateway Verification</p>
          <p className="font-mono text-xl font-bold text-amber-700 mt-1 tabular-nums">
            {formatBdt(totals.gatewayPending)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-zinc-500">Refunded Total</p>
          <p className="font-mono text-xl font-bold text-purple-700 mt-1 tabular-nums">
            {formatBdt(totals.refunded)}
          </p>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#09090B]">Transactions &amp; Verification</h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                { id: 'all' as const, label: 'All' },
                { id: 'verified' as const, label: 'Paid / Verified' },
                { id: 'cod_pending' as const, label: 'COD Pending' },
                { id: 'pending_gateway' as const, label: 'Gateway Pending' },
                { id: 'failed' as const, label: 'Failed' },
                { id: 'refunded' as const, label: 'Refunded' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-lg font-semibold ${
                  filter === f.id
                    ? 'bg-[#09090B] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:text-[#09090B]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            No payment transactions in this filter yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount (BDT)</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verify / Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((ord) => {
                  const txValue = txDrafts[ord.id] ?? (ord.transactionId || '');
                  return (
                    <tr key={ord.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#09090B]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#09090B]">{ord.customerName}</p>
                        <p className="font-mono text-[11px] text-zinc-500">{ord.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold">{ord.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">
                        {formatBdt(ord.totalBdt)}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={txValue}
                          onChange={(e) =>
                            setTxDrafts((prev) => ({ ...prev, [ord.id]: e.target.value }))
                          }
                          placeholder="Enter TxID..."
                          className="border border-zinc-200 rounded-lg px-2.5 py-1 font-mono text-[11px] w-36"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${PAYMENT_BADGE_CLASSES[ord.paymentStatus]}`}
                        >
                          {PAYMENT_LABELS[ord.paymentStatus]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={savingId === ord.id}
                            onClick={async () => {
                              setSavingId(ord.id);
                              try {
                                await onUpdateOrder(ord.id, {
                                  fulfillmentStatus: ord.fulfillmentStatus,
                                  paymentStatus: 'verified',
                                  transactionId: txValue,
                                  refundStatus: 'none',
                                });
                              } finally {
                                setSavingId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                          <button
                            type="button"
                            disabled={savingId === ord.id}
                            onClick={async () => {
                              setSavingId(ord.id);
                              try {
                                await onUpdateOrder(ord.id, {
                                  fulfillmentStatus: ord.fulfillmentStatus,
                                  paymentStatus: 'refunded',
                                  transactionId: txValue,
                                  refundStatus: 'refunded',
                                });
                              } finally {
                                setSavingId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 text-purple-700 text-[11px] font-semibold hover:bg-purple-50"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
