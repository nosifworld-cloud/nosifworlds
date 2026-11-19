import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
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
  ELECTRONICS_CATEGORIES,
  FASHION_CATEGORIES,
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
  CategoryItem,
  FulfillmentStatus,
  Inquiry,
  NewsletterSubscriber,
  Order,
  PaymentMethod,
  PaymentStatus,
  Product,
  RefundStatus,
  Review,
  SiteContent,
  StockHistoryEntry,
  StoreSettings,
  UserProfile,
} from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'store',
  autoDeductStockOnConfirm: true,
  autoRestoreStockOnCancel: true,
  lowStockThreshold: 5,
  alertSoundEnabled: true,
  codEnabled: true,
  bkashEnabled: true,
  nagadEnabled: true,
  sslcommerzEnabled: true,
  dhakaShippingBdt: 150,
  outsideDhakaShippingBdt: 300,
  freeShippingThresholdBdt: 25000,
};

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export function playWebAudioAlertChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 -> D6 refined chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.38);
    });
  } catch {
    // Ignore browser audio autoplay restrictions
  }
}

function parseInitialOrHashRoute(hash: string, pathname?: string): AppRoute {
  const effectivePath =
    (!hash || hash === '#/' || hash === '#') && pathname && pathname !== '/'
      ? pathname
      : hash.replace(/^#/, '') || '/';
  const [rawPath, rawQuery] = effectivePath.split('?');
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
    case 'wishlist':
      return { page: 'wishlist' };
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
      if (parts[1]?.toLowerCase() === 'login') {
        return { page: 'admin-login' };
      }
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
    case 'wishlist':
      return '#/wishlist';
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
    case 'admin-login':
      return '#/admin/login';
  }
}

