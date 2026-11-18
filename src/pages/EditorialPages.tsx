import React, { useState } from 'react';
import { ArrowLeft, Mail, MapPin, MessageCircle, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { LuxuryImage } from '../components/BrandLogo';

export function AboutPage() {
  const { navigate } = useStore();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="space-y-4 border-b border-zinc-200 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">The House</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B]">
          About NOSIF WORLDS
        </h1>
        <p className="text-base text-zinc-600 leading-relaxed max-w-3xl">
          NOSIF WORLDS is a single-vendor luxury fashion and flagship personal electronics house operating in Bangladesh. Every garment, timepiece, leather good, and precision hardware unit is curated, inspected, and dispatched solely under our own roof.
        </p>
      </div>

      <div className="aspect-[16/9] bg-[#141416] border border-zinc-200 overflow-hidden">
        <LuxuryImage
          src="/src/assets/images/hero_nosif_luxury_1795002419948.jpg"
          alt="NOSIF WORLDS Atelier Showcase"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">01. Single-Vendor Provenance</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Zero third-party marketplace sellers. Every product carries direct NOSIF WORLDS quality control and serial verification.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">02. Transparent BDT Pricing</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            All luxury tailoring and electronics are denominated clearly in Bangladesh Taka (BDT) with Cash on Delivery and local gateway support.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">03. AYAN AI Client Advisory</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Our bilingual AI shopping concierge advises in English and বাংলা with real-time catalog and inventory awareness.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate({ page: 'shop', division: 'all' })}
        className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
      >
        Explore the Collection
      </button>
    </div>
  );
}

