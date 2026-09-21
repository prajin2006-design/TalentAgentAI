import React from 'react';
import './ErrorBoundary.css';

function getErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try {
    return String(err);
  } catch (e) {
    return 'An unexpected component error occurred.';
  }
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="card error-boundary-card">
            <div className="error-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p className="text-secondary">
              An unexpected error occurred while rendering this view. You can try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="error-details">
                {getErrorMessage(this.state.error)}
              </pre>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1.25rem' }}
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
