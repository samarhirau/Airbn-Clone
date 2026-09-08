import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home as HomeIcon } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StayHub Unhandled Component Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-card flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-surface-border shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-extrabold text-charcoal">Something unexpected occurred</h1>
            <p className="text-xs text-meta mt-2 mb-6 leading-relaxed">
              We encountered a client-side rendering exception. Your session data remains secure.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-charcoal text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-surface-border text-charcoal text-xs font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Go to Storefront</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
