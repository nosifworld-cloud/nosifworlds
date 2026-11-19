import { jsPDF } from 'jspdf';
import { formatBdt } from '../../data/catalog';
import { FulfillmentStatus, Order, PaymentStatus, Product, SiteContent } from '../../types';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'seo'
  | 'categories'
  | 'customers'
  | 'payments'
  | 'content'
  | 'notifications'
  | 'settings';

export const STUDIO_IMAGES = [
  { label: 'Hero Tailoring & Audio', url: '/src/assets/images/hero_nosif_luxury_1795002419948.jpg' },
  { label: "Men's Wool Blazer", url: '/src/assets/images/fashion_mens_tailoring_1795002419791.jpg' },
  { label: "Women's Silk & Tote", url: '/src/assets/images/fashion_womens_atelier_1795002420621.jpg' },
  { label: 'Titanium Chronograph', url: '/src/assets/images/fashion_chronograph_watch_1795002421589.jpg' },
  { label: 'Flagship ANC Headphones', url: '/src/assets/images/electronics_flagship_audio_1795002420781.jpg' },
  { label: 'Ultrabook & Smartphone', url: '/src/assets/images/electronics_ultrabook_phone_1795002421300.jpg' },
  { label: 'Chelsea Boots & Duffle', url: '/src/assets/images/fashion_leather_accessories_1795002422420.jpg' },
  { label: 'AMOLED Smart Watch & Buds', url: '/src/assets/images/electronics_smartwatch_gadget_1795002422403.jpg' },
];

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  new: 'New',
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const FULFILLMENT_BADGE_CLASSES: Record<FulfillmentStatus, string> = {
  new: 'bg-zinc-900 text-[#E5BC64] border-zinc-800',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-teal-50 text-teal-800 border-teal-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending_gateway: 'Pending Gateway',
  cod_pending: 'COD Pending',
  verified: 'Paid / Verified',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const PAYMENT_BADGE_CLASSES: Record<PaymentStatus, string> = {
  pending_gateway: 'bg-amber-50 text-amber-800 border-amber-200',
  cod_pending: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function escapeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadCsvFile(filename: string, rows: string[][]) {
  const csv = '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function uploadImageFileToServer(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const resp = await fetch('/api/admin/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl, filename: file.name }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Image upload failed.');
  return data.url as string;
}

export function downloadOrderInvoicePdf(order: Order, siteContent: SiteContent) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 42;
  let y = 46;

  // Obsidian header banner
  pdf.setFillColor(9, 9, 11);
  pdf.rect(0, 0, pageWidth, 88, 'F');
  pdf.setTextColor(200, 162, 82);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('NOSIF WORLDS', margin, 42);

  pdf.setTextColor(220, 220, 225);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('OFFICIAL SINGLE-VENDOR TAX & DISPATCH INVOICE', margin, 60);
  pdf.text(siteContent.showroomAddress, margin, 73);

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(`INVOICE #${order.orderNumber}`, pageWidth - margin, 42, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(
    `Date: ${new Date(order.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}`,
    pageWidth - margin,
    58,
    { align: 'right' },
  );
  pdf.text(`Status: ${FULFILLMENT_LABELS[order.fulfillmentStatus]}`, pageWidth - margin, 72, {
    align: 'right',
  });

  y = 118;

  // Client & Payment blocks
  pdf.setTextColor(15, 15, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('BILLED & SHIPPED TO', margin, y);
  pdf.text('SETTLEMENT & LOGISTICS', pageWidth / 2 + 12, y);
  y += 16;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(60, 60, 70);
  const leftLines = [
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.shippingAddress,
    `${order.city}${order.postalCode ? ` - ${order.postalCode}` : ''}, Bangladesh`,
  ];
  leftLines.forEach((line, idx) => {
    pdf.text(pdf.splitTextToSize(line, pageWidth / 2 - margin - 20), margin, y + idx * 14);
  });

  const rightLines = [
    `Method: ${order.paymentMethod}`,
    `Payment Status: ${PAYMENT_LABELS[order.paymentStatus]}`,
    `Transaction ID: ${order.transactionId || 'N/A'}`,
    `Stock Deducted: ${order.stockDeducted ? 'Yes (Reserved)' : 'Pending Confirmation'}`,
    `Support: ${siteContent.supportEmail}`,
  ];
  rightLines.forEach((line, idx) => {
    pdf.text(line, pageWidth / 2 + 12, y + idx * 14);
  });

  y += 96;

  // Table header
  pdf.setFillColor(244, 244, 246);
  pdf.rect(margin, y, pageWidth - margin * 2, 24, 'F');
  pdf.setTextColor(9, 9, 11);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('ITEM / VARIANT', margin + 8, y + 15);
  pdf.text('SKU', margin + 235, y + 15);
  pdf.text('QTY', margin + 335, y + 15, { align: 'right' });
  pdf.text('UNIT (BDT)', margin + 415, y + 15, { align: 'right' });
  pdf.text('TOTAL (BDT)', pageWidth - margin - 8, y + 15, { align: 'right' });
  y += 32;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  for (const item of order.items) {
    if (y > 720) {
      pdf.addPage();
      y = 50;
    }
    pdf.setTextColor(15, 15, 20);
    const titleLines = pdf.splitTextToSize(
      `${item.name} (${item.selectedSize}, ${item.selectedColor})`,
      215,
    );
    pdf.text(titleLines, margin + 8, y);
    pdf.setTextColor(90, 90, 100);
    pdf.text(item.sku, margin + 235, y);
    pdf.text(String(item.quantity), margin + 335, y, { align: 'right' });
    pdf.text(formatBdt(item.priceBdt).replace('৳', 'BDT '), margin + 415, y, { align: 'right' });
    pdf.setTextColor(15, 15, 20);
    pdf.text(
      formatBdt(item.priceBdt * item.quantity).replace('৳', 'BDT '),
      pageWidth - margin - 8,
      y,
      { align: 'right' },
    );

    const rowHeight = Math.max(20, titleLines.length * 12 + 8);
    pdf.setDrawColor(232, 232, 236);
    pdf.line(margin, y + rowHeight - 6, pageWidth - margin, y + rowHeight - 6);
    y += rowHeight;
  }

  y += 14;
  const summaryX = pageWidth - margin - 180;
  pdf.setFontSize(9.5);
  pdf.setTextColor(80, 80, 90);
  pdf.text('Subtotal:', summaryX, y);
  pdf.text(formatBdt(order.subtotalBdt).replace('৳', 'BDT '), pageWidth - margin - 8, y, { align: 'right' });
  y += 16;

  pdf.text('Delivery Charge:', summaryX, y);
  pdf.text(
    order.shippingBdt === 0
      ? 'Complimentary'
      : formatBdt(order.shippingBdt).replace('৳', 'BDT '),
    pageWidth - margin - 8,
    y,
    { align: 'right' },
  );
  y += 16;

  if (order.discountBdt && order.discountBdt > 0) {
    pdf.text('Discount:', summaryX, y);
    pdf.text(`-${formatBdt(order.discountBdt).replace('৳', 'BDT ')}`, pageWidth - margin - 8, y, {
      align: 'right',
    });
    y += 16;
  }

  pdf.setDrawColor(200, 162, 82);
  pdf.line(summaryX, y - 4, pageWidth - margin, y - 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(9, 9, 11);
  pdf.text('Grand Total:', summaryX, y + 12);
  pdf.text(formatBdt(order.totalBdt).replace('৳', 'BDT '), pageWidth - margin - 8, y + 12, {
    align: 'right',
  });

  if (order.specialInstructions) {
    y += 38;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Special Delivery Notes:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 90);
    pdf.text(pdf.splitTextToSize(order.specialInstructions, pageWidth - margin * 2), margin, y + 13);
  }

  pdf.setFontSize(8);
  pdf.setTextColor(130, 130, 140);
  pdf.text(
    `NOSIF WORLDS · Single-Vendor Official Storefront · ${siteContent.whatsappNumber}`,
    margin,
    805,
  );

  pdf.save(`NOSIF-WORLDS-Invoice-${order.orderNumber}.pdf`);
}

export interface SeoCheckResult {
  score: number;
  checks: { label: string; ok: boolean; tip: string }[];
}

export function computeProductSeoScore(product: Partial<Product>): SeoCheckResult {
  const title = (product.seoTitle || product.name || '').trim();
  const desc = (product.metaDescription || product.description || '').trim();
  const keyword = (product.focusKeyword || '').trim().toLowerCase();
  const slug = (product.slug || product.id || '').trim();
  const alt = (product.imageAlt || '').trim();
  const og = (product.ogImageUrl || product.imageUrl || '').trim();

  const checks = [
    {
      label: 'SEO Title length (30–65 chars)',
      ok: title.length >= 30 && title.length <= 65,
      tip: `Currently ${title.length} chars.`,
    },
    {
      label: 'Meta Description length (110–160 chars)',
      ok: desc.length >= 110 && desc.length <= 160,
      tip: `Currently ${desc.length} chars.`,
    },
    {
      label: 'Focus Keyword defined & in SEO Title',
      ok: Boolean(keyword && title.toLowerCase().includes(keyword)),
      tip: keyword ? `Keyword "${keyword}" checked in title.` : 'Add a focus keyword.',
    },
    {
      label: 'Focus Keyword in Meta Description',
      ok: Boolean(keyword && desc.toLowerCase().includes(keyword)),
      tip: keyword ? `Keyword "${keyword}" checked in description.` : 'Add a focus keyword.',
    },
    {
      label: 'Clean lowercase URL Slug',
      ok: /^[a-z0-9\-]+$/.test(slug) && slug.length >= 3,
      tip: slug ? `Slug: /product/${slug}` : 'Set a clean URL slug.',
    },
    {
      label: 'Descriptive Image Alt Text & OG Image',
      ok: alt.length >= 5 && og.length >= 5,
      tip: alt ? 'Image alt text configured.' : 'Add descriptive alt text for search indexing.',
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks };
}
