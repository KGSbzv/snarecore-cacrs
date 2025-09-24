import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorFallback } from './common/ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Reverted to using a constructor to properly initialize state.
  // The class property syntax was causing 'this.props' to be unrecognized in this environment.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }
  
  handleReset = () => {
    // Simple reset by reloading the page
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
