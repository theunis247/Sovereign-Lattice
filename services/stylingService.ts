/**
 * Styling Service - TailwindCSS Detection and Fallback System
 * Handles TailwindCSS loading validation and provides fallback styling
 */

import { progressiveEnhancement } from './progressiveEnhancement';

export interface StylingState {
  isTailwindLoaded: boolean;
  hasStylesLoaded: boolean;
  fallbackMode: boolean;
  loadingErrors: string[];
}

export class StylingService {
  private static instance: StylingService;
  private state: StylingState = {
    isTailwindLoaded: false,
    hasStylesLoaded: false,
    fallbackMode: false,
    loadingErrors: []
  };
  
  private listeners: ((state: StylingState) => void)[] = [];
  private checkTimeout: NodeJS.Timeout | null = null;

  static getInstance(): StylingService {
    if (!StylingService.instance) {
      StylingService.instance = new StylingService();
    }
    return StylingService.instance;
  }

  /**
   * Initialize styling detection and validation
   */
  async initialize(): Promise<StylingState> {
    try {
      // Check if TailwindCSS is loaded
      await this.detectTailwindCSS();
      
      // Validate critical styles are working
      this.validateCriticalStyles();
      
      // Set up fallback activation if needed
      this.setupFallbackActivation();
      
      return this.state;
    } catch (error) {
      console.error('Styling service initialization failed:', error);
      this.activateFallbackMode('Initialization failed');
      return this.state;
    }
  }

