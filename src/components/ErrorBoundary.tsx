'use client';
/**
 * Error Boundary — catches client-side errors and shows a friendly message
 * instead of the Next.js default "Application error: a client-side exception
 * has occurred" white screen.
 *
 * This wraps the remedy detail page to prevent a single remedy's rendering
 * error from crashing the entire app.
 */
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center border-t-4 border-t-amber-700">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-serif text-xl text-emerald-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              An error occurred while loading this remedy. Try refreshing the page,
              or go back to the Materia Medica list.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                Refresh
              </button>
              <a
                href="/materia-medica"
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold hover:bg-stone-300"
              >
                Back to Materia Medica
              </a>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-stone-400 cursor-pointer">
                  Technical details
                </summary>
                <pre className="text-xs text-red-600 mt-2 overflow-x-auto bg-stone-50 p-2 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
