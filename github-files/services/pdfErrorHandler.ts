/**
 * Enhanced error handling system for PDF generation
 * Provides specific error types, user-friendly messages, and fallback options
 */

export interface PDFError {
  type: PDFErrorType;
  message: string;
  userMessage: string;
  actionable: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type PDFErrorType = 
  | 'BROWSER_UNSUPPORTED'
  | 'MEMORY_INSUFFICIENT'
  | 'DATA_INVALID'
  | 'QR_GENERATION_FAILED'
  | 'FONT_LOADING_FAILED'
  | 'IMAGE_PROCESSING_FAILED'
  | 'PDF_CREATION_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'PERMISSION_DENIED'
  | 'STORAGE_FULL'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class PDFErrorHandler {
  private static readonly ERROR_PATTERNS: Record<string, PDFErrorType> = {
    'not supported': 'BROWSER_UNSUPPORTED',
    'unsupported': 'BROWSER_UNSUPPORTED',
    'memory': 'MEMORY_INSUFFICIENT',
    'out of memory': 'MEMORY_INSUFFICIENT',
    'invalid': 'DATA_INVALID',
    'missing': 'DATA_INVALID',
    'qr': 'QR_GENERATION_FAILED',
    'qrcode': 'QR_GENERATION_FAILED',
    'font': 'FONT_LOADING_FAILED',
    'image': 'IMAGE_PROCESSING_FAILED',
    'pdf': 'PDF_CREATION_FAILED',
    'download': 'DOWNLOAD_FAILED',
    'permission': 'PERMISSION_DENIED',
    'denied': 'PERMISSION_DENIED',
    'storage': 'STORAGE_FULL',
    'quota': 'STORAGE_FULL',
    'network': 'NETWORK_ERROR',
    'fetch': 'NETWORK_ERROR'
  };

  /**
   * Classify PDF generation error
   */
  static classifyError(error: any, context?: string): PDFError {
    const errorMessage = error?.message || error?.toString() || 'Unknown PDF error';
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for specific error patterns
    let errorType: PDFErrorType = 'UNKNOWN_ERROR';
    
    for (const [pattern, type] of Object.entries(this.ERROR_PATTERNS)) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        errorType = type;
        break;
      }
    }

    // Context-specific error detection
    if (context === 'QR_GENERATION') {
      errorType = 'QR_GENERATION_FAILED';
    } else if (context === 'BROWSER_CHECK') {
      errorType = 'BROWSER_UNSUPPORTED';
    } else if (context === 'DATA_VALIDATION') {
      errorType = 'DATA_INVALID';
    }

