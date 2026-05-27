/**
 * Format Rupiah utilities
 * Handles Indonesian Rupiah currency formatting
 */

/**
 * Format value for input display with thousand separators (dots)
 * Contoh: 5000000 -> "5.000.000"
 */
export function formatRupiahInput(value: string | number | undefined | null): string {
  if (!value && value !== 0) return '';
  const numberString = String(value).replace(/\D/g, '');
  if (!numberString) return '';
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse formatted Rupiah input back to number
 * Contoh: "5.000.000" -> 5000000
 */
export function parseRupiah(value: string | number | undefined | null): number {
  if (!value && value !== 0) return 0;
  const cleaned = String(value).replace(/\./g, '').replace(/[^\d]/g, '');
  return Number(cleaned) || 0;
}

/**
 * Format number for display with currency symbol and proper formatting
 * Contoh: 5000000 -> "Rp 5.000.000"
 */
export function formatRupiahDisplay(value: string | number | undefined | null): string {
  const num = typeof value === 'string' ? parseRupiah(value) : Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format simple number with thousand separators (dots)
 * Used for display only without currency symbol
 * Contoh: 5000000 -> "5.000.000"
 */
export function formatNumber(value: string | number | undefined | null): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseRupiah(value) : Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
