import { Component } from 'react';

// React still needs a class for error boundaries; there is no hook equivalent.
// `resetKey` (the pathname) clears the error when the shopper navigates away.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route crashed', error, info.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="empty-page" role="alert">
        <h1>Something went wrong</h1>
        <p>This page hit an error. Your cart and design are saved in this browser.</p>
        <div className="button-row">
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a href="/" className="btn btn--outline">
            Go to the homepage
          </a>
        </div>
      </section>
    );
  }
}
