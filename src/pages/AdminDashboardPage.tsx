import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  CreditCard,
  Crown,
  FileText,
  FolderTree,
  Globe,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatBdt } from '../data/catalog';
import { Order } from '../types';
import { BrandCrest } from '../components/BrandLogo';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminTab } from '../components/admin/adminUtils';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminProductSeo, AdminProductsStock } from '../components/admin/AdminProductsSeo';
import {
  AdminCategories,
  AdminCustomers,
  AdminPayments,
} from '../components/admin/AdminCategoriesCustomersPayments';
import {
  AdminNotifications,
  AdminSettings,
  AdminWebsiteContent,
} from '../components/admin/AdminContentNotificationsSettings';

export function AdminDashboardPage() {
  const {
    user,
    authReady,
    isAdmin,
    signOutUser,
    navigate,
    allCatalogProducts,
    productsFromDb,
    categories,
    allOrders,
    allUsers,
    allReviews,
    allInquiries,
    allAiLogs,
    stockHistory,
    newsletterSubscribers,
    unreadOrderNotifications,
    acknowledgedOrderIds,
    acknowledgeAllNotifications,
    playAlertSound,
    articles,
    siteContent,
    storeSettings,
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
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addProductTrigger, setAddProductTrigger] = useState(0);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setBrandMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const lowOutStockCount = useMemo(() => {
    const threshold = storeSettings.lowStockThreshold ?? 5;
    return allCatalogProducts.filter((p) => p.stock <= threshold).length;
  }, [allCatalogProducts, storeSettings.lowStockThreshold]);

  const totalNotificationCount = unreadOrderNotifications.length + lowOutStockCount;
  const openOrdersCount = useMemo(
    () =>
      allOrders.filter((o) =>
        ['new', 'pending', 'confirmed', 'processing'].includes(o.fulfillmentStatus),
      ).length,
    [allOrders],
  );

  // Instant Global Admin Quick-Jump Search
  const quickSearchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { orders: [], products: [], customers: [] };
    return {
      orders: allOrders
        .filter((o) =>
          `${o.orderNumber} ${o.customerName} ${o.customerPhone}`.toLowerCase().includes(q),
        )
        .slice(0, 4),
      products: allCatalogProducts
        .filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q))
        .slice(0, 4),
      customers: allUsers
        .filter((u) => `${u.displayName} ${u.email} ${u.phone || ''}`.toLowerCase().includes(q))
        .slice(0, 3),
    };
  }, [globalQuery, allOrders, allCatalogProducts, allUsers]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center text-sm">
        Verifying NOSIF WORLDS administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLoginPage />;
  }

  const adminDisplayName = user.displayName || 'Aminul Islam Nosif';
  const adminInitials = adminDisplayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: openOrdersCount > 0 ? openOrdersCount : undefined,
    },
    { id: 'products', label: 'Products & Stock', icon: <Package className="w-4 h-4" /> },
    { id: 'seo', label: 'Product SEO', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'content', label: 'Website Content', icon: <FileText className="w-4 h-4" /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: totalNotificationCount > 0 ? totalNotificationCount : undefined,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleOpenOrderFromAnywhere = (order: Order) => {
    setActiveTab('orders');
    setSelectedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] text-[#09090B] flex font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Obsidian Black Luxury Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#09090B] text-white flex flex-col justify-between border-r border-white/10 transition-transform duration-200 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
            <div className="flex flex-col items-center w-full text-center space-y-1.5">
              <div className="w-10 h-10 rounded-lg border border-[#C8A252]/50 bg-[#141416] flex items-center justify-center">
                <BrandCrest className="w-5 h-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-[0.14em] text-[#E5BC64] uppercase">
                NOSIF WORLDS
              </span>
              <span className="text-[11px] text-zinc-400">Admin Panel</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-3 top-4 p-1.5 text-zinc-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 11 Menu Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] font-bold shadow-sm'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={active ? 'text-[#09090B]' : 'text-[#C8A252]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        active
                          ? 'bg-[#09090B] text-[#E5BC64]'
                          : item.id === 'notifications'
                            ? 'bg-red-500 text-white'
                            : 'bg-[#C8A252]/20 text-[#E5BC64]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* 11th Item: Sign Out */}
            <button
              type="button"
              onClick={async () => {
                await signOutUser();
                navigate({ page: 'admin-login' });
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#C8A252]" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* Bottom Promo Box + Super Admin Profile Footer */}
        <div className="p-3 space-y-3 border-t border-white/10">
          <div className="rounded-xl border border-[#C8A252]/50 bg-gradient-to-br from-[#1A1610] to-[#09090B] p-3 text-center space-y-1">
            <div className="flex justify-center">
              <Crown className="w-4 h-4 text-[#E5BC64]" />
            </div>
            <p className="font-display text-xs font-bold tracking-[0.14em] text-[#E5BC64] uppercase">
              NOSIF WORLDS
            </p>
            <p className="text-[11px] font-semibold text-white">E-commerce Admin</p>
            <p className="text-[10px] text-[#C8A252]">Manage · Grow · Succeed</p>
          </div>

          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E5BC64] to-[#9E7B31] text-[#09090B] font-bold text-xs flex items-center justify-center shrink-0">
              {adminInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminDisplayName}</p>
              <p className="text-[10px] text-[#E5BC64] font-medium">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Bright Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200/80 px-4 sm:px-7 h-16 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 flex-1 max-w-xl relative">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search orders, products, customers..."
                className="w-full pl-10 pr-16 py-2 bg-[#FAFAFB] border border-zinc-200 rounded-xl text-xs text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#C8A252] focus:bg-white"
              />
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-mono text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2">
                Ctrl + K
              </span>

              {/* Quick-Jump Search Results Popover */}
              {searchFocused && globalQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-11 bg-white border border-zinc-200 rounded-2xl shadow-xl p-3 space-y-3 z-50 text-xs max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <span>Quick Jump Results</span>
                    <button
                      type="button"
                      onClick={() => setSearchFocused(false)}
                      className="text-zinc-500 hover:text-[#09090B]"
                    >
                      Close
                    </button>
                  </div>

                  {quickSearchResults.orders.length === 0 &&
                  quickSearchResults.products.length === 0 &&
                  quickSearchResults.customers.length === 0 ? (
                    <p className="p-3 text-center text-zinc-500">No matching records found.</p>
                  ) : (
                    <>
                      {quickSearchResults.orders.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-1">
                            Orders
                          </p>
                          {quickSearchResults.orders.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                setGlobalQuery('');
                                handleOpenOrderFromAnywhere(o);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-50 flex items-center justify-between"
                            >
                              <span className="font-mono font-bold text-[#09090B]">
                                {o.orderNumber} · {o.customerName}
                              </span>
                              <span className="font-mono text-[#9E7B31]">
                                {formatBdt(o.totalBdt)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {quickSearchResults.products.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-1">
                            Products
                          </p>
                          {quickSearchResults.products.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                setGlobalQuery('');
                                setActiveTab('products');
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-50 flex items-center justify-between"
                            >
                              <span className="font-semibold text-[#09090B] truncate">
                                {p.name} ({p.sku})
                              </span>
                              <span className="font-mono text-zinc-600">{formatBdt(p.priceBdt)}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {quickSearchResults.customers.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-1">
                            Customers
                          </p>
                          {quickSearchResults.customers.map((u) => (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                setGlobalQuery('');
                                setActiveTab('customers');
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-50 flex items-center justify-between"
                            >
                              <span className="font-semibold text-[#09090B]">
                                {u.displayName}
                              </span>
                              <span className="text-zinc-500">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              aria-label="Open notifications"
              className="relative w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-700 hover:border-[#C8A252] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {totalNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  {totalNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              title="Visit Live Storefront"
              className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-700 hover:border-[#C8A252] transition-colors"
            >
              <Globe className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setBrandMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#09090B] text-white text-xs font-bold border border-[#C8A252]/40 hover:bg-[#18181B]"
              >
                <BrandCrest className="w-4 h-4" />
                <span className="hidden sm:inline tracking-wider">NOSIF WORLDS</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#E5BC64]" />
              </button>

              {brandMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 text-xs z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandMenuOpen(false);
                      navigate({ page: 'home' });
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 font-medium"
                  >
                    Visit Storefront
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 font-medium"
                  >
                    Automation Settings
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setBrandMenuOpen(false);
                      await signOutUser();
                      navigate({ page: 'admin-login' });
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-700 font-semibold border-t border-zinc-100 mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1440px] w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverview
              adminName={adminDisplayName}
              orders={allOrders}
              products={allCatalogProducts}
              users={allUsers}
              storeSettings={storeSettings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenOrder={handleOpenOrderFromAnywhere}
              onQuickAddProduct={() => {
                setActiveTab('products');
                setAddProductTrigger((n) => n + 1);
              }}
              onVisitStorefront={() => navigate({ page: 'home' })}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrders
              orders={allOrders}
              siteContent={siteContent}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onUpdateOrder={updateOrderStatus}
              onDeleteOrder={deleteOrder}
              onMarkAllRead={acknowledgeAllNotifications}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsStock
              products={allCatalogProducts}
              categories={categories}
              stockHistory={stockHistory}
              storeSettings={storeSettings}
              productsFromDb={productsFromDb}
              openAddTrigger={addProductTrigger}
              onSeedCatalog={seedFirestoreCatalog}
              onSaveProduct={saveProduct}
              onDuplicateProduct={duplicateProduct}
              onDeleteProduct={deleteProduct}
              onAdjustStock={adjustProductStock}
            />
          )}

          {activeTab === 'seo' && (
            <AdminProductSeo
              products={allCatalogProducts}
              onSaveSeo={updateProductSeo}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories
              categories={categories}
              products={allCatalogProducts}
              onSaveCategory={saveCategory}
              onDeleteCategory={deleteCategory}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomers
              users={allUsers}
              orders={allOrders}
              onOpenOrder={handleOpenOrderFromAnywhere}
            />
          )}

          {activeTab === 'payments' && (
            <AdminPayments
              orders={allOrders}
              storeSettings={storeSettings}
              onSaveSettings={saveStoreSettings}
              onUpdateOrder={updateOrderStatus}
            />
          )}

          {activeTab === 'content' && (
            <AdminWebsiteContent
              siteContent={siteContent}
              products={allCatalogProducts}
              articles={articles}
              subscribers={newsletterSubscribers}
              onSaveSiteContent={saveSiteContent}
              onSaveProduct={saveProduct}
              onSaveArticle={saveArticle}
              onDeleteArticle={deleteArticle}
              onDeleteSubscriber={deleteNewsletterSubscriber}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotifications
              orders={allOrders}
              products={allCatalogProducts}
              users={allUsers}
              inquiries={allInquiries}
              reviews={allReviews}
              aiLogs={allAiLogs}
              storeSettings={storeSettings}
              acknowledgedOrderIds={acknowledgedOrderIds}
              onOpenOrder={handleOpenOrderFromAnywhere}
              onAcknowledgeAll={acknowledgeAllNotifications}
              onPlayAlertSound={playAlertSound}
              onSaveSettings={saveStoreSettings}
              onResolveInquiry={resolveInquiry}
              onUpdateReviewStatus={updateReviewStatus}
              onDeleteReview={deleteReview}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              storeSettings={storeSettings}
              adminEmail={user.email || ''}
              onSaveSettings={saveStoreSettings}
              onPlayAlertSound={playAlertSound}
            />
          )}
        </main>
      </div>
    </div>
  );
}
