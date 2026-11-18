import React, { useState } from 'react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandCrest } from './BrandLogo';

export function Footer() {
  const { navigate, siteContent, isAdmin } = useStore();
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const resp = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Subscription failed.');
      setStatusMsg(data.message);
      setEmail('');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Unable to subscribe right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWhatsapp = siteContent.whatsappNumber.replace(/[^\d]/g, '') || '8801700000000';

  return (
    <footer className="bg-[#09090B] text-zinc-300 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <BrandCrest className="w-6 h-6" />
              <span className="font-display text-xl font-bold tracking-[0.14em] uppercase">
                NOSIF WORLDS
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Single-vendor luxury fashion and flagship personal electronics curated with direct provenance in Bangladesh Taka (BDT).
            </p>
            <div className="pt-2 space-y-1.5 text-xs text-zinc-400">
              <p>{siteContent.showroomAddress}</p>
              <p>{siteContent.supportEmail}</p>
              <p>WhatsApp: {siteContent.whatsappNumber}</p>
            </div>
          </div>

          {/* Storefront Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home', target: { page: 'home' } as const },
                { label: 'Fashion Store', target: { page: 'fashion' } as const },
                { label: 'Electronics Store', target: { page: 'electronics' } as const },
                { label: 'All Products', target: { page: 'shop', division: 'all' } as const },
                { label: 'Shopping Cart', target: { page: 'cart' } as const },
                { label: 'Checkout', target: { page: 'checkout' } as const },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.target)}
                    className="text-zinc-400 hover:text-[#C8A252] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* House & Client Care */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              House & Client Care
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'About Us', target: { page: 'about' } as const },
                { label: 'My Account', target: { page: 'account' } as const },
                { label: 'My Orders', target: { page: 'orders' } as const },
                { label: 'Journal / Articles', target: { page: 'journal' } as const },
                { label: 'Customer Reviews', target: { page: 'reviews' } as const },
                { label: 'Contact Us', target: { page: 'contact' } as const },
                { label: 'Privacy Policy', target: { page: 'privacy' } as const },
                { label: 'Terms & Conditions', target: { page: 'terms' } as const },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.target)}
                    className="text-zinc-400 hover:text-[#C8A252] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'admin' })}
                    className="text-[#C8A252] font-semibold hover:underline"
                  >
                    Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Private Dispatch & Channels */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Private Dispatch
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Receive seasonal atelier releases and flagship hardware availability notices.
            </p>
            <form onSubmit={handleSubscribe} className="flex border border-white/15 bg-[#141416]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                aria-label="Subscribe to newsletter"
                className="px-4 bg-[#C8A252] text-[#09090B] hover:bg-[#D9B664] transition-colors flex items-center justify-center shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            {statusMsg && <p className="text-xs text-[#C8A252]">{statusMsg}</p>}

            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs">
              <a
                href={`https://wa.me/${cleanWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#C8A252] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Concierge</span>
              </a>
              <a
                href={`mailto:${siteContent.supportEmail}`}
                className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#C8A252] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
              <a
                href={siteContent.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href={siteContent.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} NOSIF WORLDS. All rights reserved. Single-Vendor Official Storefront.</p>
          <p>Currency: Bangladesh Taka (BDT) · Gateway Ready: bKash / Nagad / SSLCommerz / COD</p>
        </div>
      </div>
    </footer>
  );
}
