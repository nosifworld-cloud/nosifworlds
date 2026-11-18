export type Division = 'fashion' | 'electronics';

export type FashionCategory =
  | "Men's Fashion"
  | "Women's Fashion"
  | 'Clothing'
  | 'Shoes'
  | 'Watches'
  | 'Bags'
  | 'Accessories';

export type ElectronicsCategory =
  | 'Smartphones'
  | 'Headphones'
  | 'Computers'
  | 'Laptops'
  | 'Smart Watches'
  | 'Accessories'
  | 'Gadgets';

export type ProductCategory = FashionCategory | ElectronicsCategory;

export interface Product {
  id: string;
  sku: string;
  name: string;
  division: Division;
  category: ProductCategory | string;
  priceBdt: number;
  compareAtBdt?: number;
  description: string;
  imageUrl: string;
  sizes: string[];
  colors: string[];
  specs?: string[];
  stock: number;
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  division: Division;
  priceBdt: number;
  imageUrl: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'SSLCommerz' | 'COD';
export type PaymentStatus = 'pending_gateway' | 'cod_pending' | 'verified' | 'failed';
export type FulfillmentStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode?: string;
  items: CartItem[];
  subtotalBdt: number;
  shippingBdt: number;
  totalBdt: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  authorName: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
}

export interface SiteContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  offerBanner: string;
  supportEmail: string;
  whatsappNumber: string;
  showroomAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  updatedAt?: string;
}

export interface Inquiry {
  id: string;
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AiConversationLog {
  id: string;
  userId: string;
  customerEmail?: string;
  lastPrompt: string;
  lastReply: string;
  language: 'en' | 'bn' | 'mixed';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AppRoute =
  | { page: 'home' }
  | { page: 'about' }
  | { page: 'fashion'; category?: string }
  | { page: 'electronics'; category?: string }
  | { page: 'shop'; query?: string; division?: Division | 'all' }
  | { page: 'product'; productId: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'account' }
  | { page: 'orders' }
  | { page: 'journal'; articleId?: string }
  | { page: 'reviews' }
  | { page: 'contact' }
  | { page: 'privacy' }
  | { page: 'terms' }
  | { page: 'admin' };