interface StoreContextValue {
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  searchModalOpen: boolean;
  searchInitialQuery: string;
  openSearchModal: (initialQuery?: string) => void;
  closeSearchModal: () => void;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOutUser: () => Promise<void>;
  userProfile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  // Storefront visible products & full admin product catalog
  products: Product[];
  allCatalogProducts: Product[];
  productsFromDb: boolean;
  categories: CategoryItem[];
  visibleCategories: CategoryItem[];
  articles: Article[];
  siteContent: SiteContent;
  storeSettings: StoreSettings;
  reviews: Review[];
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (productId: string) => Promise<void>;
  moveWishlistToCart: (product: Product) => Promise<void>;
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
    specialInstructions?: string;
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
  subscribeNewsletter: (email: string, source?: string) => Promise<void>;
  logAiConversation: (input: {
    sessionId: string;
    lastPrompt: string;
    lastReply: string;
    language: 'en' | 'bn' | 'mixed';
    messageCount: number;
  }) => Promise<void>;
  // Admin operations
  allOrders: Order[];
  allUsers: UserProfile[];
  allReviews: Review[];
  allInquiries: Inquiry[];
  allAiLogs: AiConversationLog[];
  stockHistory: StockHistoryEntry[];
  newsletterSubscribers: NewsletterSubscriber[];
  unreadOrderNotifications: Order[];
  acknowledgedOrderIds: string[];
  acknowledgeOrderNotification: (orderId: string) => void;
  acknowledgeAllNotifications: () => void;
  playAlertSound: () => void;
  seedFirestoreCatalog: () => Promise<void>;
  saveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'> & { isEdit?: boolean }) => Promise<void>;
  duplicateProduct: (product: Product) => Promise<void>;
  updateProductSeo: (
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
  adjustProductStock: (product: Product, newStock: number, reason: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: Omit<CategoryItem, 'updatedAt'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    updates: {
      fulfillmentStatus: FulfillmentStatus;
      paymentStatus: PaymentStatus;
      transactionId?: string;
      refundStatus?: RefundStatus;
      discountBdt?: number;
    },
  ) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: 'approved' | 'pending' | 'hidden') => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  saveSiteContent: (content: SiteContent) => Promise<void>;
  saveStoreSettings: (settings: Omit<StoreSettings, 'id' | 'updatedAt'>) => Promise<void>;
  saveArticle: (article: Article) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  resolveInquiry: (inquiryId: string, status: 'open' | 'resolved') => Promise<void>;
  deleteNewsletterSubscriber: (subscriberId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'nosif_worlds_cart_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseInitialOrHashRoute(
      typeof window !== 'undefined' ? window.location.hash : '#/',
      typeof window !== 'undefined' ? window.location.pathname : '/',
    ),
  );
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [dbSiteContent, setDbSiteContent] = useState<SiteContent | null>(null);
  const [dbStoreSettings, setDbStoreSettings] = useState<StoreSettings | null>(null);
  const [dbReviews, setDbReviews] = useState<Review[]>([]);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Admin datasets
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [allAiLogs, setAllAiLogs] = useState<AiConversationLog[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [acknowledgedOrderIds, setAcknowledgedOrderIds] = useState<string[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const adminOrdersLoadedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef(true);

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
      setRoute(parseInitialOrHashRoute(window.location.hash, window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const isAdminPage =
          window.location.hash.startsWith('#/admin') && !window.location.hash.startsWith('#/admin/login');
        if (!isAdminPage) {
          e.preventDefault();
          setSearchModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openSearchModal = (initialQuery = '') => {
    setSearchInitialQuery(initialQuery);
    setSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setSearchModalOpen(false);
  };

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
    }, 3400);
  };

  const storeSettings = useMemo(
    () => dbStoreSettings ?? DEFAULT_STORE_SETTINGS,
    [dbStoreSettings],
  );

  useEffect(() => {
    soundEnabledRef.current = storeSettings.alertSoundEnabled;
  }, [storeSettings.alertSoundEnabled]);

  const playAlertSound = () => {
    playWebAudioAlertChime();
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
        setAllUsers([]);
        setAllReviews([]);
        setAllInquiries([]);
        setAllAiLogs([]);
        setStockHistory([]);
        setNewsletterSubscribers([]);
        setAcknowledgedOrderIds([]);
        adminOrdersLoadedRef.current = false;
        knownOrderIdsRef.current = new Set();
        setAuthReady(true);
        return;
      }

      try {
        const savedAck = localStorage.getItem(`nosif_ack_orders_${currentUser.uid}`);
        if (savedAck) {
          const parsed = JSON.parse(savedAck);
          if (Array.isArray(parsed)) setAcknowledgedOrderIds(parsed);
        }
      } catch {
        // Ignore storage errors
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

      // Ensure /users/{uid} exists for verified user
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

  // Public Firestore streams
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

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDbStoreSettings({
            ...(data as StoreSettings),
            id: snap.id,
            updatedAt: tsToIso(data.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/store'),
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

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as CategoryItem),
            id: d.id,
            updatedAt: tsToIso(data.updatedAt),
          };
        });
        setDbCategories(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories'),
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubArticles();
      unsubSite();
      unsubSettings();
      unsubReviews();
    };
  }, []);

  // Private customer Firestore streams
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
        const mapped = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Order),
            id: d.id,
            createdAt: tsToIso(data.createdAt),
            updatedAt: tsToIso(data.updatedAt),
          };
        });

        if (!adminOrdersLoadedRef.current) {
          knownOrderIdsRef.current = new Set(mapped.map((o) => o.id));
          adminOrdersLoadedRef.current = true;
        } else {
          const newlyArrived = mapped.filter((o) => !knownOrderIdsRef.current.has(o.id));
          if (newlyArrived.length > 0) {
            for (const o of newlyArrived) knownOrderIdsRef.current.add(o.id);
            showToast(
              newlyArrived.length === 1
                ? `New Order Received: ${newlyArrived[0].orderNumber}`
                : `${newlyArrived.length} New Orders Received`,
            );
            if (soundEnabledRef.current) {
              playWebAudioAlertChime();
            }
          }
        }
        setAllOrders(mapped);
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

    const unsubAllUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as UserProfile),
              uid: d.id,
              createdAt: tsToIso(data.createdAt),
              updatedAt: tsToIso(data.updatedAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users'),
    );

    const unsubStockHistory = onSnapshot(
      query(collection(db, 'stockHistory'), orderBy('createdAt', 'desc')),
      (snap) => {
        setStockHistory(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as StockHistoryEntry),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stockHistory'),
    );

    const unsubNewsletter = onSnapshot(
      query(collection(db, 'newsletter'), orderBy('createdAt', 'desc')),
      (snap) => {
        setNewsletterSubscribers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...(data as NewsletterSubscriber),
              id: d.id,
              createdAt: tsToIso(data.createdAt),
            };
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'newsletter'),
    );

    return () => {
      unsubAllOrders();
      unsubAllUsers();
      unsubAllReviews();
      unsubInquiries();
      unsubAiLogs();
      unsubStockHistory();
      unsubNewsletter();
    };
  }, [authReady, user, isAdmin]);

  const allCatalogProducts = useMemo(
    () => (dbProducts.length > 0 ? dbProducts : INITIAL_PRODUCTS),
    [dbProducts],
  );

  // Storefront visible products (excludes inactive/draft products and hidden categories)
  const categories = useMemo<CategoryItem[]>(() => {
    const defaults: CategoryItem[] = [
      ...FASHION_CATEGORIES.map((name) => ({
        id: `cat-fashion-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        division: 'fashion' as const,
        description: `${name} curated by NOSIF WORLDS Fashion Atelier.`,
        subcategories: [],
        isVisible: true,
      })),
      ...ELECTRONICS_CATEGORIES.map((name) => ({
        id: `cat-electronics-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        division: 'electronics' as const,
        description: `${name} engineered for NOSIF WORLDS Flagship Electronics.`,
        subcategories: [],
        isVisible: true,
      })),
    ];
    if (dbCategories.length === 0) return defaults;
    const map = new Map<string, CategoryItem>();
    for (const def of defaults) map.set(`${def.division}:${def.name}`, def);
    for (const cat of dbCategories) {
      map.set(`${cat.division}:${cat.name}`, {
        ...cat,
        isVisible: cat.isVisible !== false,
        subcategories: cat.subcategories || [],
      });
    }
    return Array.from(map.values());
  }, [dbCategories]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.isVisible !== false),
    [categories],
  );

  const products = useMemo(() => {
    const hiddenCategorySet = new Set(
      categories.filter((c) => c.isVisible === false).map((c) => `${c.division}:${c.name}`),
    );
    return allCatalogProducts.filter((p) => {
      if (p.status === 'inactive' || p.status === 'draft') return false;
      if (hiddenCategorySet.has(`${p.division}:${p.category}`)) return false;
      return true;
    });
  }, [allCatalogProducts, categories]);

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

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds],
  );

  const unreadOrderNotifications = useMemo(() => {
    const ackSet = new Set(acknowledgedOrderIds);
    return allOrders.filter(
      (o) =>
        !ackSet.has(o.id) &&
        (o.fulfillmentStatus === 'new' ||
          o.fulfillmentStatus === 'pending' ||
          o.fulfillmentStatus === 'confirmed'),
    );
  }, [allOrders, acknowledgedOrderIds]);

  const acknowledgeOrderNotification = (orderId: string) => {
    setAcknowledgedOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      const next = [...prev, orderId];
      if (user) {
        try {
          localStorage.setItem(`nosif_ack_orders_${user.uid}`, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  };

  const acknowledgeAllNotifications = () => {
    const next = Array.from(new Set([...acknowledgedOrderIds, ...allOrders.map((o) => o.id)]));
    setAcknowledgedOrderIds(next);
    if (user) {
      try {
        localStorage.setItem(`nosif_ack_orders_${user.uid}`, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
    }
    showToast('All alerts marked as read.');
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    showToast('Signed in to NOSIF WORLDS.');
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    showToast('Signed in to NOSIF WORLDS.');
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    await sendEmailVerification(auth.currentUser);
    showToast('Verification link sent to your email.');
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

  const moveWishlistToCart = async (product: Product) => {
    if (product.stock <= 0) {
      showToast('This piece is currently out of stock.');
      return;
    }
    addToCart(product);
    if (user && wishlistIds.includes(product.id)) {
      const path = `users/${user.uid}/wishlist/${product.id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'wishlist', product.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
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
    const shippingBdt =
      subtotalBdt >= storeSettings.freeShippingThresholdBdt
        ? 0
        : isDhaka
          ? storeSettings.dhakaShippingBdt
          : storeSettings.outsideDhakaShippingBdt;
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
      specialInstructions: (input.specialInstructions || '').trim().slice(0, 500),
      items: cart.slice(0, 40),
      subtotalBdt,
      shippingBdt,
      discountBdt: 0,
      totalBdt,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      refundStatus: 'none' as RefundStatus,
      fulfillmentStatus: 'new' as FulfillmentStatus,
      stockDeducted: false,
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

  const subscribeNewsletter = async (email: string, source = 'footer') => {
    const cleanEmail = email.trim().toLowerCase().slice(0, 200);
    const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'newsletter', subId), {
        id: subId,
        email: cleanEmail,
        source: source.slice(0, 48),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Newsletter Firestore save fallback:', err);
    }
    const resp = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Subscription failed.');
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
          brand: 'NOSIF WORLDS',
          division: p.division,
          category: p.category,
          subcategory: p.category,
          priceBdt: p.priceBdt,
          ...(p.compareAtBdt ? { compareAtBdt: p.compareAtBdt } : {}),
          description: p.description,
          imageUrl: p.imageUrl,
          galleryUrls: [p.imageUrl],
          sizes: p.sizes,
          colors: p.colors,
          specs: p.specs || [],
          tags: [p.division, p.category.toLowerCase()],
          stock: p.stock,
          featured: p.featured,
          isNewArrival: p.isNewArrival,
          isBestSeller: p.isBestSeller,
          status: 'active',
          seoTitle: `${p.name} | NOSIF WORLDS`,
          metaDescription: p.description.slice(0, 155),
          focusKeyword: p.name.toLowerCase().slice(0, 60),
          slug: p.id,
          imageAlt: p.name,
          ogImageUrl: p.imageUrl,
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
      batch.set(doc(db, 'settings', 'store'), {
        ...DEFAULT_STORE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showToast('Live Firestore catalog, settings, journal, and storefront config seeded.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const saveProduct: StoreContextValue['saveProduct'] = async (product) => {
    if (!isAdmin || !user) throw new Error('Admin authorization required.');
    const id = product.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
    const ref = doc(db, 'products', id);
    try {
      const snap = await getDoc(ref);
      const nextStock = Math.max(0, Math.round(Number(product.stock)));
      const base: Record<string, unknown> = {
        id,
        sku: product.sku.slice(0, 48),
        name: product.name.slice(0, 140),
        brand: (product.brand || 'NOSIF WORLDS').slice(0, 80),
        division: product.division,
        category: product.category.slice(0, 64),
        subcategory: (product.subcategory || '').slice(0, 64),
        priceBdt: Number(product.priceBdt),
        description: product.description.slice(0, 3000),
        imageUrl: product.imageUrl.slice(0, 1000),
        galleryUrls: (product.galleryUrls && product.galleryUrls.length > 0
          ? product.galleryUrls
          : [product.imageUrl]
        )
          .map((u) => u.slice(0, 1000))
          .slice(0, 12),
        sizes: product.sizes.slice(0, 16),
        colors: product.colors.slice(0, 16),
        specs: (product.specs || []).slice(0, 20),
        tags: (product.tags || []).slice(0, 20),
        stock: nextStock,
        featured: Boolean(product.featured),
        isNewArrival: Boolean(product.isNewArrival),
        isBestSeller: Boolean(product.isBestSeller),
        status: product.status || 'active',
        seoTitle: (product.seoTitle || `${product.name} | NOSIF WORLDS`).slice(0, 160),
        metaDescription: (product.metaDescription || product.description).slice(0, 320),
        focusKeyword: (product.focusKeyword || '').slice(0, 80),
        slug: (product.slug || id).slice(0, 140),
        imageAlt: (product.imageAlt || product.name).slice(0, 200),
        ogImageUrl: (product.ogImageUrl || product.imageUrl).slice(0, 1000),
        updatedAt: serverTimestamp(),
      };
      if (product.compareAtBdt && Number(product.compareAtBdt) > 0) {
        base.compareAtBdt = Number(product.compareAtBdt);
      }

      if (snap.exists()) {
        const prevStock = Number(snap.data().stock ?? 0);
        await updateDoc(ref, base);
        if (prevStock !== nextStock) {
          const histId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          await setDoc(doc(db, 'stockHistory', histId), {
            id: histId,
            productId: id,
            productName: product.name.slice(0, 140),
            sku: product.sku.slice(0, 48),
            change: nextStock - prevStock,
            previousStock: prevStock,
            newStock: nextStock,
            reason: 'Admin product edit',
            actorEmail: (user.email || 'admin').slice(0, 200),
            createdAt: serverTimestamp(),
          });
        }
      } else {
        await setDoc(ref, { ...base, createdAt: serverTimestamp() });
        const histId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await setDoc(doc(db, 'stockHistory', histId), {
          id: histId,
          productId: id,
          productName: product.name.slice(0, 140),
          sku: product.sku.slice(0, 48),
          change: nextStock,
          previousStock: 0,
          newStock: nextStock,
          reason: 'Initial catalog creation',
          actorEmail: (user.email || 'admin').slice(0, 200),
          createdAt: serverTimestamp(),
        });
      }
      showToast(`Saved "${product.name}".`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
    }
  };

  const duplicateProduct = async (product: Product) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const suffix = Math.random().toString(36).slice(2, 6);
    const newId = `${product.id.slice(0, 90)}-copy-${suffix}`;
    await saveProduct({
      ...product,
      id: newId,
      sku: `${product.sku.slice(0, 38)}-COPY-${suffix.toUpperCase()}`,
      name: `${product.name.slice(0, 128)} (Copy)`,
      status: 'draft',
      slug: newId,
    });
  };

  const updateProductSeo: StoreContextValue['updateProductSeo'] = async (productId, seo) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const existing = allCatalogProducts.find((p) => p.id === productId);
    if (!existing) throw new Error('Product not found');
    const ref = doc(db, 'products', productId);
    try {
      const snap = await getDoc(ref);
      const seoFields = {
        seoTitle: seo.seoTitle.trim().slice(0, 160),
        metaDescription: seo.metaDescription.trim().slice(0, 320),
        focusKeyword: seo.focusKeyword.trim().slice(0, 80),
        slug: seo.slug.trim().slice(0, 140),
        imageAlt: seo.imageAlt.trim().slice(0, 200),
        ogImageUrl: seo.ogImageUrl.trim().slice(0, 1000),
        updatedAt: serverTimestamp(),
      };
      if (snap.exists()) {
        await updateDoc(ref, seoFields);
      } else {
        await setDoc(ref, {
          id: existing.id,
          sku: existing.sku,
          name: existing.name,
          brand: existing.brand || 'NOSIF WORLDS',
          division: existing.division,
          category: existing.category,
          priceBdt: existing.priceBdt,
          ...(existing.compareAtBdt ? { compareAtBdt: existing.compareAtBdt } : {}),
          description: existing.description,
          imageUrl: existing.imageUrl,
          galleryUrls: existing.galleryUrls || [existing.imageUrl],
          sizes: existing.sizes,
          colors: existing.colors,
          specs: existing.specs || [],
          tags: existing.tags || [],
          stock: existing.stock,
          featured: existing.featured,
          isNewArrival: existing.isNewArrival,
          isBestSeller: existing.isBestSeller,
          status: existing.status || 'active',
          ...seoFields,
          createdAt: serverTimestamp(),
        });
      }
      showToast(`SEO metadata updated for "${existing.name}".`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${productId}`);
    }
  };

  const adjustProductStock = async (product: Product, newStock: number, reason: string) => {
    if (!isAdmin || !user) throw new Error('Admin authorization required.');
    const clamped = Math.max(0, Math.round(newStock));
    const ref = doc(db, 'products', product.id);
    try {
      const snap = await getDoc(ref);
      const prevStock = snap.exists() ? Number(snap.data().stock ?? product.stock) : product.stock;
      if (snap.exists()) {
        await updateDoc(ref, { stock: clamped, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, {
          id: product.id,
          sku: product.sku,
          name: product.name,
          division: product.division,
          category: product.category,
          priceBdt: product.priceBdt,
          description: product.description,
          imageUrl: product.imageUrl,
          sizes: product.sizes,
          colors: product.colors,
          specs: product.specs || [],
          stock: clamped,
          featured: product.featured,
          isNewArrival: product.isNewArrival,
          isBestSeller: product.isBestSeller,
          status: product.status || 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      const histId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'stockHistory', histId), {
        id: histId,
        productId: product.id,
        productName: product.name.slice(0, 140),
        sku: product.sku.slice(0, 48),
        change: clamped - prevStock,
        previousStock: prevStock,
        newStock: clamped,
        reason: reason.slice(0, 160),
        actorEmail: (user.email || 'admin').slice(0, 200),
        createdAt: serverTimestamp(),
      });
      showToast(`Updated stock for "${product.name}" to ${clamped}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
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

  const saveCategory: StoreContextValue['saveCategory'] = async (category) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    const id = category.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
    try {
      await setDoc(doc(db, 'categories', id), {
        id,
        name: category.name.trim().slice(0, 64),
        division: category.division,
        description: (category.description || '').trim().slice(0, 300),
        subcategories: (category.subcategories || []).map((s) => s.trim().slice(0, 64)).filter(Boolean).slice(0, 25),
        imageUrl: (category.imageUrl || '').trim().slice(0, 1000),
        isVisible: category.isVisible !== false,
        updatedAt: serverTimestamp(),
      });
      showToast(`Category "${category.name}" saved.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      showToast('Category deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
    }
  };

  const updateOrderStatus: StoreContextValue['updateOrderStatus'] = async (orderId, updates) => {
    if (!isAdmin || !user) throw new Error('Admin authorization required.');
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);
      const isConfirming = ['confirmed', 'processing', 'shipped', 'delivered'].includes(
        updates.fulfillmentStatus,
      );
      const isCancelling = updates.fulfillmentStatus === 'cancelled';

      let nextStockDeducted = Boolean(order.stockDeducted);

      // Automatic Stock Deduction upon Confirmation
      if (isConfirming && !order.stockDeducted && storeSettings.autoDeductStockOnConfirm) {
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(prodRef);
          const catalogMatch = allCatalogProducts.find((p) => p.id === item.productId);
          const prevStock = prodSnap.exists()
            ? Number(prodSnap.data().stock ?? 0)
            : Number(catalogMatch?.stock ?? 0);
          const nextStock = Math.max(0, prevStock - item.quantity);

          if (prodSnap.exists()) {
            batch.update(prodRef, { stock: nextStock, updatedAt: serverTimestamp() });
          } else if (catalogMatch) {
            batch.set(prodRef, {
              id: catalogMatch.id,
              sku: catalogMatch.sku,
              name: catalogMatch.name,
              division: catalogMatch.division,
              category: catalogMatch.category,
              priceBdt: catalogMatch.priceBdt,
              description: catalogMatch.description,
              imageUrl: catalogMatch.imageUrl,
              sizes: catalogMatch.sizes,
              colors: catalogMatch.colors,
              specs: catalogMatch.specs || [],
              stock: nextStock,
              featured: catalogMatch.featured,
              isNewArrival: catalogMatch.isNewArrival,
              isBestSeller: catalogMatch.isBestSeller,
              status: catalogMatch.status || 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          const histId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          batch.set(doc(db, 'stockHistory', histId), {
            id: histId,
            productId: item.productId,
            productName: item.name.slice(0, 140),
            sku: item.sku.slice(0, 48),
            change: -Math.abs(item.quantity),
            previousStock: prevStock,
            newStock: nextStock,
            reason: `Order confirmed (${order.orderNumber})`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            actorEmail: (user.email || 'admin').slice(0, 200),
            createdAt: serverTimestamp(),
          });
        }
        nextStockDeducted = true;
      }

      // Automatic Stock Restoration upon Cancellation
      if (isCancelling && order.stockDeducted && storeSettings.autoRestoreStockOnCancel) {
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(prodRef);
          const catalogMatch = allCatalogProducts.find((p) => p.id === item.productId);
          const prevStock = prodSnap.exists()
            ? Number(prodSnap.data().stock ?? 0)
            : Number(catalogMatch?.stock ?? 0);
          const nextStock = prevStock + item.quantity;

          if (prodSnap.exists()) {
            batch.update(prodRef, { stock: nextStock, updatedAt: serverTimestamp() });
          }

          const histId = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          batch.set(doc(db, 'stockHistory', histId), {
            id: histId,
            productId: item.productId,
            productName: item.name.slice(0, 140),
            sku: item.sku.slice(0, 48),
            change: Math.abs(item.quantity),
            previousStock: prevStock,
            newStock: nextStock,
            reason: `Order cancelled (${order.orderNumber})`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            actorEmail: (user.email || 'admin').slice(0, 200),
            createdAt: serverTimestamp(),
          });
        }
        nextStockDeducted = false;
      }

      const discountVal =
        typeof updates.discountBdt === 'number'
          ? Math.max(0, updates.discountBdt)
          : Number(order.discountBdt || 0);
      const nextTotal = Math.max(0, order.subtotalBdt + order.shippingBdt - discountVal);

      const orderPatch: Record<string, unknown> = {
        fulfillmentStatus: updates.fulfillmentStatus,
        paymentStatus: updates.paymentStatus,
        stockDeducted: nextStockDeducted,
        discountBdt: discountVal,
        totalBdt: nextTotal,
        updatedAt: serverTimestamp(),
      };
      if (typeof updates.transactionId === 'string') {
        orderPatch.transactionId = updates.transactionId.trim().slice(0, 120);
      }
      if (updates.refundStatus) {
        orderPatch.refundStatus = updates.refundStatus;
      }

      batch.update(orderRef, orderPatch);
      await batch.commit();
      acknowledgeOrderNotification(orderId);
      showToast(`Order ${order.orderNumber} updated.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      showToast('Order deleted permanently.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
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

  const saveStoreSettings: StoreContextValue['saveStoreSettings'] = async (settings) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await setDoc(doc(db, 'settings', 'store'), {
        id: 'store',
        autoDeductStockOnConfirm: Boolean(settings.autoDeductStockOnConfirm),
        autoRestoreStockOnCancel: Boolean(settings.autoRestoreStockOnCancel),
        lowStockThreshold: Math.max(0, Math.min(500, Math.round(Number(settings.lowStockThreshold)))),
        alertSoundEnabled: Boolean(settings.alertSoundEnabled),
        codEnabled: Boolean(settings.codEnabled),
        bkashEnabled: Boolean(settings.bkashEnabled),
        nagadEnabled: Boolean(settings.nagadEnabled),
        sslcommerzEnabled: Boolean(settings.sslcommerzEnabled),
        dhakaShippingBdt: Math.max(0, Number(settings.dhakaShippingBdt)),
        outsideDhakaShippingBdt: Math.max(0, Number(settings.outsideDhakaShippingBdt)),
        freeShippingThresholdBdt: Math.max(0, Number(settings.freeShippingThresholdBdt)),
        updatedAt: serverTimestamp(),
      });
      showToast('Store settings saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/store');
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

  const deleteNewsletterSubscriber = async (subscriberId: string) => {
    if (!isAdmin) throw new Error('Admin authorization required.');
    try {
      await deleteDoc(doc(db, 'newsletter', subscriberId));
      showToast('Subscriber removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `newsletter/${subscriberId}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        route,
        navigate,
        searchModalOpen,
        searchInitialQuery,
        openSearchModal,
        closeSearchModal,
        user,
        authReady,
        isAdmin,
        signInWithGoogle,
        signInWithEmailPassword,
        resendVerificationEmail,
        signOutUser,
        userProfile,
        updateUserProfile,
        products,
        allCatalogProducts,
        productsFromDb: dbProducts.length > 0,
        categories,
        visibleCategories,
        articles,
        siteContent,
        storeSettings,
        reviews,
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        moveWishlistToCart,
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
        subscribeNewsletter,
        logAiConversation,
        allOrders,
        allUsers,
        allReviews,
        allInquiries,
        allAiLogs,
        stockHistory,
        newsletterSubscribers,
        unreadOrderNotifications,
        acknowledgedOrderIds,
        acknowledgeOrderNotification,
        acknowledgeAllNotifications,
        playAlertSound,
        seedFirestoreCatalog,
        saveProduct,
        duplicateProduct,
        updateProductSeo,
        adjustProductStock,
        deleteProduct,
        saveCategory,
        deleteCategory,
        updateOrderStatus,
        deleteOrder,
        updateReviewStatus,
        deleteReview,
        saveSiteContent,
        saveStoreSettings,
        saveArticle,
        deleteArticle,
        resolveInquiry,
        deleteNewsletterSubscriber,
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
