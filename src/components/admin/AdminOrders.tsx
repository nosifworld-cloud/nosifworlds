import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  Mail,
  MessageCircle,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { formatBdt } from '../../data/catalog';
import {
  FulfillmentStatus,
  Order,
  PaymentStatus,
  RefundStatus,
  SiteContent,
} from '../../types';
import { LuxuryImage } from '../BrandLogo';
import {
  downloadCsvFile,
  downloadOrderInvoicePdf,
  FULFILLMENT_BADGE_CLASSES,
  FULFILLMENT_LABELS,
  PAYMENT_BADGE_CLASSES,
  PAYMENT_LABELS,
} from './adminUtils';

interface AdminOrdersProps {
  orders: Order[];
  siteContent: SiteContent;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onUpdateOrder: (
    orderId: string,
    updates: {
      fulfillmentStatus: FulfillmentStatus;
      paymentStatus: PaymentStatus;
      transactionId?: string;
      refundStatus?: RefundStatus;
      discountBdt?: number;
    },
  ) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onMarkAllRead: () => void;
}

export function AdminOrders({
  orders,
  siteContent,
  selectedOrder,
  onSelectOrder,
  onUpdateOrder,
  onDeleteOrder,
  onMarkAllRead,
}: AdminOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [editFulfillment, setEditFulfillment] = useState<FulfillmentStatus>('pending');
  const [editPayment, setEditPayment] = useState<PaymentStatus>('cod_pending');
  const [editTxId, setEditTxId] = useState('');
  const [editRefund, setEditRefund] = useState<RefundStatus>('none');
  const [editDiscount, setEditDiscount] = useState('0');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openOrderModal = (order: Order) => {
    setEditFulfillment(order.fulfillmentStatus);
    setEditPayment(order.paymentStatus);
    setEditTxId(order.transactionId || '');
    setEditRefund(order.refundStatus || 'none');
    setEditDiscount(String(order.discountBdt || 0));
    setConfirmDeleteId(null);
    onSelectOrder(order);
  };

  // Sync local editor values when external selection occurs (e.g., from Overview or Top Search)
  React.useEffect(() => {
    if (selectedOrder) {
      setEditFulfillment(selectedOrder.fulfillmentStatus);
      setEditPayment(selectedOrder.paymentStatus);
      setEditTxId(selectedOrder.transactionId || '');
      setEditRefund(selectedOrder.refundStatus || 'none');
      setEditDiscount(String(selectedOrder.discountBdt || 0));
      setConfirmDeleteId(null);
    }
  }, [selectedOrder?.id]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.fulfillmentStatus !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
      if (dateFrom) {
        const orderDay = new Date(o.createdAt).toISOString().slice(0, 10);
        if (orderDay < dateFrom) return false;
      }
      if (dateTo) {
        const orderDay = new Date(o.createdAt).toISOString().slice(0, 10);
        if (orderDay > dateTo) return false;
      }
      if (q) {
        const hay = `${o.orderNumber} ${o.customerName} ${o.customerPhone} ${o.customerEmail} ${o.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFrom, dateTo]);

  const handleExportCsv = () => {
    const rows: string[][] = [
      [
        'Order Number',
        'Date & Time',
        'Customer Name',
        'Phone',
        'Email',
        'City',
        'Address',
        'Items',
        'Subtotal (BDT)',
        'Delivery (BDT)',
        'Discount (BDT)',
        'Total (BDT)',
        'Payment Method',
        'Payment Status',
        'Transaction ID',
        'Order Status',
        'Special Instructions',
      ],
      ...filteredOrders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleString('en-BD'),
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.city,
        o.shippingAddress,
        o.items.map((i) => `${i.name} (${i.selectedSize}/${i.selectedColor}) x${i.quantity}`).join('; '),
        String(o.subtotalBdt),
        String(o.shippingBdt),
        String(o.discountBdt || 0),
        String(o.totalBdt),
        o.paymentMethod,
        o.paymentStatus,
        o.transactionId || '',
        o.fulfillmentStatus,
        o.specialInstructions || '',
      ]),
    ];
    downloadCsvFile(`nosif-worlds-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleSaveOrder = async (overrideFulfillment?: FulfillmentStatus) => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await onUpdateOrder(selectedOrder.id, {
        fulfillmentStatus: overrideFulfillment || editFulfillment,
        paymentStatus: editPayment,
        transactionId: editTxId,
        refundStatus: editRefund,
        discountBdt: Math.max(0, Number(editDiscount) || 0),
      });
      onSelectOrder(null);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickConfirm = async (order: Order) => {
    setSaving(true);
    try {
      await onUpdateOrder(order.id, {
        fulfillmentStatus: 'confirmed',
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        refundStatus: order.refundStatus,
        discountBdt: order.discountBdt,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async (orderId: string) => {
    setSaving(true);
    try {
      await onDeleteOrder(orderId);
      setConfirmDeleteId(null);
      onSelectOrder(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#09090B]">Orders Management</h1>
          <p className="text-sm text-zinc-500">
            Real-time customer checkout orders in BDT with automatic inventory control, invoices, and CSV export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:border-[#C8A252]"
          >
            Mark All Read
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#09090B] text-white rounded-xl text-xs font-semibold hover:bg-[#1C1C1F]"
          >
            <Download className="w-3.5 h-3.5 text-[#E5BC64]" />
            <span>Export CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, customer name, phone..."
            className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A252]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#C8A252]"
        >
          <option value="all">All Order Statuses</option>
          <option value="new">New</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#C8A252]"
        >
          <option value="all">All Payment Statuses</option>
          <option value="cod_pending">COD Pending</option>
          <option value="pending_gateway">Pending Gateway</option>
          <option value="verified">Paid / Verified</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Filter orders from date"
          className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#C8A252]"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Filter orders to date"
          className="border border-zinc-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#C8A252]"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-[#09090B]">No matching orders found</p>
            <p className="text-xs text-zinc-500">
              {orders.length === 0
                ? 'Customer orders placed through storefront checkout appear here immediately.'
                : 'Clear or adjust your Order ID, phone number, date, or status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID &amp; Date</th>
                  <th className="py-3 px-4">Customer &amp; Phone</th>
                  <th className="py-3 px-4">Ordered Items</th>
                  <th className="py-3 px-4">Total (BDT)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-[#09090B]">{order.orderNumber}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-BD', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#09090B]">{order.customerName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{order.customerPhone}</p>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                        {order.city} · {order.shippingAddress}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {order.items[0] && (
                          <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                            <LuxuryImage
                              src={order.items[0].imageUrl}
                              alt={order.items[0].name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#09090B] truncate max-w-[180px]">
                            {order.items[0]?.name || 'Order Item'}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {order.items.reduce((a, i) => a + i.quantity, 0)} unit(s) ·{' '}
                            {order.stockDeducted ? (
                              <span className="text-emerald-700 font-medium">Stock deducted</span>
                            ) : (
                              <span className="text-zinc-500">Stock pending</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#09090B] tabular-nums whitespace-nowrap">
                      {formatBdt(order.totalBdt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                      <p className="font-semibold text-[#09090B]">{order.paymentMethod}</p>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PAYMENT_BADGE_CLASSES[order.paymentStatus]}`}
                      >
                        {PAYMENT_LABELS[order.paymentStatus]}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${FULFILLMENT_BADGE_CLASSES[order.fulfillmentStatus]}`}
                      >
                        {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(order.fulfillmentStatus === 'new' ||
                          order.fulfillmentStatus === 'pending') && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleQuickConfirm(order)}
                            title="Confirm Order & Deduct Stock"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadOrderInvoicePdf(order, siteContent)}
                          title="Download PDF Invoice"
                          className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-[#C8A252] hover:text-[#09090B]"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openOrderModal(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5D687] hover:bg-[#E5BC64] text-[#09090B] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Order Details + Invoice Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:bg-white print:p-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectOrder(null);
          }}
        >
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl print:shadow-none print:border-none print:max-h-none">
            {/* Screen Header */}
            <div className="sticky top-0 z-10 bg-[#09090B] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl print:hidden">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#E5BC64]">
                  NOSIF WORLDS Order Console
                </p>
                <h2 className="text-lg font-bold font-mono">{selectedOrder.orderNumber}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadOrderInvoicePdf(selectedOrder, siteContent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5BC64] text-[#09090B] text-xs font-bold hover:bg-[#C8A252]"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Invoice PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold hover:border-[#E5BC64]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectOrder(null)}
                  aria-label="Close order modal"
                  className="p-1.5 rounded-lg border border-white/20 text-zinc-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Invoice Brand Banner */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-[#09090B] p-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#09090B]">NOSIF WORLDS</h1>
                <p className="text-xs text-zinc-600">{siteContent.showroomAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-lg">{selectedOrder.orderNumber}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('en-BD')}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer & Delivery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-zinc-500">
                    Customer Details
                  </h3>
                  <p className="text-sm font-bold text-[#09090B]">{selectedOrder.customerName}</p>
                  <p className="font-mono text-zinc-700">{selectedOrder.customerPhone}</p>
                  <p className="text-zinc-700">{selectedOrder.customerEmail}</p>
                  <p className="text-zinc-600 pt-1">
                    {selectedOrder.shippingAddress}, {selectedOrder.city}
                    {selectedOrder.postalCode ? ` (${selectedOrder.postalCode})` : ''}
                  </p>
                  {selectedOrder.specialInstructions && (
                    <p className="pt-2 border-t border-zinc-200 text-amber-800">
                      <strong>Instructions:</strong> {selectedOrder.specialInstructions}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 print:hidden">
                    <a
                      href={`mailto:${selectedOrder.customerEmail}?subject=${encodeURIComponent(`NOSIF WORLDS Order ${selectedOrder.orderNumber}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-800 font-semibold hover:border-[#C8A252]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#9E7B31]" />
                      <span>Email Customer</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Assalamu Alaikum ${selectedOrder.customerName}, regarding your NOSIF WORLDS order ${selectedOrder.orderNumber}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Settlement Summary */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-zinc-500">
                    Order Settlement &amp; Totals
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Order Date &amp; Time</span>
                    <span className="font-medium text-[#09090B]">
                      {new Date(selectedOrder.createdAt).toLocaleString('en-BD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Payment Method</span>
                    <span className="font-semibold text-[#09090B]">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-mono tabular-nums">{formatBdt(selectedOrder.subtotalBdt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Delivery Charge</span>
                    <span className="font-mono tabular-nums">
                      {selectedOrder.shippingBdt === 0
                        ? 'Complimentary'
                        : formatBdt(selectedOrder.shippingBdt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Discount Applied</span>
                    <span className="font-mono tabular-nums text-emerald-700">
                      -{formatBdt(Number(editDiscount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-[#09090B]">
                    <span>Total Amount (BDT)</span>
                    <span className="font-mono tabular-nums">
                      {formatBdt(
                        Math.max(
                          0,
                          selectedOrder.subtotalBdt +
                            selectedOrder.shippingBdt -
                            (Number(editDiscount) || 0),
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ordered Products Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">Variant / SKU</th>
                      <th className="py-2.5 px-4 text-right">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                              <LuxuryImage
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-semibold text-[#09090B]">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-600">
                          <p>
                            {item.selectedSize} · {item.selectedColor}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-400">{item.sku}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {formatBdt(item.priceBdt)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          {formatBdt(item.priceBdt * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Admin Order Controls (Hidden on Print) */}
              <div className="bg-[#FAFAFB] border border-zinc-200 rounded-xl p-5 space-y-4 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#09090B]">
                    Order Controls &amp; Inventory Automation
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    {selectedOrder.stockDeducted
                      ? 'Inventory already deducted for this order (cancelling will restore stock).'
                      : 'Confirming this order automatically deducts ordered quantities from product stock.'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Order Status
                    </label>
                    <select
                      value={editFulfillment}
                      onChange={(e) => setEditFulfillment(e.target.value as FulfillmentStatus)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={editPayment}
                      onChange={(e) => setEditPayment(e.target.value as PaymentStatus)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="cod_pending">COD Pending</option>
                      <option value="pending_gateway">Pending Gateway</option>
                      <option value="verified">Paid / Verified</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={editTxId}
                      onChange={(e) => setEditTxId(e.target.value)}
                      placeholder="e.g. TRX90821..."
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Discount (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                      Refund Status
                    </label>
                    <select
                      value={editRefund}
                      onChange={(e) => setEditRefund(e.target.value as RefundStatus)}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="none">None</option>
                      <option value="requested">Requested</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveOrder()}
                      className="px-4 py-2 rounded-xl bg-[#09090B] text-white text-xs font-semibold hover:bg-[#1C1C1F] disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Order Updates'}
                    </button>
                    {(selectedOrder.fulfillmentStatus === 'new' ||
                      selectedOrder.fulfillmentStatus === 'pending') && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveOrder('confirmed')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Order &amp; Deduct Stock</span>
                      </button>
                    )}
                  </div>

                  {confirmDeleteId === selectedOrder.id ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-red-800 font-semibold">
                        Delete permanently?
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDeleteConfirmed(selectedOrder.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs text-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedOrder.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Order</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
