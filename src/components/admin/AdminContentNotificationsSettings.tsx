import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { formatBdt } from '../../data/catalog';
import {
  AiConversationLog,
  Article,
  Inquiry,
  NewsletterSubscriber,
  Order,
  Product,
  Review,
  SiteContent,
  StoreSettings,
  UserProfile,
} from '../../types';
import { downloadCsvFile, STUDIO_IMAGES } from './adminUtils';

/* ==================== WEBSITE CONTENT ==================== */
interface AdminWebsiteContentProps {
  siteContent: SiteContent;
  products: Product[];
  articles: Article[];
  subscribers: NewsletterSubscriber[];
  onSaveSiteContent: (content: SiteContent) => Promise<void>;
  onSaveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'> & { isEdit?: boolean }) => Promise<void>;
  onSaveArticle: (article: Article) => Promise<void>;
  onDeleteArticle: (articleId: string) => Promise<void>;
  onDeleteSubscriber: (id: string) => Promise<void>;
}

export function AdminWebsiteContent({
  siteContent,
  products,
  articles,
  subscribers,
  onSaveSiteContent,
  onSaveProduct,
  onSaveArticle,
  onDeleteArticle,
  onDeleteSubscriber,
}: AdminWebsiteContentProps) {
  const [subTab, setSubTab] = useState<'hero' | 'curation' | 'journal' | 'newsletter'>('hero');
  const [contentForm, setContentForm] = useState<SiteContent>(siteContent);
  const [savingContent, setSavingContent] = useState(false);

  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('Atelier & Design');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artBody, setArtBody] = useState('');
  const [artImage, setArtImage] = useState(STUDIO_IMAGES[0].url);
  const [artReadTime, setArtReadTime] = useState('4 min read');
  const [savingArticle, setSavingArticle] = useState(false);

  React.useEffect(() => {
    setContentForm(siteContent);
  }, [siteContent]);

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      await onSaveSiteContent(contentForm);
    } finally {
      setSavingContent(false);
    }
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (artTitle.trim().length < 4 || artBody.trim().length < 20) return;
    setSavingArticle(true);
    try {
      const id = `art-${Date.now().toString(36)}`;
      await onSaveArticle({
        id,
        title: artTitle.trim(),
        category: artCategory.trim(),
        excerpt: artExcerpt.trim() || artBody.trim().slice(0, 140),
        body: artBody.trim(),
        imageUrl: artImage,
        readTime: artReadTime.trim(),
        publishedAt: new Date().toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      });
      setArtTitle('');
      setArtExcerpt('');
      setArtBody('');
    } finally {
      setSavingArticle(false);
    }
  };

  const handleExportNewsletter = () => {
    const rows: string[][] = [
      ['Email', 'Source', 'Subscribed At'],
      ...subscribers.map((s) => [
        s.email,
        s.source,
        new Date(s.createdAt).toLocaleString('en-BD'),
      ]),
    ];
    downloadCsvFile(`nosif-worlds-newsletter-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#09090B]">Website Content &amp; Editorial</h1>
        <p className="text-sm text-zinc-500">
          Update live storefront hero banners, promotional offers, featured product curation, journal articles, footer contact info, and newsletter subscribers.
        </p>
      </div>

      <div className="inline-flex flex-wrap bg-white border border-zinc-200 rounded-xl p-1 shadow-xs gap-1">
        {(
          [
            { id: 'hero' as const, label: 'Hero, Offers & Contact' },
            { id: 'curation' as const, label: 'Featured & New Arrivals' },
            { id: 'journal' as const, label: `Journal Articles (${articles.length})` },
            { id: 'newsletter' as const, label: `Newsletter (${subscribers.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
              subTab === t.id ? 'bg-[#09090B] text-white' : 'text-zinc-600 hover:text-[#09090B]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'hero' && (
        <form
          onSubmit={handleSaveSite}
          className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Hero Eyebrow</label>
              <input
                type="text"
                maxLength={80}
                value={contentForm.heroEyebrow}
                onChange={(e) => setContentForm({ ...contentForm, heroEyebrow: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Promotional Top Banner</label>
              <input
                type="text"
                maxLength={200}
                value={contentForm.offerBanner}
                onChange={(e) => setContentForm({ ...contentForm, offerBanner: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-zinc-600 block mb-1">Hero Headline</label>
              <input
                type="text"
                maxLength={160}
                value={contentForm.heroTitle}
                onChange={(e) => setContentForm({ ...contentForm, heroTitle: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-zinc-600 block mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                maxLength={400}
                value={contentForm.heroSubtitle}
                onChange={(e) => setContentForm({ ...contentForm, heroSubtitle: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Support Email</label>
              <input
                type="email"
                maxLength={160}
                value={contentForm.supportEmail}
                onChange={(e) => setContentForm({ ...contentForm, supportEmail: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">WhatsApp Number</label>
              <input
                type="text"
                maxLength={40}
                value={contentForm.whatsappNumber}
                onChange={(e) => setContentForm({ ...contentForm, whatsappNumber: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-zinc-600 block mb-1">Showroom Address</label>
              <input
                type="text"
                maxLength={240}
                value={contentForm.showroomAddress}
                onChange={(e) => setContentForm({ ...contentForm, showroomAddress: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Instagram URL</label>
              <input
                type="url"
                maxLength={240}
                value={contentForm.instagramUrl}
                onChange={(e) => setContentForm({ ...contentForm, instagramUrl: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">Facebook URL</label>
              <input
                type="url"
                maxLength={240}
                value={contentForm.facebookUrl}
                onChange={(e) => setContentForm({ ...contentForm, facebookUrl: e.target.value })}
                className="w-full border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <button
              type="submit"
              disabled={savingContent}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
            >
              {savingContent ? 'Saving...' : 'Publish Storefront Content'}
            </button>
          </div>
        </form>
      )}

      {subTab === 'curation' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 text-xs text-zinc-500">
            Toggle Featured, New Arrivals, Best Sellers, and Storefront Active visibility directly — updates reflect on the Homepage immediately.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">New Arrival</th>
                  <th className="py-3 px-4">Best Seller</th>
                  <th className="py-3 px-4">Storefront Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-semibold text-[#09090B]">
                      {p.name}{' '}
                      <span className="font-mono text-[11px] text-zinc-400">({p.sku})</span>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={p.featured}
                        onChange={() =>
                          onSaveProduct({ ...p, featured: !p.featured, isEdit: true })
                        }
                        className="accent-[#09090B]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={p.isNewArrival}
                        onChange={() =>
                          onSaveProduct({ ...p, isNewArrival: !p.isNewArrival, isEdit: true })
                        }
                        className="accent-[#09090B]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={p.isBestSeller}
                        onChange={() =>
                          onSaveProduct({ ...p, isBestSeller: !p.isBestSeller, isEdit: true })
                        }
                        className="accent-[#09090B]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={(p.status || 'active') === 'active'}
                        onChange={() =>
                          onSaveProduct({
                            ...p,
                            status: (p.status || 'active') === 'active' ? 'inactive' : 'active',
                            isEdit: true,
                          })
                        }
                        className="accent-[#09090B]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handlePublishArticle}
            className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs"
          >
            <h2 className="text-base font-bold text-[#09090B]">Publish Journal Article</h2>
            <input
              type="text"
              required
              minLength={4}
              maxLength={160}
              placeholder="Article Title *"
              value={artTitle}
              onChange={(e) => setArtTitle(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Category"
                value={artCategory}
                onChange={(e) => setArtCategory(e.target.value)}
                className="border border-zinc-300 rounded-xl px-3 py-2"
              />
              <input
                type="text"
                required
                placeholder="Read time"
                value={artReadTime}
                onChange={(e) => setArtReadTime(e.target.value)}
                className="border border-zinc-300 rounded-xl px-3 py-2"
              />
            </div>
            <select
              value={artImage}
              onChange={(e) => setArtImage(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2 bg-white"
            >
              {STUDIO_IMAGES.map((img) => (
                <option key={img.url} value={img.url}>
                  Cover: {img.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              maxLength={400}
              placeholder="Short Excerpt (optional)"
              value={artExcerpt}
              onChange={(e) => setArtExcerpt(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
            <textarea
              rows={5}
              required
              minLength={20}
              maxLength={6000}
              placeholder="Article body (min 20 characters)..."
              value={artBody}
              onChange={(e) => setArtBody(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-3 py-2"
            />
            <button
              type="submit"
              disabled={savingArticle}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
            >
              {savingArticle ? 'Publishing...' : 'Publish to Journal'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#09090B]">Published Journal Entries</h2>
            <div className="divide-y divide-zinc-100">
              {articles.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#9E7B31] font-semibold">
                      {a.category} · {a.publishedAt}
                    </p>
                    <p className="text-sm font-bold text-[#09090B] mt-0.5">{a.title}</p>
                    <p className="text-zinc-500 mt-1 line-clamp-2">{a.excerpt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteArticle(a.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'newsletter' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#09090B]">
              Private Dispatch Subscribers ({subscribers.length})
            </h2>
            <button
              type="button"
              onClick={handleExportNewsletter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090B] text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-[#E5BC64]" />
              <span>Export CSV</span>
            </button>
          </div>
          {subscribers.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              No footer newsletter subscribers recorded in Firestore yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 text-xs">
              {subscribers.map((s) => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#C8A252]" />
                    <span className="font-semibold text-[#09090B]">{s.email}</span>
                    <span className="text-[11px] text-zinc-400">({s.source})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500">
                      {new Date(s.createdAt).toLocaleString('en-BD')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSubscriber(s.id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==================== NOTIFICATIONS CENTER ==================== */
interface AdminNotificationsProps {
  orders: Order[];
  products: Product[];
  users: UserProfile[];
  inquiries: Inquiry[];
  reviews: Review[];
  aiLogs: AiConversationLog[];
  storeSettings: StoreSettings;
  acknowledgedOrderIds: string[];
  onOpenOrder: (o: Order) => void;
  onAcknowledgeAll: () => void;
  onPlayAlertSound: () => void;
  onSaveSettings: (s: Omit<StoreSettings, 'id' | 'updatedAt'>) => Promise<void>;
  onResolveInquiry: (id: string, status: 'open' | 'resolved') => Promise<void>;
  onUpdateReviewStatus: (id: string, status: 'approved' | 'pending' | 'hidden') => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
}

export function AdminNotifications({
  orders,
  products,
  users,
  inquiries,
  reviews,
  aiLogs,
  storeSettings,
  acknowledgedOrderIds,
  onOpenOrder,
  onAcknowledgeAll,
  onPlayAlertSound,
  onSaveSettings,
  onResolveInquiry,
  onUpdateReviewStatus,
  onDeleteReview,
}: AdminNotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'orders' | 'stock' | 'customers' | 'inquiries' | 'ai'>('all');

  const threshold = storeSettings.lowStockThreshold ?? 5;
  const ackSet = useMemo(() => new Set(acknowledgedOrderIds), [acknowledgedOrderIds]);

  const unifiedAlerts = useMemo(() => {
    const list: {
      id: string;
      kind: 'order' | 'stock' | 'customer' | 'payment' | 'cancelled';
      title: string;
      detail: string;
      time: string;
      unread: boolean;
      orderRef?: Order;
    }[] = [];

    for (const o of orders) {
      if (o.fulfillmentStatus === 'new' || o.fulfillmentStatus === 'pending') {
        list.push({
          id: `ord-${o.id}`,
          kind: 'order',
          title: `New Order ${o.orderNumber} — ${formatBdt(o.totalBdt)}`,
          detail: `${o.customerName} (${o.customerPhone}) via ${o.paymentMethod}`,
          time: o.createdAt,
          unread: !ackSet.has(o.id),
          orderRef: o,
        });
      }
      if (o.paymentStatus === 'verified') {
        list.push({
          id: `pay-${o.id}`,
          kind: 'payment',
          title: `Payment Verified: ${o.orderNumber}`,
          detail: `${formatBdt(o.totalBdt)} confirmed (${o.paymentMethod}${o.transactionId ? ` · TxID ${o.transactionId}` : ''})`,
          time: o.updatedAt,
          unread: false,
          orderRef: o,
        });
      }
      if (o.fulfillmentStatus === 'cancelled') {
        list.push({
          id: `can-${o.id}`,
          kind: 'cancelled',
          title: `Cancelled Order: ${o.orderNumber}`,
          detail: `${o.customerName} · ${formatBdt(o.totalBdt)}`,
          time: o.updatedAt,
          unread: false,
          orderRef: o,
        });
      }
    }

    for (const p of products) {
      if (p.stock <= 0) {
        list.push({
          id: `out-${p.id}`,
          kind: 'stock',
          title: `Out of Stock: ${p.name}`,
          detail: `SKU ${p.sku} has 0 remaining units.`,
          time: p.updatedAt || new Date().toISOString(),
          unread: true,
        });
      } else if (p.stock <= threshold) {
        list.push({
          id: `low-${p.id}`,
          kind: 'stock',
          title: `Low Stock Alert: ${p.name} (${p.stock} left)`,
          detail: `SKU ${p.sku} is at or below threshold (${threshold}).`,
          time: p.updatedAt || new Date().toISOString(),
          unread: true,
        });
      }
    }

    for (const u of users.slice(0, 10)) {
      list.push({
        id: `usr-${u.uid}`,
        kind: 'customer',
        title: `Customer Registered: ${u.displayName || u.email}`,
        detail: `${u.email}${u.city ? ` · ${u.city}` : ''}`,
        time: u.createdAt || new Date().toISOString(),
        unread: false,
      });
    }

    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [orders, products, users, threshold, ackSet]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#09090B]">Notifications &amp; Client Desk</h1>
          <p className="text-sm text-zinc-500">
            Real-time alerts for incoming orders, low/out-of-stock SKUs, customer registrations, payments, inquiries, reviews, and AYAN AI sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onSaveSettings({
                ...storeSettings,
                alertSoundEnabled: !storeSettings.alertSoundEnabled,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold ${
              storeSettings.alertSoundEnabled
                ? 'bg-[#FDF6E7] border-[#E5BC64] text-[#8C6818]'
                : 'bg-white border-zinc-200 text-zinc-600'
            }`}
          >
            {storeSettings.alertSoundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>Sound: {storeSettings.alertSoundEnabled ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={onPlayAlertSound}
            className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:border-[#C8A252]"
          >
            Test Alert Sound
          </button>

          <button
            type="button"
            onClick={onAcknowledgeAll}
            className="px-4 py-2 rounded-xl bg-[#09090B] text-white text-xs font-semibold"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="inline-flex flex-wrap bg-white border border-zinc-200 rounded-xl p-1 shadow-xs gap-1">
        {(
          [
            { id: 'all' as const, label: `All Alerts (${unifiedAlerts.length})` },
            { id: 'orders' as const, label: 'Orders & Payments' },
            { id: 'stock' as const, label: 'Stock Alerts' },
            { id: 'customers' as const, label: 'New Customers' },
            { id: 'inquiries' as const, label: `Inquiries & Reviews (${inquiries.length + reviews.length})` },
            { id: 'ai' as const, label: `AYAN AI Logs (${aiLogs.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === tab.id ? 'bg-[#09090B] text-white' : 'text-zinc-600 hover:text-[#09090B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filter !== 'inquiries' && filter !== 'ai' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs divide-y divide-zinc-100">
          {unifiedAlerts
            .filter((a) => {
              if (filter === 'orders')
                return a.kind === 'order' || a.kind === 'payment' || a.kind === 'cancelled';
              if (filter === 'stock') return a.kind === 'stock';
              if (filter === 'customers') return a.kind === 'customer';
              return true;
            })
            .map((a) => (
              <div
                key={a.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  a.unread ? 'bg-[#FDF6E7]/45' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      a.kind === 'stock'
                        ? 'bg-amber-100 text-amber-800'
                        : a.kind === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : a.kind === 'customer'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-[#09090B] text-[#E5BC64]'
                    }`}
                  >
                    {a.kind === 'stock' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : a.kind === 'customer' ? (
                      <UserPlus className="w-4 h-4" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#09090B]">{a.title}</p>
                      {a.unread && (
                        <span className="w-2 h-2 rounded-full bg-red-500" aria-label="Unread alert" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">{a.detail}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {new Date(a.time).toLocaleString('en-BD')}
                    </p>
                  </div>
                </div>

                {a.orderRef && (
                  <button
                    type="button"
                    onClick={() => onOpenOrder(a.orderRef!)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#F5D687] hover:bg-[#E5BC64] text-[#09090B] text-xs font-semibold shrink-0"
                  >
                    Inspect Order
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {filter === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#09090B]">
              Client Inquiries ({inquiries.length})
            </h2>
            {inquiries.length === 0 ? (
              <p className="text-zinc-500">No support inquiries recorded.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#09090B]">{inq.subject}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onResolveInquiry(inq.id, inq.status === 'open' ? 'resolved' : 'open')
                        }
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          inq.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {inq.status}
                      </button>
                    </div>
                    <p className="text-zinc-600">{inq.message}</p>
                    <p className="text-[11px] text-zinc-400">
                      {inq.name} · {inq.email}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#09090B]">
              Product Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-zinc-500">No submitted reviews yet.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[#C8A252]">
                        <Star className="w-3.5 h-3.5 fill-[#C8A252]" />
                        <span className="font-bold text-[#09090B]">{rev.rating}/5</span>
                        <span className="text-zinc-500">· {rev.productName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={rev.status}
                          onChange={(e) =>
                            onUpdateReviewStatus(
                              rev.id,
                              e.target.value as 'approved' | 'pending' | 'hidden',
                            )
                          }
                          className="border border-zinc-200 rounded-lg px-2 py-0.5 text-[11px]"
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="hidden">Hidden</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteReview(rev.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-[#09090B]">{rev.title}</p>
                    <p className="text-zinc-600">{rev.comment}</p>
                    <p className="text-[11px] text-zinc-400">By {rev.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {filter === 'ai' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#C8A252]" />
            <h2 className="text-base font-bold text-[#09090B]">
              AYAN AI Concierge Conversation Logs ({aiLogs.length})
            </h2>
          </div>
          {aiLogs.length === 0 ? (
            <p className="text-zinc-500">No AYAN AI client conversations logged yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {aiLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>
                      {log.customerEmail || log.userId} · {log.language.toUpperCase()} ·{' '}
                      {log.messageCount} msgs
                    </span>
                    <span>{new Date(log.updatedAt).toLocaleString('en-BD')}</span>
                  </div>
                  <p className="font-semibold text-[#09090B]">Client: {log.lastPrompt}</p>
                  <p className="text-zinc-600">AYAN AI: {log.lastReply}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==================== SETTINGS ==================== */
interface AdminSettingsProps {
  storeSettings: StoreSettings;
  adminEmail: string;
  onSaveSettings: (s: Omit<StoreSettings, 'id' | 'updatedAt'>) => Promise<void>;
  onPlayAlertSound: () => void;
}

export function AdminSettings({
  storeSettings,
  adminEmail,
  onSaveSettings,
  onPlayAlertSound,
}: AdminSettingsProps) {
  const [form, setForm] = useState(storeSettings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm(storeSettings);
  }, [storeSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#09090B]">Store Automation &amp; Security Settings</h1>
        <p className="text-sm text-zinc-500">
          Configure automatic inventory deduction rules, low-stock thresholds, Bangladesh courier charges, and Firebase security telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5 text-xs"
        >
          <h2 className="text-base font-bold text-[#09090B]">Inventory &amp; Shipping Rules</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 cursor-pointer hover:border-[#C8A252]">
              <input
                type="checkbox"
                checked={form.autoDeductStockOnConfirm}
                onChange={(e) =>
                  setForm({ ...form, autoDeductStockOnConfirm: e.target.checked })
                }
                className="mt-0.5 accent-[#09090B]"
              />
              <div>
                <p className="font-bold text-[#09090B]">
                  Automatically Deduct Stock on Order Confirmation
                </p>
                <p className="text-zinc-500 mt-0.5">
                  When an order is confirmed/processed, deduct ordered item quantities from live Firestore product stock and write an immutable Stock History entry (prevents double deduction).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 cursor-pointer hover:border-[#C8A252]">
              <input
                type="checkbox"
                checked={form.autoRestoreStockOnCancel}
                onChange={(e) =>
                  setForm({ ...form, autoRestoreStockOnCancel: e.target.checked })
                }
                className="mt-0.5 accent-[#09090B]"
              />
              <div>
                <p className="font-bold text-[#09090B]">
                  Automatically Restore Stock on Order Cancellation
                </p>
                <p className="text-zinc-500 mt-0.5">
                  If a previously confirmed order is marked Cancelled, restore ordered item quantities back into live inventory.
                </p>
              </div>
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.alertSoundEnabled}
                  onChange={(e) => setForm({ ...form, alertSoundEnabled: e.target.checked })}
                  className="accent-[#09090B]"
                />
                <div>
                  <p className="font-bold text-[#09090B]">Real-Time New Order Sound Alert</p>
                  <p className="text-zinc-500">Plays a subtle chime when a new customer order arrives.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onPlayAlertSound}
                className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-semibold text-[#09090B]"
              >
                Test Sound
              </button>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-zinc-600 block mb-1">
                Low Stock Alert Threshold (Units)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: Number(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">
                Free Delivery Threshold (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={form.freeShippingThresholdBdt}
                onChange={(e) =>
                  setForm({ ...form, freeShippingThresholdBdt: Number(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">
                Dhaka Metro Delivery Fee (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={form.dhakaShippingBdt}
                onChange={(e) =>
                  setForm({ ...form, dhakaShippingBdt: Number(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-600 block mb-1">
                Outside Dhaka Delivery Fee (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={form.outsideDhakaShippingBdt}
                onChange={(e) =>
                  setForm({ ...form, outsideDhakaShippingBdt: Number(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold"
            >
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C8A252]" />
            <h2 className="text-base font-bold text-[#09090B]">Firebase Security &amp; Auth Status</h2>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Active Admin</span>
              <span className="font-semibold text-[#09090B] truncate">{adminEmail}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Firebase Project</span>
              <span className="font-mono text-[#09090B]">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Firestore Database</span>
              <span className="font-mono text-[#09090B] truncate max-w-[200px]">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-zinc-600 leading-relaxed">
            <p className="font-bold text-[#09090B]">Admin Access Enforcement:</p>
            <p>
              Firestore rules restrict all writes on products, categories, stock history, site content, settings, and customer orders strictly to verified administrator UIDs/emails. Customer accounts never gain access to `/admin`.
            </p>
            <p>
              To sign in via Email/Password at <span className="font-mono">#/admin/login</span>, make sure the Email/Password provider is enabled in Firebase Console → Authentication → Sign-in method, and the admin email is marked verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
