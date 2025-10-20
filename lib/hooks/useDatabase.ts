/**
 * Custom React hook for database connection management
 * Handles database initialization and connection state
 */

import { useState, useEffect, useCallback } from 'react';
import { initializeDatabase, isDatabaseInitialized, closeDatabase } from '../database';

/**
 * Database connection states
 */
export type DatabaseStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Hook for managing database connection
 */
export function useDatabase() {
  const [status, setStatus] = useState<DatabaseStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const connect = useCallback(async () => {
    if (status === 'connecting') {
      return; // Already connecting
    }

    setStatus('connecting');
    setError(null);

    try {
      await initializeDatabase();
      setStatus('connected');
      setRetryCount(0);
      console.log('Database connected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to database';
      console.error('Database connection failed:', errorMessage);
      setError(errorMessage);
      setStatus('error');
    }
  }, [status]);

  const disconnect = useCallback(async () => {
    try {
      await closeDatabase();
      setStatus('disconnected');
      setError(null);
      console.log('Database disconnected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect from database';
      console.error('Database disconnection failed:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  const retry = useCallback(async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    setRetryCount(prev => prev + 1);
    await connect();
  }, [connect, retryCount]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (isDatabaseInitialized()) {
      setStatus('connected');
    } else {
      connect();
    }
  }, [connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: We don't automatically disconnect on unmount
      // as the database should persist across component lifecycles
    };
  }, []);

  return {
    status,
    error,
    retryCount,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    hasError: status === 'error',
    connect,
    disconnect,
    retry,
    clearError,
  };
}

/**
 * Hook that ensures database is connected before rendering children
 * Useful for components that require database access
 */
export function useDatabaseGuard() {
  const database = useDatabase();

  const isReady = database.isConnected;
  const isLoading = database.isConnecting;
  const hasError = database.hasError;

  return {
    isReady,
    isLoading,
    hasError,
    error: database.error,
    retry: database.retry,
    clearError: database.clearError,
  };
}

/**
 * Higher-order component that wraps components requiring database access
 */
export function withDatabaseConnection<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function DatabaseConnectedComponent(props: P) {
    const { isReady, isLoading, hasError, error, retry } = useDatabaseGuard();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Connecting to database...</p>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center max-w-md">
            <div className="text-destructive mb-2">⚠️</div>
            <h3 className="font-semibold mb-2">Database Connection Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    if (!isReady) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Database not ready</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}