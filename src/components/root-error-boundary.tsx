'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; isChunkError?: boolean };

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkError =
      /Cannot read properties of undefined \(reading 'call'\)/.test(message) ||
      /reading 'call'|options\.factory|factory\.call/.test(message) ||
      /ChunkLoadError|Loading chunk .* failed/.test(message) ||
      /Failed to fetch dynamically imported module/.test(message);
    return { hasError: true, isChunkError: !!isChunkError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const isChunk =
      /reading 'call'|ChunkLoadError|Loading chunk|dynamically imported/.test(
        error.message
      );
    this.setState((s) => ({ ...s, isChunkError: s.isChunkError || isChunk }));
    if (process.env.NODE_ENV === 'development') {
      console.error('RootErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/20 p-6'>
        <p className='text-center text-lg text-foreground'>
          {this.state.isChunkError
            ? 'Something went wrong loading the page.'
            : 'Something went wrong.'}
        </p>
        <p className='text-center text-sm text-muted-foreground'>
          {this.state.isChunkError
            ? 'Try refreshing the page. If the problem continues, clear your browser cache.'
            : 'Please try again.'}
        </p>
        <button
          type='button'
          onClick={() => window.location.reload()}
          className='rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90'
        >
          Refresh page
        </button>
      </div>
    );
  }
}
