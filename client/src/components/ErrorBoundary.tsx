'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-8 flex flex-col items-center justify-center font-mono">
          <h1 className="text-4xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
          <div className="bg-gray-900 p-6 rounded-lg border border-red-500/50 max-w-2xl w-full overflow-auto">
            <p className="text-xl mb-4">An error occurred in the application core:</p>
            <pre className="whitespace-pre-wrap text-sm text-red-300">
              {this.state.error?.toString()}
            </pre>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('iteam-storage');
              window.location.reload();
            }}
            className="mt-8 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
