import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { formatBdt } from '../../data/catalog';
import { Order, Product, StoreSettings, UserProfile } from '../../types';
import { LuxuryImage } from '../BrandLogo';
import { AdminTab, FULFILLMENT_BADGE_CLASSES, FULFILLMENT_LABELS } from './adminUtils';

interface AdminOverviewProps {
  adminName: string;
  orders: Order[];
  products: Product[];
  users: UserProfile[];
  storeSettings: StoreSettings;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenOrder: (order: Order) => void;
  onQuickAddProduct: () => void;
  onVisitStorefront: () => void;
}

type TimeRange = '7d' | '30d' | 'all';
type ChartGranularity = 'daily' | 'weekly' | 'monthly';

export function AdminOverview({
  adminName,
  orders,
  products,
  users,
  storeSettings,
  onNavigateTab,
  onOpenOrder,
  onQuickAddProduct,
  onVisitStorefront,
}: AdminOverviewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [granularity, setGranularity] = useState<ChartGranularity>('daily');
  const [hoveredBucketIdx, setHoveredBucketIdx] = useState<number | null>(null);

  const rangedOrders = useMemo(() => {
    if (timeRange === 'all') return orders;
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });
  }, [orders, timeRange]);

  const metrics = useMemo(() => {
    const activeOrders = rangedOrders.filter((o) => o.fulfillmentStatus !== 'cancelled');
    const totalRevenue = activeOrders.reduce((acc, o) => acc + o.totalBdt, 0);
    const confirmedRevenue = activeOrders
      .filter((o) => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.fulfillmentStatus))
      .reduce((acc, o) => acc + o.totalBdt, 0);

    const newCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'new').length;
    const pendingCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'pending').length;
    const confirmedCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'confirmed').length;
    const processingCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'processing').length;
    const shippedCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'shipped').length;
    const deliveredCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'delivered').length;
    const cancelledCount = rangedOrders.filter((o) => o.fulfillmentStatus === 'cancelled').length;

    const threshold = storeSettings.lowStockThreshold ?? 5;
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= threshold).length;
    const outOfStockProducts = products.filter((p) => p.stock <= 0).length;

    return {
      totalRevenue,
      confirmedRevenue,
      totalOrders: rangedOrders.length,
      newAndPending: newCount + pendingCount,
      newCount,
      pendingCount,
      confirmedCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      totalProducts: products.length,
      lowStockProducts,
      outOfStockProducts,
      totalCustomers: users.length,
    };
  }, [rangedOrders, products, users.length, storeSettings.lowStockThreshold]);

  // Real time-series buckets for Sales Overview chart
  const chartBuckets = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; revenue: number; count: number }[] = [];

    if (granularity === 'daily') {
      const days = timeRange === '7d' ? 7 : 12;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        buckets.push({ key, label, revenue: 0, count: 0 });
      }
      for (const o of orders) {
        if (o.fulfillmentStatus === 'cancelled') continue;
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        const target = buckets.find((b) => b.key === key);
        if (target) {
          target.revenue += o.totalBdt;
          target.count += 1;
        }
      }
    } else if (granularity === 'weekly') {
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        buckets.push({
          key: `${start.getTime()}-${end.getTime()}`,
          label,
          revenue: 0,
          count: 0,
        });
      }
      for (const o of orders) {
        if (o.fulfillmentStatus === 'cancelled') continue;
        const ts = new Date(o.createdAt).getTime();
        for (const b of buckets) {
          const [s, e] = b.key.split('-').map(Number);
          if (ts >= s - 86400000 && ts <= e + 86400000) {
            b.revenue += o.totalBdt;
            b.count += 1;
            break;
          }
        }
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        buckets.push({ key, label, revenue: 0, count: 0 });
      }
      for (const o of orders) {
        if (o.fulfillmentStatus === 'cancelled') continue;
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const target = buckets.find((b) => b.key === key);
        if (target) {
          target.revenue += o.totalBdt;
          target.count += 1;
        }
      }
    }
    return buckets;
  }, [orders, granularity, timeRange]);

  const maxChartRevenue = Math.max(1, ...chartBuckets.map((b) => b.revenue));
  const maxChartCount = Math.max(1, ...chartBuckets.map((b) => b.count));

  // Best selling products ranked strictly by real orders
  const bestSellingProducts = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; name: string; imageUrl: string; priceBdt: number; soldQty: number; revenueBdt: number }
    >();
    for (const o of orders) {
      if (o.fulfillmentStatus === 'cancelled') continue;
      for (const item of o.items) {
        const current = map.get(item.productId) || {
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          priceBdt: item.priceBdt,
          soldQty: 0,
          revenueBdt: 0,
        };
        current.soldQty += item.quantity;
        current.revenueBdt += item.priceBdt * item.quantity;
        map.set(item.productId, current);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 4);
  }, [orders]);

  // Donut segments
  const statusSegments = useMemo(() => {
    const list = [
      { label: 'New', count: metrics.newCount, color: '#09090B' },
      { label: 'Pending', count: metrics.pendingCount, color: '#E5BC64' },
      { label: 'Confirmed', count: metrics.confirmedCount, color: '#C8A252' },
      { label: 'Processing', count: metrics.processingCount, color: '#71717A' },
      { label: 'Shipped', count: metrics.shippedCount, color: '#3F3F46' },
      { label: 'Delivered', count: metrics.deliveredCount, color: '#10B981' },
      { label: 'Cancelled', count: metrics.cancelledCount, color: '#DC2626' },
    ];
    const total = list.reduce((a, s) => a + s.count, 0);
    let offset = 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    return list.map((seg) => {
      const fraction = total > 0 ? seg.count / total : 0;
      const dashLength = fraction * circumference;
      const dashOffset = -offset;
      offset += dashLength;
      return { ...seg, fraction, dashLength, dashOffset, circumference, radius };
    });
  }, [metrics]);

  // Sparkline SVG path helper built strictly from chartBuckets
  const sparkPath = (values: number[]) => {
    const w = 64;
    const h = 24;
    const max = Math.max(1, ...values);
    if (values.length <= 1) return `M0,${h - 2} L${w},${h - 2}`;
    return values
      .map((v, idx) => {
        const x = (idx / (values.length - 1)) * w;
        const y = h - 3 - (v / max) * (h - 6);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Row matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF6E7] border border-[#E5BC64]/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#B48A2D]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#09090B]">
              Dashboard Overview
            </h1>
            <p className="text-sm text-zinc-500">
              Welcome back, <span className="font-semibold text-[#09090B]">{adminName}</span>! Here&apos;s your live Firestore store ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-xs">
            {(
              [
                { id: '7d' as const, label: 'Last 7 Days' },
                { id: '30d' as const, label: 'Last 30 Days' },
                { id: 'all' as const, label: 'All Time' },
              ]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeRange(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  timeRange === item.id
                    ? 'bg-[#09090B] text-white'
                    : 'text-zinc-600 hover:text-[#09090B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Hero KPI Cards (Matching Reference Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#09090B] text-[#E5BC64] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">Total Revenue</p>
              <p className="font-mono text-2xl font-bold text-[#09090B] tabular-nums truncate">
                {formatBdt(metrics.totalRevenue)}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                Confirmed: {formatBdt(metrics.confirmedRevenue)}
              </p>
            </div>
          </div>
          <svg width="64" height="26" viewBox="0 0 64 26" className="shrink-0" aria-hidden="true">
            <path
              d={sparkPath(chartBuckets.map((b) => b.revenue))}
              fill="none"
              stroke="#C8A252"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#D9AF54] text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">Total Orders</p>
              <p className="font-mono text-2xl font-bold text-[#09090B] tabular-nums">
                {metrics.totalOrders}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                {timeRange === '7d' ? 'Past 7 days' : timeRange === '30d' ? 'Past 30 days' : 'All recorded'}
              </p>
            </div>
          </div>
          <svg width="64" height="26" viewBox="0 0 64 26" className="shrink-0" aria-hidden="true">
            <path
              d={sparkPath(chartBuckets.map((b) => b.count))}
              fill="none"
              stroke="#C8A252"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Card 3: New / Pending Orders */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">New &amp; Pending</p>
              <p className="font-mono text-2xl font-bold text-[#09090B] tabular-nums">
                {metrics.newAndPending}
              </p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                {metrics.confirmedCount} confirmed · {metrics.processingCount} processing
              </p>
            </div>
          </div>
          <svg width="64" height="26" viewBox="0 0 64 26" className="shrink-0" aria-hidden="true">
            <path
              d={sparkPath(chartBuckets.map((b) => (b.count > 0 ? b.count : 0.2)))}
              fill="none"
              stroke="#C8A252"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Card 4: Delivered Orders */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#C8A252] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">Delivered Orders</p>
              <p className="font-mono text-2xl font-bold text-[#09090B] tabular-nums">
                {metrics.deliveredCount}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                {metrics.shippedCount} in transit · {metrics.cancelledCount} cancelled
              </p>
            </div>
          </div>
          <svg width="64" height="26" viewBox="0 0 64 26" className="shrink-0" aria-hidden="true">
            <path
              d={sparkPath(chartBuckets.map((b) => b.revenue * 0.8))}
              fill="none"
              stroke="#C8A252"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Complete Store Metrics Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'New / Pending', value: metrics.newAndPending, accent: 'text-amber-700' },
          { label: 'Confirmed', value: metrics.confirmedCount, accent: 'text-emerald-700' },
          { label: 'Processing', value: metrics.processingCount, accent: 'text-sky-700' },
          { label: 'Shipped', value: metrics.shippedCount, accent: 'text-indigo-700' },
          { label: 'Cancelled', value: metrics.cancelledCount, accent: 'text-red-700' },
          { label: 'Total Products', value: metrics.totalProducts, accent: 'text-[#09090B]' },
          { label: 'Low Stock', value: metrics.lowStockProducts, accent: 'text-amber-700' },
          { label: 'Out of Stock', value: metrics.outOfStockProducts, accent: 'text-red-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-zinc-200/80 rounded-xl px-3.5 py-3 shadow-xs"
          >
            <p className="text-[11px] font-medium text-zinc-500 truncate">{stat.label}</p>
            <p className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${stat.accent}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Analytics Row: Sales Overview Chart + Order Status Donut + Best Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Overview Bar + Trend Line Chart */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C8A252]" />
              <h2 className="text-base font-bold text-[#09090B]">Sales Overview</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#09090B]" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#C8A252]" /> Orders
                </span>
              </div>
              <div className="inline-flex bg-zinc-100 rounded-lg p-0.5 text-[11px]">
                {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`px-2 py-1 rounded-md capitalize font-semibold ${
                      granularity === g ? 'bg-white text-[#09090B] shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-56 pt-4">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-[#09090B]">No orders recorded yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Daily, weekly, and monthly revenue bars appear here automatically as real customer orders arrive.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                <div className="relative flex-1 flex items-end gap-1.5 border-b border-zinc-100 pb-1">
                  {/* Trend SVG overlay */}
                  <svg
                    viewBox={`0 0 ${chartBuckets.length * 40} 140`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <polyline
                      fill="none"
                      stroke="#C8A252"
                      strokeWidth="2.5"
                      points={chartBuckets
                        .map((b, i) => {
                          const x = i * 40 + 20;
                          const y = 132 - (b.count / maxChartCount) * 112;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {chartBuckets.map((b, i) => {
                      const x = i * 40 + 20;
                      const y = 132 - (b.count / maxChartCount) * 112;
                      return (
                        <circle
                          key={b.key}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#C8A252"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>

                  {chartBuckets.map((b, idx) => {
                    const heightPct = Math.max(4, Math.round((b.revenue / maxChartRevenue) * 100));
                    return (
                      <div
                        key={b.key}
                        onMouseEnter={() => setHoveredBucketIdx(idx)}
                        onMouseLeave={() => setHoveredBucketIdx(null)}
                        className="relative flex-1 h-full flex items-end justify-center group"
                      >
                        {hoveredBucketIdx === idx && (
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 bg-[#09090B] text-white px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap shadow-lg">
                            <span className="font-mono font-semibold text-[#E5BC64]">
                              {formatBdt(b.revenue)}
                            </span>{' '}
                            · {b.count} ord
                          </div>
                        )}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-3/5 max-w-[20px] bg-[#09090B] group-hover:bg-[#C8A252] rounded-t-md transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-1 pt-2 overflow-hidden">
                  {chartBuckets.map((b, idx) => (
                    <span
                      key={b.key}
                      className={`flex-1 text-center text-[10px] text-zinc-500 truncate ${
                        chartBuckets.length > 8 && idx % 2 === 1 ? 'hidden sm:block' : ''
                      }`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C8A252]" />
              <h2 className="text-base font-bold text-[#09090B]">Order Status</h2>
            </div>
            <span className="text-xs text-zinc-500">{metrics.totalCustomers} Customers</span>
          </div>

          <div className="flex items-center justify-between gap-4 my-auto py-2">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
                <circle
                  cx="66"
                  cy="66"
                  r="52"
                  fill="none"
                  stroke="#F4F4F5"
                  strokeWidth="18"
                />
                {metrics.totalOrders > 0 &&
                  statusSegments.map(
                    (seg) =>
                      seg.count > 0 && (
                        <circle
                          key={seg.label}
                          cx="66"
                          cy="66"
                          r={seg.radius}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="18"
                          strokeDasharray={`${seg.dashLength} ${seg.circumference}`}
                          strokeDashoffset={seg.dashOffset}
                        />
                      ),
                  )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-2xl font-bold text-[#09090B] tabular-nums">
                  {metrics.totalOrders}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              {statusSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-zinc-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span>{seg.label}</span>
                  </span>
                  <span className="font-mono font-semibold text-[#09090B] tabular-nums">
                    {seg.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="lg:col-span-3 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#C8A252]" />
              <h2 className="text-base font-bold text-[#09090B]">Best Selling</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-zinc-600 hover:text-[#09090B] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 my-auto">
            {bestSellingProducts.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-xl p-5 text-center text-xs text-zinc-500">
                Top-selling SKUs rank here automatically once orders are placed.
              </div>
            ) : (
              bestSellingProducts.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-2.5 py-1.5 border-b border-zinc-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                      <LuxuryImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#09090B] truncate">{item.name}</p>
                      <p className="font-mono text-[11px] text-zinc-500 tabular-nums">
                        {formatBdt(item.priceBdt)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-[#FDF6E7] border border-[#E5BC64]/40 text-[11px] font-semibold text-[#8C6818] whitespace-nowrap shrink-0">
                    {item.soldQty} Sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders Table + Quick Actions & Visit Website Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#C8A252]" />
              <h2 className="text-base font-bold text-[#09090B]">Recent Orders</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-zinc-600 hover:text-[#09090B] inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center text-xs text-zinc-500">
              No orders recorded in Firestore yet. When a customer checks out from the storefront, it appears here in real time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                    <th className="py-2.5 pr-3">#</th>
                    <th className="py-2.5 pr-3">Order ID</th>
                    <th className="py-2.5 pr-3">Customer</th>
                    <th className="py-2.5 pr-3">Amount</th>
                    <th className="py-2.5 pr-3">Payment</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 pr-3">Date</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentOrders.map((order, idx) => (
                    <tr key={order.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 pr-3 font-mono text-zinc-400">#{idx + 1}</td>
                      <td className="py-3 pr-3 font-mono font-semibold text-[#09090B] whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 pr-3 font-medium text-[#09090B] whitespace-nowrap">
                        {order.customerName}
                      </td>
                      <td className="py-3 pr-3 font-mono font-semibold text-[#09090B] tabular-nums whitespace-nowrap">
                        {formatBdt(order.totalBdt)}
                      </td>
                      <td className="py-3 pr-3 text-zinc-600 whitespace-nowrap">
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${FULFILLMENT_BADGE_CLASSES[order.fulfillmentStatus]}`}
                        >
                          {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-zinc-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenOrder(order)}
                          className="px-3 py-1 rounded-lg bg-[#F5D687] hover:bg-[#E5BC64] text-[#09090B] font-semibold transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions + Visit Website Banner */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C8A252]" />
              <h2 className="text-base font-bold text-[#09090B]">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={onQuickAddProduct}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-[#FAFAFB] border border-zinc-200 hover:border-[#C8A252] hover:bg-[#FDF6E7]/50 transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-[#09090B] text-[#E5BC64] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#09090B]">Add Product</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-[#FAFAFB] border border-zinc-200 hover:border-[#C8A252] hover:bg-[#FDF6E7]/50 transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-[#09090B] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#09090B]">View Orders</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-[#FAFAFB] border border-zinc-200 hover:border-[#C8A252] hover:bg-[#FDF6E7]/50 transition-colors text-center"
              >
                <div className="w-9 h-9 rounded-full bg-[#09090B] text-[#E5BC64] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#09090B]">Manage Stock</span>
              </button>
            </div>
          </div>

          {/* Luxury Storefront Promo Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#09090B] border border-[#C8A252]/40 p-5 text-white shadow-md">
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 85% 30%, rgba(200,162,82,0.7), transparent 55%)',
              }}
            />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2 text-[#E5BC64]">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold tracking-[0.18em] uppercase">NOSIF WORLDS</span>
              </div>
              <p className="text-sm font-medium text-zinc-200">
                Single-Vendor Luxury Storefront · Real-Time Firestore Sync
              </p>
              <button
                type="button"
                onClick={onVisitStorefront}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E5BC64] to-[#C8A252] text-[#09090B] text-xs font-bold hover:opacity-95 transition-opacity"
              >
                <span>Visit Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
