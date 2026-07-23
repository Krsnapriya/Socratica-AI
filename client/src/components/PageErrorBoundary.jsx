import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PageErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8" style={{ background: 'var(--background)' }}>
          <div className="bg-surface-container border border-error/30 rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl" role="img" aria-label="error">⚠</span>
            </div>
            <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <details className="text-left mb-4 p-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-error max-h-40 overflow-auto">
              <summary className="cursor-pointer mb-2">Error details (click to expand)</summary>
              <pre>{this.state.error?.stack || 'No stack trace'}</pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-container text-white rounded-lg font-mono text-xs hover:opacity-90 transition-opacity"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
