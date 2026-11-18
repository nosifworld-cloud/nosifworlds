import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  MessageSquare,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { LuxuryImage } from './BrandLogo';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedProductIds?: string[];
  suggestedAction?: 'NONE' | 'OPEN_CART' | 'OPEN_CHECKOUT' | 'WHATSAPP_SUPPORT' | 'VIEW_ORDERS';
  isError?: boolean;
}

const QUICK_PROMPTS = [
  'Recommend a luxury watch under ৳150,000',
  'বাংলায় একটি ভালো হেডফোন সাজেস্ট করুন',
  'How does bKash / COD checkout work?',
  'Check my order status',
];

export function AyanAiWidget() {
  const {
    products,
    cart,
    myOrders,
    user,
    route,
    siteContent,
    addToCart,
    navigate,
    logAiConversation,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `ayan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to NOSIF WORLDS. I am AYAN AI, your personal luxury advisor. Ask me in English or বাংলা about tailoring, watches, electronics, BDT pricing, or checkout.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || loading) return;

    const userTurn: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: prompt,
    };

    const nextMessages = [...messages, userTurn];
    setMessages(nextMessages);
    if (!textOverride) setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/ayan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: nextMessages.slice(-10).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          catalog: products.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            division: p.division,
            category: p.category,
            priceBdt: p.priceBdt,
            stock: p.stock,
            sizes: p.sizes,
            colors: p.colors,
            description: p.description,
            specs: p.specs || [],
          })),
          cart: cart.map((c) => ({
            name: c.name,
            size: c.selectedSize,
            color: c.selectedColor,
            quantity: c.quantity,
            priceBdt: c.priceBdt,
          })),
          customerOrders: user
            ? myOrders.map((o) => ({
                orderNumber: o.orderNumber,
                totalBdt: o.totalBdt,
                paymentMethod: o.paymentMethod,
                paymentStatus: o.paymentStatus,
                fulfillmentStatus: o.fulfillmentStatus,
                createdAtLabel: o.createdAt,
              }))
            : [],
          isAuthenticated: Boolean(user),
          currentPath: route.page,
          whatsappNumber: siteContent.whatsappNumber,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'AYAN AI could not complete your request.');
      }

      const assistantTurn: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        recommendedProductIds: data.recommendedProductIds || [],
        suggestedAction: data.suggestedAction || 'NONE',
      };
      setMessages((prev) => [...prev, assistantTurn]);

      if (user) {
        logAiConversation({
          sessionId,
          lastPrompt: prompt,
          lastReply: data.reply,
          language: data.language || 'en',
          messageCount: nextMessages.length + 1,
        }).catch(() => {});
      }
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'AYAN AI is temporarily unavailable. Please reach our concierge on WhatsApp.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: errorText,
          suggestedAction: 'WHATSAPP_SUPPORT',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cleanWhatsapp = siteContent.whatsappNumber.replace(/[^\d]/g, '') || '8801700000000';

  return (
    <>
      {/* Floating AYAN AI Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AYAN AI Shopping Assistant"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 px-5 py-3.5 bg-[#09090B] text-white border border-[#C8A252]/60 shadow-xl hover:bg-[#141416] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A252]"
        >
          <MessageSquare className="w-4 h-4 text-[#C8A252]" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap">
            AYAN AI Concierge
          </span>
        </button>
      )}

      {/* Chat Drawer Window */}
      {open && (
        <section
          aria-label="AYAN AI Shopping Assistant"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[410px] h-[min(600px,82vh)] z-50 bg-[#09090B] text-white border border-white/15 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-[#141416] flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-wide text-white">
                AYAN AI
              </h2>
              <p className="text-xs text-zinc-400">
                NOSIF WORLDS Concierge · English & বাংলা
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${cleanWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp Human Concierge"
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-zinc-300 hover:text-[#C8A252] hover:border-[#C8A252] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AYAN AI chat"
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const recommended = (msg.recommendedProductIds || [])
                .map((id) => products.find((p) => p.id === id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  } space-y-2`}
                >
                  <div
                    className={`max-w-[88%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-[#C8A252] text-[#09090B] font-medium'
                        : msg.isError
                          ? 'bg-red-950/50 border border-red-500/40 text-red-100'
                          : 'bg-[#141416] border border-white/10 text-zinc-100'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Recommended Catalog Products */}
                  {recommended.length > 0 && (
                    <div className="w-full space-y-2">
                      {recommended.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#141416] border border-white/15 p-2.5 flex items-center gap-3"
                        >
                          <div className="w-16 h-12 shrink-0 overflow-hidden bg-black">
                            <LuxuryImage src={p.imageUrl} alt={p.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {p.name}
                            </p>
                            <p className="font-mono text-xs text-[#C8A252] tabular-nums">
                              {formatBdt(p.priceBdt)} · {p.stock > 0 ? `${p.stock} left` : 'Sold out'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigate({ page: 'product', productId: p.id });
                                setOpen(false);
                              }}
                              className="px-2.5 py-1.5 border border-white/20 text-[11px] text-white hover:border-[#C8A252]"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              disabled={p.stock <= 0}
                              onClick={() => addToCart(p)}
                              className="p-1.5 bg-[#C8A252] text-[#09090B] hover:bg-[#D9B664] disabled:opacity-40"
                              aria-label={`Add ${p.name} to bag`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Action */}
                  {msg.suggestedAction && msg.suggestedAction !== 'NONE' && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestedAction === 'OPEN_CART' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate({ page: 'cart' });
                            setOpen(false);
                          }}
                          className="px-3 py-1.5 bg-white text-[#09090B] text-xs font-semibold"
                        >
                          View Shopping Bag
                        </button>
                      )}
                      {msg.suggestedAction === 'OPEN_CHECKOUT' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate({ page: 'checkout' });
                            setOpen(false);
                          }}
                          className="px-3 py-1.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold"
                        >
                          Proceed to Checkout
                        </button>
                      )}
                      {msg.suggestedAction === 'VIEW_ORDERS' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate({ page: user ? 'orders' : 'account' });
                            setOpen(false);
                          }}
                          className="px-3 py-1.5 bg-white text-[#09090B] text-xs font-semibold"
                        >
                          {user ? 'Open My Orders' : 'Sign In for Orders'}
                        </button>
                      )}
                      {msg.suggestedAction === 'WHATSAPP_SUPPORT' && (
                        <a
                          href={`https://wa.me/${cleanWhatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 border border-[#C8A252] text-[#C8A252] text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#141416] border border-white/10 px-3.5 py-2.5 w-fit">
                <span className="w-1.5 h-1.5 bg-[#C8A252] animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#C8A252] animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-[#C8A252] animate-bounce [animation-delay:240ms]" />
                <span className="ml-1">AYAN AI is checking catalog...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-white/10 bg-[#0E0E11] flex gap-2 overflow-x-auto">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(q)}
                className="px-2.5 py-1.5 bg-[#141416] border border-white/10 text-[11px] text-zinc-300 hover:border-[#C8A252] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-white/10 bg-[#141416] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English or বাংলা..."
              className="flex-1 min-w-0 bg-[#09090B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#C8A252]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message to AYAN AI"
              className="p-2.5 bg-[#C8A252] text-[#09090B] hover:bg-[#D9B664] disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
