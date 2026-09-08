import { Globe, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { openCurrencyModal, currencyConfig } = useCurrency();

  const footerSections = [
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'AirCover safety', href: '#' },
        { label: 'Anti-discrimination', href: '#' },
        { label: 'Disability support', href: '#' },
        { label: 'Cancellation options', href: '#' },
        { label: 'Report neighborhood concern', href: '#' },
      ],
    },
    {
      title: 'Hosting',
      links: [
        { label: 'Airbnb your home', href: '#' },
        { label: 'AirCover for Hosts', href: '#' },
        { label: 'Hosting resources', href: '#' },
        { label: 'Community forum', href: '#' },
        { label: 'Hosting responsibly', href: '#' },
        { label: 'Join a free Hosting class', href: '#' },
      ],
    },
    {
      title: 'StayHub',
      links: [
        { label: 'Newsroom & Updates', href: '#' },
        { label: 'New features', href: '#' },
        { label: 'Careers & Opportunities', href: '#' },
        { label: 'Investors', href: '#' },
        { label: 'Gift cards', href: '#' },
        { label: 'Emergency housing', href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t border-surface-border bg-surface-card/60 text-charcoal mt-auto text-sm">
      {/* 1. Main 3-Column Navigation Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-surface-border">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-meta hover:text-charcoal hover:underline transition-colors text-[13px]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 2. Developer Attribution Spotlight */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-airbnb/10 text-airbnb flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal">
                Full-Stack Architecture & Engineering
              </p>
              <p className="text-xs text-meta">
                MERN Stack Airbnb Clone Client with Real-Time Availability Engine
              </p>
            </div>
          </div>

          <a
            href="https://samarhirau.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-surface-border hover:border-airbnb hover:shadow-md transition-all duration-200"
          >
            <span className="text-xs text-meta font-medium flex items-center gap-1.5">
              Developed with <Heart className="w-3.5 h-3.5 fill-airbnb text-airbnb inline animate-pulse" /> by
            </span>
            <span className="text-xs font-bold text-charcoal group-hover:text-airbnb transition-colors">
              Samar Hirau
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-meta group-hover:text-airbnb transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* 3. Bottom Legal & Preferences Bar (Clean, without extra social icons) */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-meta">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5">
            <span>© {currentYear} StayHub, Inc.</span>
            <span>·</span>
            <a href="#" className="hover:underline hover:text-charcoal">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:underline hover:text-charcoal">Terms</a>
            <span>·</span>
            <a href="#" className="hover:underline hover:text-charcoal">Sitemap</a>
            <span>·</span>
            <a href="#" className="hover:underline hover:text-charcoal">Company details</a>
          </div>

          <div className="flex items-center gap-6 font-semibold text-charcoal">
             <button
              onClick={openCurrencyModal}
              className="flex items-center gap-2 hover:underline cursor-pointer"
            >
              <Globe className="w-4 h-4 text-charcoal" />
              <span>English (US)</span>
            </button>

          <button
              onClick={openCurrencyModal}
              className="hover:underline cursor-pointer"
            >
              <span>{currencyConfig.symbol} {currencyConfig.code}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
