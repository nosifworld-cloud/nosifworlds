import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  INITIAL_ARTICLES,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SITE_CONTENT,
} from '../data/catalog';
import {
  AiConversationLog,
  AppRoute,
  Article,
  CartItem,
  FulfillmentStatus,
  Inquiry,
  Order,
  PaymentMethod,
  PaymentStatus,
  Product,
  Review,
  SiteContent,
  UserProfile,
} from '../types';

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function parseHashRoute(hash: string): AppRoute {
  const clean = hash.replace(/^#/, '') || '/';
  const [rawPath, rawQuery] = clean.split('?');
  const parts = rawPath.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(rawQuery || '');

  if (parts.length === 0) return { page: 'home' };
  const head = parts[0].toLowerCase();
  switch (head) {
    case 'about':
      return { page: 'about' };
    case 'fashion':
      return { page: 'fashion', category: searchParams.get('category') || undefined };
    case 'electronics':
      return { page: 'electronics', category: searchParams.get('category') || undefined };
    case 'shop':
      return {
        page: 'shop',
        query: searchParams.get('q') || undefined,
        division: (searchParams.get('division') as 'fashion' | 'electronics' | 'all') || 'all',
      };
    case 'product':
      return parts[1] ? { page: 'product', productId: parts[1] } : { page: 'shop' };
    case 'cart':
      return { page: 'cart' };
    case 'checkout':
      return { page: 'checkout' };
    case 'account':
      return { page: 'account' };
    case 'orders':
      return { page: 'orders' };
    case 'journal':
      return { page: 'journal', articleId: parts[1] || undefined };
    case 'reviews':
      return { page: 'reviews' };
    case 'contact':
      return { page: 'contact' };
    case 'privacy':
      return { page: 'privacy' };
    case 'terms':
      return { page: 'terms' };
    case 'admin':
      return { page: 'admin' };
    default:
      return { page: 'home' };
  }
}

export function routeToHash(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '#/';
    case 'about':
      return '#/about';
    case 'fashion':
      return route.category
        ? `#/fashion?category=${encodeURIComponent(route.category)}`
        : '#/fashion';
    case 'electronics':
      return route.category
        ? `#/electronics?category=${encodeURIComponent(route.category)}`
        : '#/electronics';
    case 'shop': {
      const params = new URLSearchParams();
      if (route.query) params.set('q', route.query);
      if (route.division && route.division !== 'all') params.set('division', route.division);
      const q = params.toString();
      return q ? `#/shop?${q}` : '#/shop';
    }
    case 'product':
      return `#/product/${encodeURIComponent(route.productId)}`;
    case 'cart':
      return '#/cart';
    case 'checkout':
      return '#/checkout';
    case 'account':
      return '#/account';
    case 'orders':
      return '#/orders';
    case 'journal':
      return route.articleId ? `#/journal/${encodeURIComponent(route.articleId)}` : '#/journal';
    case 'reviews':
      return '#/reviews';
    case 'contact':
      return '#/contact';
    case 'privacy':
      return '#/privacy';
    case 'terms':
      return '#/terms';
    case 'admin':
      return '#/admin';
  }
}

