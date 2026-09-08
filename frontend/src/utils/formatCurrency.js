/**
 * Global Currency Configuration and Formatter
 * Supports real-time conversion and international locales
 */
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.78, name: 'British Pound', locale: 'en-GB' },
  INR: { code: 'INR', symbol: '₹', rate: 83.5, name: 'Indian Rupee', locale: 'en-IN' },
  JPY: { code: 'JPY', symbol: '¥', rate: 155.0, name: 'Japanese Yen', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.36, name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'AU$', rate: 1.52, name: 'Australian Dollar', locale: 'en-AU' },
};

export const getSavedCurrency = () => {
  if (typeof window === 'undefined') return 'USD';
  try {
    const saved = localStorage.getItem('stayhub_currency');
    if (saved && CURRENCIES[saved]) return saved;
  } catch {
    // fallback
  }
  return 'USD';
};

/**
 * Converts a base USD price to the target currency
 */
export const convertPrice = (usdAmount, targetCurrency = getSavedCurrency()) => {
  const num = Number(usdAmount) || 0;
  const config = CURRENCIES[targetCurrency] || CURRENCIES.USD;
  return num * config.rate;
};

/**
 * Standard currency formatter
 * Automatically reads the current user's selected currency or uses the provided override
 * Example: formatPrice(120) => "$120" (in USD) or "€110" (in EUR)
 */
export const formatPrice = (amount, overrideCurrency = null) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '$0';
  
  const currencyCode = overrideCurrency || getSavedCurrency();
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  
  // If no override was passed, convert from base USD amount to target currency
  const converted = overrideCurrency ? Number(amount) : Number(amount) * config.rate;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: config.code === 'JPY' ? 0 : 0,
    minimumFractionDigits: 0,
  }).format(converted);
};
