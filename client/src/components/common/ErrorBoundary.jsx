import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
          <h2 className="text-red-600 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-500 text-sm mb-4">
            {this.state.error?.message || 'An error occurred while loading this component'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={this.retry}
              className="px-4 py-2 bg-amber-100 text-amber-900 rounded hover:bg-amber-200 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
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

export default ErrorBoundary;