interface StoreContextValue {
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  userProfile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  products: Product[];
  productsFromDb: boolean;
  articles: Article[];
  siteContent: SiteContent;
  reviews: Review[];
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  cartSubtotalBdt: number;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  addToCart: (product: Product, size?: string, color?: string, qty?: number) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  clearCart: () => void;
  myOrders: Order[];
  placeOrder: (input: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    city: string;
    postalCode?: string;
    paymentMethod: PaymentMethod;
  }) => Promise<Order>;
  submitReview: (input: {
    productId: string;
    productName: string;
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  submitInquiry: (input: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<string>;
  logAiConversation: (input: {
    sessionId: string;
    lastPrompt: string;
    lastReply: string;
    language: 'en' | 'bn' | 'mixed';
    messageCount: number;
  }) => Promise<void>;
  // Admin operations
  allOrders: Order[];
  allReviews: Review[];
  allInquiries: Inquiry[];
  allAiLogs: AiConversationLog[];
  seedFirestoreCatalog: () => Promise<void>;
  saveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'> & { isEdit?: boolean }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    updates: { fulfillmentStatus: FulfillmentStatus; paymentStatus: PaymentStatus },
  ) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: 'approved' | 'pending' | 'hidden') => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  saveSiteContent: (content: SiteContent) => Promise<void>;
  saveArticle: (article: Article) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  resolveInquiry: (inquiryId: string, status: 'open' | 'resolved') => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'nosif_worlds_cart_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseHashRoute(typeof window !== 'undefined' ? window.location.hash : '#/'),
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [dbSiteContent, setDbSiteContent] = useState<SiteContent | null>(null);
  const [dbReviews, setDbReviews] = useState<Review[]>([]);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Admin datasets
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [allAiLogs, setAllAiLogs] = useState<AiConversationLog[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppRoute) => {
    const hash = routeToHash(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Auth listener & user profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setUserProfile(null);
        setWishlistIds([]);
        setMyOrders([]);
        setAllOrders([]);
        setAllReviews([]);
        setAllInquiries([]);
        setAllAiLogs([]);
        setAuthReady(true);
        return;
      }

      // Check admin status
      let adminFlag =
        Boolean(currentUser.emailVerified) &&
        currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL;
      if (!adminFlag && currentUser.emailVerified) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          if (adminDoc.exists()) adminFlag = true;
        } catch {
          adminFlag = false;
        }
      }
      setIsAdmin(adminFlag);

      // Ensure /users/{uid} exists for verified user (Master Gate for wishlist)
      if (currentUser.emailVerified) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: (currentUser.displayName || 'NOSIF Client').slice(0, 120),
              email: (currentUser.email || 'client@nosifworlds.example').slice(0, 200),
              phone: '',
              city: 'Dhaka',
              address: '',
              postalCode: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error('User profile bootstrap check:', err);
        }
      }

      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Public Firestore streams (Products, Articles, SiteContent, Approved Reviews)
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Product),
            id: d.id,
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setDbProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products'),
    );

    const unsubArticles = onSnapshot(
      collection(db, 'articles'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Article),
            id: d.id,
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setDbArticles(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'articles'),
    );

    const unsubSite = onSnapshot(
      doc(db, 'siteContent', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDbSiteContent({
            ...(data as SiteContent),
            updatedAt: tsToIso(data.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siteContent/main'),
    );

    const unsubReviews = onSnapshot(
      query(collection(db, 'reviews'), where('status', '==', 'approved')),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Review),
            id: d.id,
            createdAt: tsToIso(data.createdAt),
          };
        });
        setDbReviews(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'),
    );

    return () => {
      unsubProducts();
      unsubArticles();
      unsubSite();
      unsubReviews();
    };
  }, []);

  // Private customer Firestore streams (when authReady && user)
  useEffect(() => {
    if (!authReady || !user) return;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile({
            ...(data as UserProfile),
            uid: snap.id,
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`),
    );

    const unsubWishlist = onSnapshot(
      collection(db, 'users', user.uid, 'wishlist'),
      (snap) => {
        setWishlistIds(snap.docs.map((d) => d.id));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`),
    );

    const unsubMyOrders = onSnapshot(
      query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      ),
      (snap) => {
        setMyOrders(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as Order),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders'),
    );

    return () => {
      unsubProfile();
      unsubWishlist();
      unsubMyOrders();
    };
  }, [authReady, user]);

  // Admin Firestore streams
  useEffect(() => {
    if (!authReady || !user || !isAdmin) return;

    const unsubAllOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllOrders(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as Order),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders'),
    );

    const unsubAllReviews = onSnapshot(
      query(collection(db, 'reviews'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllReviews(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as Review),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'),
    );

    const unsubInquiries = onSnapshot(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')),
      (snap) => {
        setAllInquiries(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as Inquiry),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries'),
    );

    const unsubAiLogs = onSnapshot(
      query(collection(db, 'aiConversations'), orderBy('updatedAt', 'desc')),
      (snap) => {
        setAllAiLogs(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as AiConversationLog),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'aiConversations'),
    );

    return () => {
      unsubAllOrders();
      unsubAllReviews();
      unsubInquiries();
      unsubAiLogs();
    };
  }, [authReady, user, isAdmin]);

  const products = useMemo(
    () => (dbProducts.length > 0 ? dbProducts : INITIAL_PRODUCTS),
    [dbProducts],
  );
  const articles = useMemo(
    () => (dbArticles.length > 0 ? dbArticles : INITIAL_ARTICLES),
    [dbArticles],
  );
  const siteContent = useMemo(
    () => dbSiteContent ?? INITIAL_SITE_CONTENT,
    [dbSiteContent],
  );
  const reviews = useMemo(() => {
    const combined = [...dbReviews];
    const ids = new Set(dbReviews.map((r) => r.id));
    for (const r of INITIAL_REVIEWS) {
      if (!ids.has(r.id)) combined.push(r);
    }
    return combined;
  }, [dbReviews]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    showToast('Signed in to NOSIF WORLDS.');
  };

  const signOutUser = async () => {
    await signOut(auth);
    showToast('Signed out cleanly.');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Authentication required');
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: (updates.displayName || userProfile?.displayName || user.displayName || 'NOSIF Client').slice(0, 120),
        phone: (updates.phone ?? userProfile?.phone ?? '').slice(0, 32),
        city: (updates.city ?? userProfile?.city ?? 'Dhaka').slice(0, 80),
        address: (updates.address ?? userProfile?.address ?? '').slice(0, 320),
        postalCode: (updates.postalCode ?? userProfile?.postalCode ?? '').slice(0, 24),
        updatedAt: serverTimestamp(),
      });
      showToast('Profile preferences saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      showToast('Please sign in to save items to your wishlist.');
      navigate({ page: 'account' });
      return;
    }
    const path = `users/${user.uid}/wishlist/${productId}`;
    try {
      if (wishlistIds.includes(productId)) {
        await deleteDoc(doc(db, 'users', user.uid, 'wishlist', productId));
        showToast('Removed from wishlist.');
      } else {
        await setDoc(doc(db, 'users', user.uid, 'wishlist', productId), {
          productId,
          userId: user.uid,
          addedAt: serverTimestamp(),
        });
        showToast('Saved to wishlist.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const addToCart = (product: Product, size?: string, color?: string, qty = 1) => {
    if (product.stock <= 0) {
      showToast('This piece is currently out of stock.');
      return;
    }
    const chosenSize = size || product.sizes[0] || 'Standard';
    const chosenColor = color || product.colors[0] || 'Signature';
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === chosenSize &&
          item.selectedColor === chosenColor,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: Math.min(product.stock, next[idx].quantity + qty),
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          division: product.division,
          priceBdt: product.priceBdt,
          imageUrl: product.imageUrl,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          quantity: Math.min(product.stock, qty),
        },
      ];
    });
    showToast(`Added "${product.name}" to your bag.`);
  };

  const updateCartQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.selectedSize === size &&
        item.selectedColor === color
          ? { ...item, quantity: qty }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          ),
      ),
    );
    showToast('Removed item from bag.');
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );
  const cartSubtotalBdt = useMemo(
    () => cart.reduce((acc, item) => acc + item.priceBdt * item.quantity, 0),
    [cart],
  );

  const placeOrder: StoreContextValue['placeOrder'] = async (input) => {
    if (!user) throw new Error('Please sign in to place an order.');
    if (cart.length === 0) throw new Error('Your shopping bag is empty.');

    const subtotalBdt = cartSubtotalBdt;
    const isDhaka = input.city.trim().toLowerCase().includes('dhaka');
    const shippingBdt = subtotalBdt >= 25000 ? 0 : isDhaka ? 150 : 300;
    const totalBdt = subtotalBdt + shippingBdt;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `NW-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    const paymentStatus: PaymentStatus =
      input.paymentMethod === 'COD' ? 'cod_pending' : 'pending_gateway';

    const payload = {
      orderNumber,
      userId: user.uid,
      customerName: input.customerName.trim().slice(0, 120),
      customerEmail: input.customerEmail.trim().slice(0, 200),
      customerPhone: input.customerPhone.trim().slice(0, 32),
      shippingAddress: input.shippingAddress.trim().slice(0, 320),
      city: input.city.trim().slice(0, 80),
      postalCode: (input.postalCode || '').trim().slice(0, 24),
      items: cart.slice(0, 40),
      subtotalBdt,
      shippingBdt,
      totalBdt,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      fulfillmentStatus: 'pending' as FulfillmentStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'orders', orderId), payload);
      clearCart();
      showToast(`Order ${orderNumber} placed.`);
      return {
        ...payload,
        id: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  const submitReview: StoreContextValue['submitReview'] = async (input) => {
    if (!user) throw new Error('Please sign in to submit a review.');
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        userId: user.uid,
        authorName: (user.displayName || 'Verified Client').slice(0, 100),
        productId: input.productId,
        productName: input.productName.slice(0, 140),
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        title: input.title.trim().slice(0, 120),
        comment: input.comment.trim().slice(0, 1500),
        status: 'approved',
        createdAt: serverTimestamp(),
      });
      showToast('Thank you for your review.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const submitInquiry: StoreContextValue['submitInquiry'] = async (input) => {
    if (user && user.emailVerified) {
      const inqId = `inq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'inquiries', inqId), {
          userId: user.uid,
          name: input.name.trim().slice(0, 120),
          email: input.email.trim().slice(0, 200),
          subject: input.subject.trim().slice(0, 160),
          message: input.message.trim().slice(0, 2000),
          status: 'open',
          createdAt: serverTimestamp(),
        });
        showToast('Inquiry submitted to NOSIF WORLDS concierge.');
        return inqId.toUpperCase();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `inquiries/${inqId}`);
      }
    } else {
      const resp = await fetch('/api/contact/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to submit inquiry.');
      showToast('Inquiry received by NOSIF WORLDS concierge.');
      return data.ticketId;
    }
  };

  const logAiConversation: StoreContextValue['logAiConversation'] = async (input) => {
    if (!user || !user.emailVerified) return;
    const sessionRef = doc(db, 'aiConversations', input.sessionId);
    try {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) {
        await setDoc(sessionRef, {
          userId: user.uid,
          customerEmail: (user.email || '').slice(0, 200),
          lastPrompt: input.lastPrompt.slice(0, 1000),
          lastReply: input.lastReply.slice(0, 3000),
          language: input.language,
          messageCount: Math.max(1, input.messageCount),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(sessionRef, {
          lastPrompt: input.lastPrompt.slice(0, 1000),
          lastReply: input.lastReply.slice(0, 3000),
          language: input.language,
          messageCount: Math.max(1, input.messageCount),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `aiConversations/${input.sessionId}`);
    }
  };

  // --- Admin Mutations ---
  const seedFirestoreCatalog = async () => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      const batch = writeBatch(db);
      for (const p of INITIAL_PRODUCTS) {
        batch.set(doc(db, 'products', p.id), {
          id: p.id,
          sku: p.sku,
          name: p.name,
          division: p.division,
          category: p.category,
          priceBdt: p.priceBdt,
          ...(p.compareAtBdt ? { compareAtBdt: p.compareAtBdt } : {}),
          description: p.description,
          imageUrl: p.imageUrl,
          sizes: p.sizes,
          colors: p.colors,
          specs: p.specs || [],
          stock: p.stock,
          featured: p.featured,
          isNewArrival: p.isNewArrival,
          isBestSeller: p.isBestSeller,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const a of INITIAL_ARTICLES) {
        batch.set(doc(db, 'articles', a.id), {
          ...a,
          updatedAt: serverTimestamp(),
        });
      }
      batch.set(doc(db, 'siteContent', 'main'), {
        ...INITIAL_SITE_CONTENT,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showToast('Live Firestore catalog, journal, and storefront config seeded.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const saveProduct: StoreContextValue['saveProduct'] = async (product) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const id = product.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
    const ref = doc(db, 'products', id);
    try {
      const snap = await getDoc(ref);
      const base = {
        id,
        sku: product.sku.slice(0, 48),
        name: product.name.slice(0, 140),
        division: product.division,
        category: product.category.slice(0, 64),
        priceBdt: Number(product.priceBdt),
        ...(product.compareAtBdt ? { compareAtBdt: Number(product.compareAtBdt) } : {}),
        description: product.description.slice(0, 3000),
        imageUrl: product.imageUrl.slice(0, 1000),
        sizes: product.sizes.slice(0, 16),
        colors: product.colors.slice(0, 16),
        specs: (product.specs || []).slice(0, 20),
        stock: Math.max(0, Math.round(Number(product.stock))),
        featured: Boolean(product.featured),
        isNewArrival: Boolean(product.isNewArrival),
        isBestSeller: Boolean(product.isBestSeller),
        updatedAt: serverTimestamp(),
      };
      if (snap.exists()) {
        await updateDoc(ref, base);
      } else {
        await setDoc(ref, { ...base, createdAt: serverTimestamp() });
      }
      showToast(`Saved "${product.name}".`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Product deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const updateOrderStatus: StoreContextValue['updateOrderStatus'] = async (orderId, updates) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        fulfillmentStatus: updates.fulfillmentStatus,
        paymentStatus: updates.paymentStatus,
        updatedAt: serverTimestamp(),
      });
      showToast('Order status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'pending' | 'hidden') => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status });
      showToast('Review status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      showToast('Review deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const saveSiteContent = async (content: SiteContent) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await setDoc(doc(db, 'siteContent', 'main'), {
        heroEyebrow: content.heroEyebrow.slice(0, 80),
        heroTitle: content.heroTitle.slice(0, 160),
        heroSubtitle: content.heroSubtitle.slice(0, 400),
        offerBanner: content.offerBanner.slice(0, 200),
        supportEmail: content.supportEmail.slice(0, 160),
        whatsappNumber: content.whatsappNumber.slice(0, 40),
        showroomAddress: content.showroomAddress.slice(0, 240),
        instagramUrl: content.instagramUrl.slice(0, 240),
        facebookUrl: content.facebookUrl.slice(0, 240),
        updatedAt: serverTimestamp(),
      });
      showToast('Storefront content updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'siteContent/main');
    }
  };

  const saveArticle = async (article: Article) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const id = article.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
    try {
      await setDoc(doc(db, 'articles', id), {
        id,
        title: article.title.slice(0, 160),
        category: article.category.slice(0, 64),
        excerpt: article.excerpt.slice(0, 400),
        body: article.body.slice(0, 6000),
        imageUrl: article.imageUrl.slice(0, 1000),
        readTime: article.readTime.slice(0, 32),
        publishedAt: article.publishedAt.slice(0, 48),
        updatedAt: serverTimestamp(),
      });
      showToast('Journal article saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `articles/${id}`);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      showToast('Article deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
    }
  };

  const resolveInquiry = async (inquiryId: string, status: 'open' | 'resolved') => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), { status });
      showToast('Inquiry status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inquiries/${inquiryId}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        route,
        navigate,
        user,
        authReady,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        userProfile,
        updateUserProfile,
        products,
        productsFromDb: dbProducts.length > 0,
        articles,
        siteContent,
        reviews,
        wishlistIds,
        toggleWishlist,
        cart,
        cartCount,
        cartSubtotalBdt,
        toastMessage,
        showToast,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        myOrders,
        placeOrder,
        submitReview,
        submitInquiry,
        logAiConversation,
        allOrders,
        allReviews,
        allInquiries,
        allAiLogs,
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
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
