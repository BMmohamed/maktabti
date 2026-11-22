import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PrintPricing, PrintService, PrintOrderItem } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with Arabic locale and currency symbol (SYP / TRY)
 */
export function formatCurrency(amount: number, currency: string = 'SYP'): string {
  const cur = (currency || 'SYP').toUpperCase();

  if (cur === 'TRY') {
    // Turkish Lira: format cleanly e.g. 15 ₺ or 12.50 ₺
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ₺`;
  }

  if (cur === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  // Syrian Pound (SYP): Integer round for clean retail display
  const formatted = new Intl.NumberFormat('ar-SY', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${formatted} ل.س`;
}

/**
 * Convert price between Syrian Pound (SYP) and Turkish Lira (TRY)
 * @param amount The numeric amount to convert
 * @param fromCurrency Source currency ('SYP' or 'TRY')
 * @param toCurrency Target currency ('SYP' or 'TRY')
 * @param exchangeRate Exchange rate defined as: 1 TRY = exchangeRate SYP (e.g. 450.00)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'SYP',
  toCurrency: string = 'SYP',
  exchangeRate: number = 450
): number {
  const from = (fromCurrency || 'SYP').toUpperCase();
  const to = (toCurrency || 'SYP').toUpperCase();
  const rate = exchangeRate > 0 ? exchangeRate : 450;

  if (from === to) return amount;

  if (from === 'TRY' && to === 'SYP') {
    // 1 ₺ = rate ل.س (round to clean retail units)
    return Math.round(amount * rate);
  }

  if (from === 'SYP' && to === 'TRY') {
    // X ل.س / rate = Y ₺
    return Number((amount / rate).toFixed(2));
  }

  return amount;
}

/**
 * Helper to produce primary and secondary formatted currency strings
 */
export function formatDualCurrency(
  amount: number,
  activeCurrency: string = 'SYP',
  baseCurrency: string = 'SYP',
  exchangeRate: number = 450
): { primary: string; secondary: string; full: string } {
  const active = (activeCurrency || 'SYP').toUpperCase();
  const otherCurrency = active === 'SYP' ? 'TRY' : 'SYP';
  
  // Calculate value in active currency
  const activeValue = convertCurrency(amount, baseCurrency, active, exchangeRate);
  // Calculate value in other currency
  const otherValue = convertCurrency(amount, baseCurrency, otherCurrency, exchangeRate);

  const primaryFormatted = formatCurrency(activeValue, active);
  const secondaryFormatted = formatCurrency(otherValue, otherCurrency);

  return {
    primary: primaryFormatted,
    secondary: secondaryFormatted,
    full: `${primaryFormatted} (${secondaryFormatted})`,
  };
}

/**
 * Calculate cost for a single print item
 */
export function calculateItemPrice(
  item: {
    page_count: number;
    copies_count: number;
    paper_size: string;
    color_mode: string;
    duplex: string;
    selected_services?: Array<{ price: number }>;
  },
  pricingList: PrintPricing[],
  fixedNotePrice?: number | null
): number {
  if (fixedNotePrice && fixedNotePrice > 0) {
    const servicesTotal = (item.selected_services || []).reduce((sum, s) => sum + (s.price || 0), 0);
    return (fixedNotePrice + servicesTotal) * (item.copies_count || 1);
  }

  // Find matching rate
  const rate = pricingList.find(
    p =>
      p.paper_size === item.paper_size &&
      p.color_mode === item.color_mode &&
      p.duplex === item.duplex
  );

  const pricePerPage = rate ? Number(rate.price_per_page) : 300; // fallback default 300
  const pagesCost = (item.page_count || 1) * pricePerPage;
  const servicesTotal = (item.selected_services || []).reduce((sum, s) => sum + (s.price || 0), 0);

  return (pagesCost + servicesTotal) * (item.copies_count || 1);
}

/**
 * Build WhatsApp ready-for-pickup message link
 */
export function buildWhatsAppPickupLink(
  phone: string,
  dailyOrderCode: number,
  branchName: string,
  customerName?: string | null
): string {
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  if (cleanPhone.startsWith('09')) {
    cleanPhone = '963' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  const greeting = customerName ? `مرحباً ${customerName}` : 'مرحباً بك';
  const text = `${greeting}، طلب الطباعة رقم #${dailyOrderCode} جاهز للاستلام الآن من ${branchName}. أهلاً وسهلاً بك في أي وقت!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
