import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedAlert(true);
      const timer = setTimeout(() => {
        setShowReconnectedAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnectedAlert) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {!isOnline ? (
        <div className="flex items-center gap-3 bg-charcoal/95 text-white px-5 py-3 rounded-full shadow-2xl border border-white/10 backdrop-blur-md text-xs sm:text-sm font-semibold">
          <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span>You're offline. Live availability updates may be paused.</span>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline font-bold ml-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-emerald-700/95 text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold">
          <Wifi className="w-4 h-4 text-emerald-300" />
          <span>Connection restored — Live sync active</span>
        </div>
      )}
    </div>
  );
}
