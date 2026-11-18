import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-white/15 bg-[#141416] p-8 space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8A252]">NOSIF WORLDS</p>
            <h1 className="font-display text-3xl font-semibold">Application Recovery</h1>
            <p className="text-sm text-zinc-300 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.hash = '#/';
              }}
              className="px-5 py-2.5 bg-[#C8A252] text-[#09090B] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9B664] transition-colors"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
