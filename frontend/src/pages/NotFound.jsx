import { Link } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <h1 className="text-6xl font-extrabold text-charcoal tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-charcoal">We can’t seem to find the page you’re looking for.</h2>
        <p className="text-sm text-meta">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-airbnb hover:bg-airbnb-hover text-white font-semibold text-sm transition-all shadow-sm"
          >
            <HomeIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
