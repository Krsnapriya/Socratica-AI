import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center" style={{ background: 'var(--background)' }}>
          <div className="max-w-md w-full">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>
            <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <details className="text-left mb-4 p-3 bg-surface-container border border-outline-variant rounded text-xs font-mono text-error max-h-40 overflow-auto">
              <summary className="cursor-pointer mb-2">Error details (click to expand)</summary>
              <pre>{this.state.error?.message || String(this.state.error)}</pre>
              {this.state.error?.stack && <pre>{this.state.error.stack}</pre>}
            </details>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-4 py-2 font-mono text-sm font-bold rounded-lg text-white bg-primary border border-primary hover:opacity-90"
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