export function JournalPage({ articleId }: { articleId?: string }) {
  const { articles, navigate } = useStore();
  const active = articleId ? articles.find((a) => a.id === articleId) : null;

  if (active) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
        <button
          type="button"
          onClick={() => navigate({ page: 'journal' })}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-[#09090B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Journal</span>
        </button>

        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            {active.category} · {active.publishedAt} · {active.readTime}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B] leading-tight">
            {active.title}
          </h1>
        </div>

        <div className="aspect-[16/9] bg-[#141416] border border-zinc-200 overflow-hidden">
          <LuxuryImage src={active.imageUrl} alt={active.title} />
        </div>

        <div className="text-base text-zinc-700 leading-relaxed whitespace-pre-line space-y-4">
          {active.body}
        </div>
      </article>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Editorial Dispatches</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B] mt-1">
          The NOSIF WORLDS Journal
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art) => (
          <article key={art.id} className="bg-white border border-zinc-200 flex flex-col">
            <div className="aspect-[4/3] bg-[#141416] overflow-hidden">
              <LuxuryImage src={art.imageUrl} alt={art.title} />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">
                  {art.category} · {art.publishedAt} · {art.readTime}
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#09090B] leading-snug">
                  {art.title}
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed">{art.excerpt}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'journal', articleId: art.id })}
                className="self-start text-xs font-semibold uppercase tracking-wider text-[#09090B] hover:text-[#9E7B31]"
              >
                Read Essay
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ReviewsPage() {
  const { reviews, products, user, submitReview, navigate } = useStore();
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ page: 'account' });
      return;
    }
    const targetProduct = products.find((p) => p.id === productId) || products[0];
    if (!targetProduct) return;
    setSubmitting(true);
    try {
      await submitReview({
        productId: targetProduct.id,
        productName: targetProduct.name,
        rating,
        title,
        comment,
      });
      setTitle('');
      setComment('');
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Client Voices</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B] mt-1">
          Customer Reviews
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 grid grid-cols-1 gap-5">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white border border-zinc-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#C8A252]">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C8A252]" />
                  ))}
                </div>
                <span className="text-xs text-zinc-500">{rev.productName}</span>
              </div>
              <h2 className="text-base font-semibold text-[#09090B]">{rev.title}</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{rev.comment}</p>
              <p className="text-xs font-medium text-zinc-500 pt-2 border-t border-zinc-100">
                {rev.authorName}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white border border-zinc-200 p-6 sm:p-8 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Share Your Experience
          </h2>
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                Sign in with your account to submit a verified product review.
              </p>
              <button
                type="button"
                onClick={() => navigate({ page: 'account' })}
                className="px-5 py-2.5 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Product
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2.5 text-sm bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border border-zinc-300 px-3 py-2.5 text-sm bg-white"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Review
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { siteContent, user, submitInquiry } = useStore();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanWhatsapp = siteContent.whatsappNumber.replace(/[^\d]/g, '') || '8801700000000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const id = await submitInquiry({ name, email, subject, message });
      setTicketId(id);
      setSubject('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Concierge & Support</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#09090B] mt-1">
          Contact Us
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Reach our client concierge for bespoke sizing advice, electronics warranty inquiries, or private showroom appointments. Contact channels below use editable house placeholders customizable in the Admin Dashboard.
          </p>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#9E7B31] shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-[#09090B]">Showroom Address</p>
                <p className="text-zinc-600">{siteContent.showroomAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#9E7B31] shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-[#09090B]">Support Email</p>
                <a href={`mailto:${siteContent.supportEmail}`} className="text-zinc-600 hover:underline">
                  {siteContent.supportEmail}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-[#9E7B31] shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-[#09090B]">WhatsApp Human Support</p>
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#9E7B31] font-medium hover:underline"
                >
                  Message {siteContent.whatsappNumber} on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex gap-4 text-xs font-semibold uppercase tracking-wider">
            <a href={siteContent.instagramUrl} target="_blank" rel="noreferrer" className="text-[#09090B] hover:text-[#9E7B31]">
              Instagram
            </a>
            <a href={siteContent.facebookUrl} target="_blank" rel="noreferrer" className="text-[#09090B] hover:text-[#9E7B31]">
              Facebook
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-zinc-200 p-6 sm:p-8 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-[#09090B]">
            Send a Direct Message
          </h2>
          {ticketId && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900">
              Inquiry logged cleanly (Reference: <span className="font-mono font-semibold">{ticketId}</span>).
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-zinc-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#09090B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A252] hover:text-[#09090B] transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  const { siteContent } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Legal Notice</p>
        <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
          Privacy Policy
        </h1>
      </div>
      <div className="space-y-4 text-sm text-zinc-700 leading-relaxed">
        <p>
          NOSIF WORLDS collects only the personal information strictly necessary to authenticate your account, fulfill single-vendor BDT orders, and deliver concierge support.
        </p>
        <p>
          <strong>Data Isolation:</strong> Customer profile fields (name, email, phone, Bangladesh shipping address) are stored privately per user ID in Firestore and are never exposed to other shoppers.
        </p>
        <p>
          <strong>AYAN AI Privacy:</strong> Conversations with AYAN AI are processed via our secure server-side API route without exposing API credentials to the browser. Order details are accessed only during authenticated sessions.
        </p>
        <p>
          For privacy requests, contact {siteContent.supportEmail} (editable house placeholder).
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
      <div className="border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9E7B31]">Legal Notice</p>
        <h1 className="font-display text-4xl font-semibold text-[#09090B] mt-1">
          Terms and Conditions
        </h1>
      </div>
      <div className="space-y-4 text-sm text-zinc-700 leading-relaxed">
        <p>
          <strong>Single-Vendor Storefront:</strong> All fashion garments, timepieces, leather goods, and electronic hardware displayed on NOSIF WORLDS are sold exclusively by NOSIF WORLDS.
        </p>
        <p>
          <strong>Currency & Settlement:</strong> All prices are quoted in Bangladesh Taka (BDT). Cash on Delivery is available across Bangladesh. Digital payment methods (bKash, Nagad, SSLCommerz) are architecturally prepared and require live merchant gateway credentials before online settlement is active.
        </p>
        <p>
          <strong>Inspection & Returns:</strong> Unworn garments with original tags and sealed electronics may be inspected or exchanged within 7 days subject to verification by our Dhaka atelier desk.
        </p>
      </div>
    </div>
  );
}
