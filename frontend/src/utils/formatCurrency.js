/**
 * Standard currency formatter for US Dollars ($ / USD)
 * Example: formatPrice(120) => "$120"
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};
