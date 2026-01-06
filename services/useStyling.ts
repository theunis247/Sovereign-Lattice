/**
 * React Hook for Styling Service
 * Provides easy access to styling state and utilities in React components
 */

import { useState, useEffect } from 'react';
import { stylingService, StylingState } from './stylingService';

export interface UseStylingReturn {
  stylingState: StylingState;
  getClasses: (tailwindClasses: string, fallbackClasses?: string) => string;
  shouldUseFallback: () => boolean;
  isLoading: boolean;
  forceFallback: (reason?: string) => void;
}

export const useStyling = (): UseStylingReturn => {
  const [stylingState, setStylingState] = useState<StylingState>({
    isTailwindLoaded: false,
    hasStylesLoaded: false,
    fallbackMode: false,
    loadingErrors: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeStyling = async () => {
      try {
        setIsLoading(true);
        const initialState = await stylingService.initialize();
        setStylingState(initialState);
      } catch (error) {
        console.error('Failed to initialize styling service:', error);
        stylingService.forceFallbackMode('Hook initialization error');
        setStylingState(stylingService.getState());
      } finally {
        setIsLoading(false);
      }
    };

    initializeStyling();

    // Subscribe to styling state changes
    const unsubscribe = stylingService.subscribe((newState) => {
      setStylingState(newState);
    });

    return unsubscribe;
  }, []);

  const getClasses = (tailwindClasses: string, fallbackClasses: string = '') => {
    return stylingService.getClasses(tailwindClasses, fallbackClasses);
  };

  const shouldUseFallback = () => {
    return stylingState.fallbackMode || !stylingState.isTailwindLoaded;
  };

  const forceFallback = (reason?: string) => {
    stylingService.forceFallbackMode(reason);
  };

  return {
    stylingState,
    getClasses,
    shouldUseFallback,
    isLoading,
    forceFallback
  };
};