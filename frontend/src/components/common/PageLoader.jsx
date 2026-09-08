import React from 'react';

/**
 * PageLoader
 * Ultra-smooth, branded Airbnb-coral transition screen for React.lazy() Suspense fallbacks.
 * Features an indeterminate top progress shimmer, pulsing branded icon, and accessible feedback.
 */
export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="min-h-[70vh] flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      {/* Top Animated Shimmer Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-airbnb via-rose-500 to-amber-400 w-1/3 animate-indeterminate" />
      </div>

      {/* Pulsing Brand Capsule */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Soft radial aura */}
        <div className="absolute w-20 h-20 bg-airbnb/15 rounded-full animate-ping pointer-events-none opacity-75" />
        <div className="absolute w-24 h-24 bg-airbnb/10 rounded-full blur-xl pointer-events-none" />

        {/* Central Logo Box */}
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center p-3">
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            className="w-8 h-8 text-airbnb animate-pulse"
          >
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.328.147 2.515-.928 4.764-2.877 6.015-1.745 1.12-3.87 1.258-5.83.376l-.427-.208c-1.399-.718-2.733-1.89-4.355-3.79-1.622 1.9-2.956 3.072-4.355 3.79l-.427.208c-1.96.882-4.085.744-5.83-.376-1.949-1.251-3.024-3.5-2.877-6.015.05-.856.293-1.737.96-3.328l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.298 0-2.247.604-3.239 2.373l-.531 1.021C10.34 10.09 6.223 18.72 5.253 20.978l-.134.327c-.57 1.36-.763 2.067-.803 2.766-.109 1.867.669 3.515 2.115 4.444 1.285.825 2.853.924 4.305.27l.38-.184c1.644-.843 3.197-2.29 4.884-4.501.218-.285.642-.285.86 0 1.687 2.211 3.24 3.658 4.884 4.501l.38.184c1.452.654 3.02.555 4.305-.27 1.446-.929 2.224-2.577 2.115-4.444-.04-.699-.233-1.406-.803-2.766l-.134-.327C26.777 18.72 22.66 10.09 20.77 6.394l-.531-1.021C19.247 3.604 18.298 3 16 3zm0 10c2.209 0 4 1.791 4 4 0 2.457-1.439 4.836-3.325 6.942l-.675.733c-.22.235-.58.235-.8 0l-.675-.733C12.439 21.836 11 19.457 11 17c0-2.209 1.791-4 4-4zm0 2c-1.105 0-2 .895-2 2 0 1.503.957 3.25 2.464 4.965C15.028 20.354 16 18.503 16 17c0-1.105-.895-2-2-2z" />
          </svg>
        </div>
      </div>

      {/* Loading copy */}
      <p className="text-sm font-semibold text-charcoal tracking-tight">
        Loading experience...
      </p>
      <p className="text-xs text-meta mt-1">
        Preparing verified spaces & details
      </p>
    </div>
  );
}