  /**
   * Detect if TailwindCSS is properly loaded
   */
  private async detectTailwindCSS(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create a test element to check if Tailwind classes work
      const testElement = document.createElement('div');
      testElement.className = 'bg-black text-white p-4 hidden';
      testElement.style.position = 'absolute';
      testElement.style.top = '-9999px';
      document.body.appendChild(testElement);

      // Use requestAnimationFrame to ensure styles are applied
      requestAnimationFrame(() => {
        try {
          const computedStyle = window.getComputedStyle(testElement);
          const backgroundColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          const padding = computedStyle.padding;

          // Check if Tailwind classes are applied correctly
          const isTailwindWorking = 
            backgroundColor === 'rgb(0, 0, 0)' && // bg-black
            color === 'rgb(255, 255, 255)' && // text-white
            padding === '16px'; // p-4

          this.state.isTailwindLoaded = isTailwindWorking;
          
          if (!isTailwindWorking) {
            this.state.loadingErrors.push('TailwindCSS classes not applying correctly');
          }

          document.body.removeChild(testElement);
          resolve(isTailwindWorking);
        } catch (error) {
          this.state.loadingErrors.push(`TailwindCSS detection error: ${error}`);
          document.body.removeChild(testElement);
          resolve(false);
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.state.isTailwindLoaded) {
          this.state.loadingErrors.push('TailwindCSS detection timeout');
          try {
            document.body.removeChild(testElement);
          } catch (e) {
            // Element might already be removed
          }
          resolve(false);
        }
      }, 2000);
    });
  }

  /**
   * Validate that critical styles are working
   */
  private validateCriticalStyles(): void {
    try {
      // Check if CSS custom properties are supported
      const testDiv = document.createElement('div');
      testDiv.style.setProperty('--test-prop', 'test');
      const supportsCustomProps = testDiv.style.getPropertyValue('--test-prop') === 'test';

      if (!supportsCustomProps) {
        this.state.loadingErrors.push('CSS custom properties not supported');
      }

      // Check if CSS Grid is supported
      const supportsGrid = CSS.supports('display', 'grid');
      if (!supportsGrid) {
        this.state.loadingErrors.push('CSS Grid not supported');
      }

      // Check if Flexbox is supported
      const supportsFlex = CSS.supports('display', 'flex');
      if (!supportsFlex) {
        this.state.loadingErrors.push('CSS Flexbox not supported');
      }

      this.state.hasStylesLoaded = supportsCustomProps && supportsGrid && supportsFlex;
    } catch (error) {
      this.state.loadingErrors.push(`Style validation error: ${error}`);
      this.state.hasStylesLoaded = false;
    }
  }

  /**
   * Setup fallback activation based on loading state
   */
  private setupFallbackActivation(): void {
    // Activate fallback if TailwindCSS failed to load or critical styles are missing
    if (!this.state.isTailwindLoaded || !this.state.hasStylesLoaded) {
      this.activateFallbackMode('TailwindCSS or critical styles failed to load');
    }

    // Monitor for network errors that might affect CDN loading
    this.monitorNetworkErrors();
  }

  /**
   * Monitor for network errors that might affect styling
   */
  private monitorNetworkErrors(): void {
    // Listen for resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as any).tagName === 'LINK') {
        const link = event.target as HTMLLinkElement;
        if (link.href.includes('tailwind') || link.href.includes('cdn')) {
          this.activateFallbackMode(`CSS resource failed to load: ${link.href}`);
        }
      }
    }, true);

    // Listen for script loading errors (TailwindCSS CDN)
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as any).tagName === 'SCRIPT') {
        const script = event.target as HTMLScriptElement;
        if (script.src.includes('tailwind')) {
          this.activateFallbackMode(`TailwindCSS script failed to load: ${script.src}`);
        }
      }
    }, true);
  }

  /**
   * Activate fallback styling mode
   */
  private activateFallbackMode(reason: string): void {
    this.state.fallbackMode = true;
    this.state.loadingErrors.push(reason);
    
    console.warn('Activating fallback styling mode:', reason);
    
    // Inject critical CSS if not already injected
    this.injectCriticalCSS();
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Inject critical CSS for authentication components
   */
  private injectCriticalCSS(): void {
    const existingStyle = document.getElementById('critical-fallback-css');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'critical-fallback-css';
    style.textContent = this.getCriticalCSS();
    document.head.appendChild(style);
  }

  /**
   * Get critical CSS for authentication components
   */
  private getCriticalCSS(): string {
    return `
      /* Critical Fallback CSS for Authentication */
      .fallback-container {
        min-height: 100vh;
        background-color: #000000;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .fallback-card {
        width: 100%;
        max-width: 512px;
        background-color: rgba(39, 39, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .fallback-title {
        font-size: 2.25rem;
        font-weight: 900;
        text-align: center;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-style: italic;
        letter-spacing: -0.025em;
      }

      .fallback-subtitle {
        font-size: 10px;
        color: #f97316;
        font-weight: 700;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.6em;
        margin-bottom: 32px;
      }

      .fallback-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .fallback-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .fallback-label {
        font-size: 9px;
        font-weight: 900;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding-left: 4px;
      }

      .fallback-input {
        width: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px;
        font-size: 14px;
        color: #ffffff;
        font-family: 'JetBrains Mono', monospace;
        outline: none;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .fallback-input:focus {
        border-color: #f97316;
        box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
      }

      .fallback-button {
        width: 100%;
        padding: 20px;
        background-color: #f97316;
        color: #000000;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-weight: 900;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.4em;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
      }

      .fallback-button:hover {
        background-color: #ea580c;
        transform: translateY(-1px);
      }

      .fallback-button:active {
        transform: scale(0.98);
      }

      .fallback-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .fallback-error {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        padding: 16px;
        border-radius: 12px;
        text-align: center;
      }

      .fallback-error-text {
        font-size: 10px;
        color: #ef4444;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .fallback-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .fallback-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(249, 115, 22, 0.3);
        border-top: 2px solid #f97316;
        border-radius: 50%;
        animation: fallback-spin 1s linear infinite;
      }

      .fallback-loading-text {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #f97316;
      }

      .fallback-link {
        font-size: 9px;
        color: #6b7280;
        text-align: center;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: color 0.2s ease;
        background: none;
        border: none;
        padding: 8px;
      }

      .fallback-link:hover {
        color: #ffffff;
      }

      .fallback-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .fallback-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      .fallback-mnemonic-input {
        background-color: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 8px;
        font-size: 10px;
        color: #ffffff;
        font-family: 'JetBrains Mono', monospace;
        text-align: center;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .fallback-mnemonic-input:focus {
        border-color: rgba(147, 51, 234, 0.5);
      }

      .fallback-security-input {
        width: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        font-size: 24px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 1em;
        color: #60a5fa;
        font-family: 'JetBrains Mono', monospace;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .fallback-security-input:focus {
        border-color: #3b82f6;
      }

      @keyframes fallback-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes fallback-shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }

      .fallback-shake {
        animation: fallback-shake 0.5s ease-in-out;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .fallback-card {
          padding: 24px;
          margin: 16px;
        }
        
        .fallback-title {
          font-size: 1.875rem;
        }
        
        .fallback-grid-4 {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .fallback-card {
          background-color: rgba(0, 0, 0, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .fallback-spinner {
          animation: none;
        }
        
        .fallback-button {
          transition: none;
        }
        
        .fallback-input {
          transition: none;
        }
      }
    `;
  }

  /**
   * Subscribe to styling state changes
   */
  subscribe(callback: (state: StylingState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in styling state listener:', error);
      }
    });
  }

  /**
   * Get current styling state
   */
  getState(): StylingState {
    return { ...this.state };
  }

  /**
   * Force fallback mode activation (for testing)
   */
  forceFallbackMode(reason: string = 'Manually activated'): void {
    this.activateFallbackMode(reason);
  }

  /**
   * Check if progressive enhancement should be used
   */
  shouldUseProgressiveEnhancement(): boolean {
    return this.state.fallbackMode || !this.state.isTailwindLoaded;
  }

  /**
   * Get appropriate CSS classes based on current state
   */
  getClasses(tailwindClasses: string, fallbackClasses: string = ''): string {
    if (this.state.fallbackMode) {
      return fallbackClasses;
    }

    // Apply progressive enhancement
    const enhancementConfig = progressiveEnhancement.getConfig();
    
    if (enhancementConfig.fallbackToBasicStyling && fallbackClasses) {
      return fallbackClasses;
    }

    // Filter out animation classes if animations are disabled
    if (!enhancementConfig.enableAnimations) {
      const animationKeywords = ['animate-', 'transition-', 'duration-', 'ease-', 'hover:', 'focus:', 'active:'];
      const filteredClasses = tailwindClasses
        .split(' ')
        .filter(cls => !animationKeywords.some(keyword => cls.includes(keyword)))
        .join(' ');
      
      return filteredClasses;
    }

    return tailwindClasses;
  }
}

// Export singleton instance
export const stylingService = StylingService.getInstance();