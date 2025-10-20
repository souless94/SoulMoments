/**
 * Custom React hooks for moment database operations
 * Provides reactive data access and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Observable, Subscription } from 'rxjs';
import { getDatabaseService, DatabaseResult } from '../database-service';
import { Moment, MomentFormData } from '@/types/moment';

/**
 * Hook for reactive moments data
 * Automatically updates when database changes
 */
export function useMoments() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Subscription | null = null;

    const setupReactiveQuery = () => {
      try {
        const service = getDatabaseService();
        const observable = service.getAllReactive();
        
        subscription = observable.subscribe({
          next: (data) => {
            setMoments(data);
            setLoading(false);
            setError(null);
          },
          error: (err) => {
            console.error('Reactive moments query error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load moments');
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('Failed to setup reactive query:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup database connection');
        setLoading(false);
      }
    };

    setupReactiveQuery();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return {
    moments,
    loading,
    error,
    refetch: useCallback(() => {
      setLoading(true);
      setError(null);
    }, []),
  };
}

/**
 * Hook for moment CRUD operations
 * Provides functions for creating, updating, and deleting moments
 */
export function useMomentOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = getDatabaseService();

  const createMoment = useCallback(async (data: MomentFormData): Promise<Moment | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.create(data);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to create moment');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create moment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const updateMoment = useCallback(async (id: string, data: MomentFormData): Promise<Moment | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.update(id, data);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to update moment');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update moment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const deleteMoment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.delete(id);
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to delete moment');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete moment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getMomentById = useCallback(async (id: string): Promise<Moment | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await service.getById(id);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get moment');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get moment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createMoment,
    updateMoment,
    deleteMoment,
    getMomentById,
    loading,
    error,
    clearError,
  };
}

/**
 * Hook for reactive moment count
 */
export function useMomentCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Subscription | null = null;

    const setupCountQuery = () => {
      try {
        const service = getDatabaseService();
        const observable = service.getCountReactive();
        
        subscription = observable.subscribe({
          next: (data) => {
            setCount(data);
            setLoading(false);
            setError(null);
          },
          error: (err) => {
            console.error('Reactive count query error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load count');
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('Failed to setup count query:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup database connection');
        setLoading(false);
      }
    };

    setupCountQuery();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return { count, loading, error };
}

/**
 * Hook for filtering moments by repeat frequency
 */
export function useMomentsByFrequency(frequency: string) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Subscription | null = null;

    const setupFrequencyQuery = () => {
      try {
        const service = getDatabaseService();
        const observable = service.getByRepeatFrequencyReactive(frequency);
        
        subscription = observable.subscribe({
          next: (data) => {
            setMoments(data);
            setLoading(false);
            setError(null);
          },
          error: (err) => {
            console.error('Reactive frequency query error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load moments');
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('Failed to setup frequency query:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup database connection');
        setLoading(false);
      }
    };

    setupFrequencyQuery();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [frequency]);

  return { moments, loading, error };
}

/**
 * Combined hook that provides both reactive data and operations
 * Convenient for components that need both read and write access
 */
export function useMomentsWithOperations() {
  const momentsData = useMoments();
  const operations = useMomentOperations();

  return {
    ...momentsData,
    ...operations,
  };
}