import { createContext, useContext, useState, useEffect } from 'react';
import { CURRENCIES, getSavedCurrency, formatPrice, convertPrice } from '../utils/formatCurrency';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(getSavedCurrency);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem('stayhub_currency', code);
      } catch (e) {
        console.error('Failed to save currency', e);
      }
      // Notify components that may rely on storage change
      window.dispatchEvent(new Event('stayhub:currency'));
    }
  };

  useEffect(() => {
    const handleStorage = () => {
      setCurrencyState(getSavedCurrency());
    };
    window.addEventListener('stayhub:currency', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('stayhub:currency', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const openCurrencyModal = () => setIsModalOpen(true);
  const closeCurrencyModal = () => setIsModalOpen(false);

  const formatWithCurrent = (amount) => formatPrice(amount, currency);
  const convertWithCurrent = (amount) => convertPrice(amount, currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig: CURRENCIES[currency] || CURRENCIES.USD,
        currencies: Object.values(CURRENCIES),
        setCurrency,
        isModalOpen,
        openCurrencyModal,
        closeCurrencyModal,
        formatPrice: formatWithCurrent,
        convertPrice: convertWithCurrent,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
