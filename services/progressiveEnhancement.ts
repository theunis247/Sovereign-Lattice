/**
 * Progressive Enhancement Utilities
 * Provides utilities for progressive enhancement and graceful degradation
 */

export interface ProgressiveEnhancementConfig {
  enableAnimations: boolean;
  enableAdvancedStyling: boolean;
  enableInteractiveFeatures: boolean;
  fallbackToBasicStyling: boolean;
}

export class ProgressiveEnhancement {
  private static instance: ProgressiveEnhancement;
  private config: ProgressiveEnhancementConfig;

  constructor() {
    this.config = {
      enableAnimations: true,
      enableAdvancedStyling: true,
      enableInteractiveFeatures: true,
      fallbackToBasicStyling: false
    };
    
    this.detectCapabilities();
  }

  static getInstance(): ProgressiveEnhancement {
    if (!ProgressiveEnhancement.instance) {
      ProgressiveEnhancement.instance = new ProgressiveEnhancement();
    }
    return ProgressiveEnhancement.instance;
  }

  /**
   * Detect browser capabilities and adjust configuration
   */
  private detectCapabilities(): void {
    try {
      // Check for reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.config.enableAnimations = false;
      }

      // Check for high contrast preference
      if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        this.config.enableAdvancedStyling = false;
      }

      // Check for CSS support
      if (!CSS || !CSS.supports) {
        this.config.enableAdvancedStyling = false;
      }

      // Check for modern CSS features
      if (CSS && CSS.supports) {
        const supportsGrid = CSS.supports('display', 'grid');
        const supportsFlex = CSS.supports('display', 'flex');
        const supportsCustomProps = CSS.supports('--test', 'test');

        if (!supportsGrid || !supportsFlex || !supportsCustomProps) {
          this.config.fallbackToBasicStyling = true;
        }
      }

      // Check for JavaScript capabilities
      if (!window.requestAnimationFrame) {
        this.config.enableAnimations = false;
        this.config.enableInteractiveFeatures = false;
      }

      // Check for touch capabilities
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice) {
        // Adjust for touch interfaces
        this.config.enableAnimations = false; // Reduce animations on touch devices for better performance
      }

    } catch (error) {
      console.warn('Error detecting capabilities, using fallback configuration:', error);
      this.config = {
        enableAnimations: false,
        enableAdvancedStyling: false,
        enableInteractiveFeatures: true,
        fallbackToBasicStyling: true
      };
    }
  }

  /**
   * Get configuration for progressive enhancement
   */
  getConfig(): ProgressiveEnhancementConfig {
    return { ...this.config };
  }

  /**
   * Check if animations should be enabled
   */
  shouldEnableAnimations(): boolean {
    return this.config.enableAnimations;
  }

  /**
   * Check if advanced styling should be enabled
   */
  shouldEnableAdvancedStyling(): boolean {
    return this.config.enableAdvancedStyling;
  }

  /**
   * Check if interactive features should be enabled
   */
  shouldEnableInteractiveFeatures(): boolean {
    return this.config.enableInteractiveFeatures;
  }

  /**
   * Check if fallback styling should be used
   */
  shouldUseFallbackStyling(): boolean {
    return this.config.fallbackToBasicStyling;
  }

  /**
   * Get appropriate CSS classes based on capabilities
   */
  getEnhancedClasses(baseClasses: string, enhancedClasses: string = '', animationClasses: string = ''): string {
    let classes = baseClasses;

    if (this.config.enableAdvancedStyling && enhancedClasses) {
      classes += ` ${enhancedClasses}`;
    }

    if (this.config.enableAnimations && animationClasses) {
      classes += ` ${animationClasses}`;
    }

    return classes.trim();
  }

  /**
   * Apply progressive enhancement to an element
   */
  enhanceElement(element: HTMLElement, enhancements: {
    animations?: string[];
    interactions?: (() => void)[];
    styling?: string[];
  }): void {
    try {
      // Apply animations if supported
      if (this.config.enableAnimations && enhancements.animations) {
        enhancements.animations.forEach(animation => {
          element.classList.add(animation);
        });
      }

      // Apply advanced styling if supported
      if (this.config.enableAdvancedStyling && enhancements.styling) {
        enhancements.styling.forEach(style => {
          element.classList.add(style);
        });
      }

      // Apply interactions if supported
      if (this.config.enableInteractiveFeatures && enhancements.interactions) {
        enhancements.interactions.forEach(interaction => {
          interaction();
        });
      }
    } catch (error) {
      console.warn('Error applying progressive enhancement:', error);
    }
  }

  /**
   * Create a loading strategy based on capabilities
   */
  getLoadingStrategy(): 'immediate' | 'lazy' | 'progressive' {
    if (!this.config.enableAdvancedStyling || this.config.fallbackToBasicStyling) {
      return 'immediate';
    }

    if (!this.config.enableAnimations) {
      return 'lazy';
    }

    return 'progressive';
  }

  /**
   * Get timeout values based on capabilities
   */
  getTimeouts(): { animation: number; interaction: number; loading: number } {
    const baseTimeouts = {
      animation: this.config.enableAnimations ? 300 : 0,
      interaction: this.config.enableInteractiveFeatures ? 150 : 0,
      loading: this.config.enableAdvancedStyling ? 2000 : 5000
    };

    return baseTimeouts;
  }

  /**
   * Force configuration update (for testing)
   */
  updateConfig(newConfig: Partial<ProgressiveEnhancementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const progressiveEnhancement = ProgressiveEnhancement.getInstance();