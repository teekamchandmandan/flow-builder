import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called when user clicks the recovery action. */
  onReset?: () => void;
  /** Heading text shown in the fallback UI. */
  title?: string;
  /** Description text shown in the fallback UI. */
  description?: string;
  /** Label for the recovery button. */
  actionLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Generic React error boundary with a configurable fallback UI.
 * Reused by both the app-level and canvas-level boundaries.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      title = 'Something went wrong',
      description = 'Please refresh the page to continue.',
      actionLabel = 'Reload',
      onReset,
    } = this.props;

    return (
      <div className='flex h-full w-full items-center justify-center bg-background text-foreground'>
        <div className='text-center space-y-2'>
          <p className='text-lg font-semibold'>{title}</p>
          <p className='text-sm text-muted-foreground'>{description}</p>
          <button
            type='button'
            className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90'
            onClick={() => {
              this.setState({ hasError: false });
              if (onReset) {
                onReset();
              } else {
                window.location.reload();
              }
            }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    );
  }
}
