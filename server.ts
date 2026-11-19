import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '6mb' }));
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CatalogSummaryItem {
  id: string;
  sku: string;
  name: string;
  division: string;
  category: string;
  priceBdt: number;
  stock: number;
  sizes: string[];
  colors: string[];
  description: string;
  specs?: string[];
}

interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface OrderSummaryItem {
  orderNumber: string;
  totalBdt: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAtLabel: string;
}

app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    ok: true,
    brand: 'NOSIF WORLDS',
    geminiConfigured: hasKey,
  });
});

app.post('/api/newsletter', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  res.json({
    ok: true,
    message: `Thank you. ${email} has been added to the NOSIF WORLDS private dispatch list.`,
  });
});

app.post('/api/contact/guest', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (name.length < 2 || !email.includes('@') || subject.length < 2 || message.length < 5) {
    res.status(400).json({ error: 'Please complete all required inquiry fields.' });
    return;
  }

  const ticketId = `NW-INQ-${Date.now().toString(36).toUpperCase()}`;
  res.json({
    ok: true,
    ticketId,
    message: 'Your inquiry has been logged for our concierge desk.',
  });
});

app.post('/api/admin/upload-image', (req, res) => {
  const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
  const rawName = typeof req.body?.filename === 'string' ? req.body.filename : 'asset';
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    res.status(400).json({ error: 'Only PNG, JPG, and WEBP image uploads are supported.' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 4 * 1024 * 1024) {
    res.status(400).json({ error: 'Image must be smaller than 4 MB.' });
    return;
  }
  const safeBase = rawName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'product';
  const filename = `${safeBase}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  res.json({ ok: true, url: `/uploads/${filename}` });
});

app.post('/api/ayan/chat', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error:
        'AYAN AI requires a configured GEMINI_API_KEY in the server environment. Please configure it in Settings > Secrets.',
    });
    return;
  }

  const userMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!userMessage) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  const history: ChatHistoryTurn[] = Array.isArray(req.body?.history)
    ? req.body.history.slice(-10)
    : [];
  const catalog: CatalogSummaryItem[] = Array.isArray(req.body?.catalog)
    ? req.body.catalog.slice(0, 60)
    : [];
  const cartSummary = Array.isArray(req.body?.cart) ? req.body.cart.slice(0, 20) : [];
  const customerOrders: OrderSummaryItem[] = Array.isArray(req.body?.customerOrders)
    ? req.body.customerOrders.slice(0, 15)
    : [];
  const isAuthenticated = Boolean(req.body?.isAuthenticated);
  const currentPath = typeof req.body?.currentPath === 'string' ? req.body.currentPath : '/';
  const whatsappNumber =
    typeof req.body?.whatsappNumber === 'string'
      ? req.body.whatsappNumber
      : '+880 1700-000000 (placeholder)';

  const systemInstruction = `You are AYAN AI, the official luxury shopping concierge and client advisor for NOSIF WORLDS.
NOSIF WORLDS is a single-vendor luxury fashion and flagship electronics house in Bangladesh using Bangladesh Taka (BDT / ৳) as default currency.

STRICT TRUTHFULNESS & SECURITY RULES:
1. NEVER invent, guess, or fabricate product names, prices, stock quantities, specifications, or order statuses.
2. ONLY quote products, BDT prices, sizes, colors, and stock counts that exist verbatim in the LIVE_CATALOG JSON below.
3. If the customer asks about an order status:
   - If IS_AUTHENTICATED is false, clearly inform them (in their language) that they should sign in to My Account to view verified order status, or contact human support on WhatsApp (${whatsappNumber}).
   - If IS_AUTHENTICATED is true and AUTHENTICATED_ORDERS is empty, tell them honestly that no placed orders were found under their account yet.
   - If AUTHENTICATED_ORDERS has records, quote ONLY the exact orderNumber, totalBdt, paymentMethod, paymentStatus, and fulfillmentStatus from that list.
4. Payment & Checkout honesty:
   - Explain clearly that NOSIF WORLDS prepares checkout in BDT with Cash on Delivery (COD) plus gateway-ready options for bKash, Nagad, and SSLCommerz (merchant API credentials required for live online payment completion). Never claim an online bKash/Nagad/SSLCommerz payment is already processed without a real gateway.
5. Language:
   - Communicate warmly, politely, concisely, and professionally in Bangla (বাংলা) if the customer writes in Bangla or Banglish, or in English if they write in English. Match the user's language naturally.
6. Recommendations:
   - When recommending products, include up to 3 exact product IDs from LIVE_CATALOG in recommendedProductIds so the UI can display interactive product cards.
   - Set suggestedAction to WHATSAPP_SUPPORT if they ask for a human agent, OPEN_CART if they ask to review their bag, OPEN_CHECKOUT if ready to order, VIEW_ORDERS if checking orders, otherwise NONE.

CURRENT_PAGE: ${currentPath}
IS_AUTHENTICATED: ${isAuthenticated}
WHATSAPP_SUPPORT: ${whatsappNumber}
LIVE_CATALOG: ${JSON.stringify(catalog)}
CURRENT_CART: ${JSON.stringify(cartSummary)}
AUTHENTICATED_ORDERS: ${JSON.stringify(customerOrders)}`;

  const conversationLines = history
    .map((turn) => `${turn.role === 'user' ? 'Customer' : 'AYAN AI'}: ${turn.text}`)
    .join('\n');

  const promptPayload = conversationLines
    ? `Recent conversation:\n${conversationLines}\n\nCustomer: ${userMessage}`
    : `Customer: ${userMessage}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Polite, accurate response in English or Bangla matching the customer.',
            },
            language: {
              type: Type.STRING,
              description: 'Detected response language: en, bn, or mixed.',
            },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 exact product IDs from LIVE_CATALOG.',
            },
            suggestedAction: {
              type: Type.STRING,
              description: 'One of NONE, OPEN_CART, OPEN_CHECKOUT, WHATSAPP_SUPPORT, VIEW_ORDERS.',
            },
          },
          required: ['reply', 'language', 'recommendedProductIds', 'suggestedAction'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    if (!raw) {
      res.status(502).json({ error: 'AYAN AI received an empty response from the model.' });
      return;
    }

    const parsed = JSON.parse(raw);
    const catalogIds = new Set(catalog.map((p) => p.id));
    const safeIds = Array.isArray(parsed.recommendedProductIds)
      ? parsed.recommendedProductIds.filter((id: unknown) => typeof id === 'string' && catalogIds.has(id)).slice(0, 3)
      : [];

    const allowedActions = ['NONE', 'OPEN_CART', 'OPEN_CHECKOUT', 'WHATSAPP_SUPPORT', 'VIEW_ORDERS'];
    const safeAction = allowedActions.includes(parsed.suggestedAction) ? parsed.suggestedAction : 'NONE';
    const safeLang = ['en', 'bn', 'mixed'].includes(parsed.language) ? parsed.language : 'en';

    res.json({
      reply: typeof parsed.reply === 'string' ? parsed.reply : raw,
      language: safeLang,
      recommendedProductIds: safeIds,
      suggestedAction: safeAction,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected Gemini API error';
    console.error('AYAN AI error:', msg);
    res.status(500).json({
      error: `AYAN AI could not reach the Gemini service: ${msg}`,
    });
  }
});

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) {
          next();
          return;
        }
        const patched = result.code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR WebSocket disabled */',
        );
        res.type('application/javascript').send(patched);
      } catch (err) {
        next(err);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOSIF WORLDS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NOSIF WORLDS server:', err);
  process.exit(1);
});
