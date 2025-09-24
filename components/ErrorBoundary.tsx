import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorFallback } from './common/ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Reverted to using a constructor for state initialization. The class property
  // initializer syntax was causing a TypeScript error where 'this.props' was not
  // recognized on the component instance. The constructor approach resolves this.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }
  
  handleReset = () => {
    // Simple reset by reloading the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
