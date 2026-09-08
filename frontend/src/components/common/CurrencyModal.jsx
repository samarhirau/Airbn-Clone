import { X, Check, Globe } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function CurrencyModal() {
  const { isModalOpen, closeCurrencyModal, currency, setCurrency, currencies } = useCurrency();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-surface-border animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-airbnb/10 text-airbnb">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-charcoal">Choose a currency</h2>
              <p className="text-xs text-meta">Prices across all listings and bookings update instantly</p>
            </div>
          </div>

          <button
            onClick={closeCurrencyModal}
            className="p-2 text-charcoal hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Grid */}
        <div className="p-6 max-h-[420px] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currencies.map((item) => {
              const isSelected = item.code === currency;

              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setCurrency(item.code);
                    closeCurrencyModal();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-charcoal bg-neutral-50 shadow-xs ring-1 ring-charcoal'
                      : 'border-surface-border hover:border-neutral-400 hover:bg-surface-card/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-surface-border shadow-2xs flex items-center justify-center text-sm font-black text-charcoal">
                      {item.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-charcoal">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-meta uppercase tracking-wider">
                        {item.code} · {item.symbol}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1 rounded-full bg-charcoal text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-surface-card/60 border-t border-surface-border flex items-center justify-between text-xs text-meta">
          <span>Rates are dynamically normalized to real-time market tiers</span>
          <button
            onClick={closeCurrencyModal}
            className="px-4 py-2 bg-charcoal text-white rounded-full font-bold hover:bg-neutral-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
