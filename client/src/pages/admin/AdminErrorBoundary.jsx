import { Component } from 'react';
import Icon from '../../components/ui/Icon.jsx';

export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[AdminConsole] Error:', error, errorInfo);
  }
  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };
  render() {
    if (this.state.error) {
      return (
        <div className="page-enter p-8 max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest border border-error/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="error" size={32} className="text-error" />
            </div>
            <h2 className="font-sans text-xl font-bold text-on-surface mb-2">Admin Console Error</h2>
            <p className="font-mono text-xs text-on-surface-variant mb-1">{this.state.error.message}</p>
            {this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="font-mono text-xs text-on-surface-variant cursor-pointer hover:text-on-surface">Stack trace</summary>
                <pre className="mt-2 p-4 bg-surface-container rounded-lg font-mono text-[10px] text-on-surface-variant overflow-auto max-h-60">{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <button onClick={this.handleReset} className="mt-6 px-6 py-2.5 bg-primary text-white font-mono text-xs font-bold uppercase rounded-lg hover:opacity-90">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
