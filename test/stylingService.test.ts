/**
 * Tests for Styling Service
 * Validates TailwindCSS detection and fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StylingService } from '../services/stylingService';

// Mock DOM methods
const mockGetComputedStyle = vi.fn();
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  // Mock window.getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: mockGetComputedStyle,
    writable: true
  });

  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement,
    writable: true
  });

  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppendChild,
    writable: true
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemoveChild,
    writable: true
  });

  // Mock CSS.supports
  Object.defineProperty(window, 'CSS', {
    value: {
      supports: vi.fn()
    },
    writable: true
  });

  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StylingService', () => {
  let stylingService: StylingService;

  beforeEach(() => {
    stylingService = new (StylingService as any)(); // Access constructor directly for testing
  });

  describe('TailwindCSS Detection', () => {
    it('should detect when TailwindCSS is working correctly', async () => {
      // Mock successful TailwindCSS detection
      const mockElement = {
        className: '',
        style: {
          position: '',
          top: ''
        }
      };

      mockCreateElement.mockReturnValue(mockElement);
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(0, 0, 0)',
        color: 'rgb(255, 255, 255)',
        padding: '16px'
      });

      (window.CSS.supports as any)
        .mockReturnValueOnce(true) // Custom properties
        .mockReturnValueOnce(true) // Grid
        .mockReturnValueOnce(true); // Flexbox

      const result = await stylingService.initialize();

      expect(result.isTailwindLoaded).toBe(true);
      expect(result.hasStylesLoaded).toBe(true);
      expect(result.fallbackMode).toBe(false);
    });

    it('should activate fallback mode when TailwindCSS fails', async () => {
      // Mock failed TailwindCSS detection
      const mockElement = {
        className: '',
        style: {
          position: '',
          top: ''
        }
      };

      mockCreateElement.mockReturnValue(mockElement);
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgba(0, 0, 0, 0)', // Not applied correctly
        color: 'rgba(0, 0, 0, 0)',
        padding: '0px'
      });

      (window.CSS.supports as any)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = await stylingService.initialize();

      expect(result.isTailwindLoaded).toBe(false);
      expect(result.fallbackMode).toBe(true);
      expect(result.loadingErrors.length).toBeGreaterThan(0);
    });

    it('should handle CSS support detection errors gracefully', async () => {
      // Mock CSS.supports throwing an error
      (window.CSS.supports as any).mockImplementation(() => {
        throw new Error('CSS.supports not available');
      });

      const mockElement = {
        className: '',
        style: {
          position: '',
          top: ''
        }
      };

      mockCreateElement.mockReturnValue(mockElement);
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(0, 0, 0)',
        color: 'rgb(255, 255, 255)',
        padding: '16px'
      });

      const result = await stylingService.initialize();

      expect(result.hasStylesLoaded).toBe(false);
      expect(result.fallbackMode).toBe(true);
    });
  });

  describe('Class Selection', () => {
    it('should return TailwindCSS classes when not in fallback mode', () => {
      stylingService.state = {
        isTailwindLoaded: true,
        hasStylesLoaded: true,
        fallbackMode: false,
        loadingErrors: []
      };

      const result = stylingService.getClasses('bg-black text-white', 'fallback-container');
      expect(result).toBe('bg-black text-white');
    });

    it('should return fallback classes when in fallback mode', () => {
      stylingService.state = {
        isTailwindLoaded: false,
        hasStylesLoaded: false,
        fallbackMode: true,
        loadingErrors: ['TailwindCSS failed to load']
      };

      const result = stylingService.getClasses('bg-black text-white', 'fallback-container');
      expect(result).toBe('fallback-container');
    });

    it('should return empty string for fallback when no fallback classes provided', () => {
      stylingService.state = {
        isTailwindLoaded: false,
        hasStylesLoaded: false,
        fallbackMode: true,
        loadingErrors: ['TailwindCSS failed to load']
      };

      const result = stylingService.getClasses('bg-black text-white');
      expect(result).toBe('');
    });
  });

  describe('Progressive Enhancement', () => {
    it('should provide progressive enhancement recommendations', () => {
      const shouldUseProgressive = stylingService.shouldUseProgressiveEnhancement();
      expect(typeof shouldUseProgressive).toBe('boolean');
    });

    it('should force fallback mode when requested', () => {
      stylingService.forceFallbackMode('Test reason');
      
      const state = stylingService.getState();
      expect(state.fallbackMode).toBe(true);
      expect(state.loadingErrors).toContain('Test reason');
    });
  });

  describe('State Management', () => {
    it('should notify listeners when state changes', () => {
      const listener = vi.fn();
      const unsubscribe = stylingService.subscribe(listener);

      stylingService.forceFallbackMode('Test notification');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackMode: true
        })
      );

      unsubscribe();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      
      stylingService.subscribe(errorListener);
      
      // Should not throw when notifying listeners
      expect(() => {
        stylingService.forceFallbackMode('Test error handling');
      }).not.toThrow();
    });
  });
});