    return this.createErrorDetails(errorType, errorMessage);
  }

  /**
   * Create detailed error information with user-friendly messages and actions
   */
  private static createErrorDetails(type: PDFErrorType, originalMessage: string): PDFError {
    const errorDetails: Record<PDFErrorType, Omit<PDFError, 'type' | 'message'>> = {
      BROWSER_UNSUPPORTED: {
        userMessage: "Browser doesn't support PDF generation",
        actionable: "Please use a modern browser like Chrome, Firefox, or Safari",
        retryable: false,
        fallbackAvailable: true,
        severity: 'high'
      },
      MEMORY_INSUFFICIENT: {
        userMessage: "Insufficient memory for PDF generation",
        actionable: "Close other browser tabs and try again, or use a device with more memory",
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      },
      DATA_INVALID: {
        userMessage: "Certificate data is incomplete or invalid",
        actionable: "Please ensure the breakthrough block contains all required information",
        retryable: false,
        fallbackAvailable: false,
        severity: 'medium'
      },
      QR_GENERATION_FAILED: {
        userMessage: "Failed to generate verification QR code",
        actionable: "QR code generation failed, but certificate can still be created without it",
        retryable: true,
        fallbackAvailable: true,
        severity: 'low'
      },
      FONT_LOADING_FAILED: {
        userMessage: "Failed to load certificate fonts",
        actionable: "Using fallback fonts for certificate generation",
        retryable: true,
        fallbackAvailable: true,
        severity: 'low'
      },
      IMAGE_PROCESSING_FAILED: {
        userMessage: "Failed to process certificate images",
        actionable: "Certificate will be generated without custom images",
        retryable: true,
        fallbackAvailable: true,
        severity: 'low'
      },
      PDF_CREATION_FAILED: {
        userMessage: "PDF document creation failed",
        actionable: "Try refreshing the page and generating the certificate again",
        retryable: true,
        fallbackAvailable: false,
        severity: 'high'
      },
      DOWNLOAD_FAILED: {
        userMessage: "Failed to download certificate",
        actionable: "Check your browser's download settings and available storage space",
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      },
      PERMISSION_DENIED: {
        userMessage: "Download permission denied",
        actionable: "Please allow downloads in your browser settings and try again",
        retryable: true,
        fallbackAvailable: false,
        severity: 'medium'
      },
      STORAGE_FULL: {
        userMessage: "Insufficient storage space",
        actionable: "Free up storage space on your device and try again",
        retryable: true,
        fallbackAvailable: false,
        severity: 'medium'
      },
      NETWORK_ERROR: {
        userMessage: "Network connection failed",
        actionable: "Check your internet connection and try again",
        retryable: true,
        fallbackAvailable: false,
        severity: 'medium'
      },
      UNKNOWN_ERROR: {
        userMessage: "Unexpected PDF generation error",
        actionable: "Try refreshing the page and generating the certificate again",
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      }
    };

    const details = errorDetails[type];
    return {
      type,
      message: originalMessage,
      ...details
    };
  }

  /**
   * Check if browser supports PDF generation
   */
  static checkBrowserSupport(): { supported: boolean; error?: PDFError } {
    try {
      // Check for required APIs
      if (typeof window === 'undefined') {
        return {
          supported: false,
          error: this.classifyError(new Error('Window object not available'), 'BROWSER_CHECK')
        };
      }

      if (!window.Blob) {
        return {
          supported: false,
          error: this.classifyError(new Error('Blob API not supported'), 'BROWSER_CHECK')
        };
      }

      if (!window.URL || !window.URL.createObjectURL) {
        return {
          supported: false,
          error: this.classifyError(new Error('URL API not supported'), 'BROWSER_CHECK')
        };
      }

      // Check for Canvas API (used by jsPDF)
      const canvas = document.createElement('canvas');
      if (!canvas.getContext || !canvas.getContext('2d')) {
        return {
          supported: false,
          error: this.classifyError(new Error('Canvas API not supported'), 'BROWSER_CHECK')
        };
      }

      return { supported: true };
    } catch (error) {
      return {
        supported: false,
        error: this.classifyError(error, 'BROWSER_CHECK')
      };
    }
  }

  /**
   * Validate certificate data before PDF generation
   */
  static validateCertificateData(data: any): { valid: boolean; error?: PDFError } {
    try {
      if (!data) {
        return {
          valid: false,
          error: this.classifyError(new Error('Certificate data is null or undefined'), 'DATA_VALIDATION')
        };
      }

      if (!data.breakthrough) {
        return {
          valid: false,
          error: this.classifyError(new Error('Breakthrough data is missing'), 'DATA_VALIDATION')
        };
      }

      if (!data.user) {
        return {
          valid: false,
          error: this.classifyError(new Error('User data is missing'), 'DATA_VALIDATION')
        };
      }

      if (!data.serialNumber) {
        return {
          valid: false,
          error: this.classifyError(new Error('Serial number is missing'), 'DATA_VALIDATION')
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: this.classifyError(error, 'DATA_VALIDATION')
      };
    }
  }

  /**
   * Get fallback options for failed PDF generation
   */
  static getFallbackOptions(error: PDFError): string[] {
    const fallbacks: string[] = [];

    switch (error.type) {
      case 'BROWSER_UNSUPPORTED':
        fallbacks.push('Try using Chrome, Firefox, or Safari browser');
        fallbacks.push('Update your browser to the latest version');
        break;
      case 'MEMORY_INSUFFICIENT':
        fallbacks.push('Close other browser tabs and try again');
        fallbacks.push('Generate certificate on a device with more memory');
        fallbacks.push('Try generating a simplified version without QR code');
        break;
      case 'QR_GENERATION_FAILED':
        fallbacks.push('Generate certificate without QR code verification');
        fallbacks.push('Manual verification using serial number');
        break;
      case 'FONT_LOADING_FAILED':
        fallbacks.push('Use system default fonts');
        fallbacks.push('Generate simplified certificate layout');
        break;
      case 'IMAGE_PROCESSING_FAILED':
        fallbacks.push('Generate text-only certificate');
        fallbacks.push('Use simplified layout without images');
        break;
      case 'DOWNLOAD_FAILED':
        fallbacks.push('Right-click and "Save As" when PDF opens');
        fallbacks.push('Check browser download settings');
        fallbacks.push('Try using a different browser');
        break;
      default:
        fallbacks.push('Refresh the page and try again');
        fallbacks.push('Try using a different browser');
        fallbacks.push('Contact support if the issue persists');
    }

    return fallbacks;
  }

  /**
   * Format error for logging
   */
  static formatForLog(error: PDFError): string {
    return `[PDF_${error.type}] ${error.message} | User: ${error.userMessage} | Action: ${error.actionable}`;
  }

  /**
   * Get notification type based on error severity
   */
  static getNotificationType(error: PDFError): 'error' | 'warning' | 'info' {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'warning';
    }
  }
}