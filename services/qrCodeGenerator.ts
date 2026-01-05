import QRCode from 'qrcode';
import { SolvedBlock, User } from '../types';

export interface BlockchainVerificationData {
  blockId: string;
  userAddress: string;
  timestamp: string;
  blockchainHash?: string;
  grade: string;
  advancementLevel: number;
  serialNumber: string;
}

export interface QRCodeOptions {
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark: string;
    light: string;
  };
}

/**
 * Advanced QR Code Generator for Blockchain Verification
 * Creates secure, high-quality QR codes for NFT certificate authentication
 */
export class BlockchainQRGenerator {
  private static readonly DEFAULT_OPTIONS: QRCodeOptions = {
    size: 256,
    margin: 2,
    errorCorrectionLevel: 'H', // Highest error correction for premium certificates
    color: {
      dark: '#0B1426', // Deep Navy
      light: '#FAFAFA'  // Diamond White
    }
  };

  private static readonly VERIFICATION_BASE_URL = 'https://sovereignlattice.com/verify';

  /**
   * Generate blockchain verification data from breakthrough and user
   */
  public static createVerificationData(
    breakthrough: SolvedBlock, 
    user: User, 
    serialNumber: string
  ): BlockchainVerificationData {
    return {
      blockId: breakthrough.id,
      userAddress: user.address,
      timestamp: breakthrough.timestamp,
      blockchainHash: breakthrough.hash,
      grade: breakthrough.grade || 'C',
      advancementLevel: breakthrough.advancementLevel || 1,
      serialNumber
    };
  }

  /**
   * Create verification URL with encoded data
   */
  public static createVerificationURL(verificationData: BlockchainVerificationData): string {
    // Create a compact, URL-safe encoded verification string
    const dataString = JSON.stringify({
      id: verificationData.blockId,
      addr: verificationData.userAddress,
      ts: verificationData.timestamp,
      hash: verificationData.blockchainHash,
      grade: verificationData.grade,
      level: verificationData.advancementLevel,
      serial: verificationData.serialNumber
    });

    // Base64 encode for URL safety
    const encodedData = btoa(dataString);
    return `${this.VERIFICATION_BASE_URL}/${encodedData}`;
  }

  /**
   * Generate QR code as Data URL for embedding in PDFs
   */
  public static async generateQRCodeDataURL(
    verificationData: BlockchainVerificationData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const verificationURL = this.createVerificationURL(verificationData);

    try {
      return await QRCode.toDataURL(verificationURL, {
        width: finalOptions.size,
        margin: finalOptions.margin,
        color: finalOptions.color,
        errorCorrectionLevel: finalOptions.errorCorrectionLevel
      });
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code as SVG string for scalable graphics
   */
  public static async generateQRCodeSVG(
    verificationData: BlockchainVerificationData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const verificationURL = this.createVerificationURL(verificationData);

    try {
      return await QRCode.toString(verificationURL, {
        type: 'svg',
        width: finalOptions.size,
        margin: finalOptions.margin,
        color: finalOptions.color,
        errorCorrectionLevel: finalOptions.errorCorrectionLevel
      });
    } catch (error) {
      console.error('QR Code SVG generation failed:', error);
      throw new Error(`Failed to generate QR code SVG: ${error.message}`);
    }
  }

  /**
   * Generate QR code as Canvas element for web display
   */
  public static async generateQRCodeCanvas(
    verificationData: BlockchainVerificationData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<HTMLCanvasElement> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const verificationURL = this.createVerificationURL(verificationData);

    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, verificationURL, {
        width: finalOptions.size,
        margin: finalOptions.margin,
        color: finalOptions.color,
        errorCorrectionLevel: finalOptions.errorCorrectionLevel
      });
      return canvas;
    } catch (error) {
      console.error('QR Code canvas generation failed:', error);
      throw new Error(`Failed to generate QR code canvas: ${error.message}`);
    }
  }

  /**
   * Create premium QR code with grade-specific colors (matching template system)
   */
  public static async generatePremiumQRCode(
    verificationData: BlockchainVerificationData,
    grade: 'S' | 'A' | 'B' | 'C' = 'C'
  ): Promise<string> {
    // Grade-specific color schemes matching the existing GRADE_COLORS system
    const gradeColors = {
      'S': { dark: '#C5A059', light: '#FFF8E7' }, // Gold
      'A': { dark: '#3b82f6', light: '#EFF6FF' }, // Blue
      'B': { dark: '#22c55e', light: '#F0FDF4' }, // Green
      'C': { dark: '#6b7280', light: '#F9FAFB' }  // Gray
    };

    const premiumOptions: QRCodeOptions = {
      size: 300, // Larger size for premium certificates
      margin: 3,
      errorCorrectionLevel: 'H',
      color: gradeColors[grade]
    };

    return this.generateQRCodeDataURL(verificationData, premiumOptions);
  }

  /**
   * Validate verification URL format
   */
  public static validateVerificationURL(url: string): boolean {
    try {
      const urlPattern = new RegExp(`^${this.VERIFICATION_BASE_URL}/[A-Za-z0-9+/]+=*$`);
      return urlPattern.test(url);
    } catch {
      return false;
    }
  }

  /**
   * Decode verification data from URL
   */
  public static decodeVerificationURL(url: string): BlockchainVerificationData | null {
    try {
      if (!this.validateVerificationURL(url)) {
        return null;
      }

      const encodedData = url.replace(`${this.VERIFICATION_BASE_URL}/`, '');
      const decodedString = atob(encodedData);
      const data = JSON.parse(decodedString);

      return {
        blockId: data.id,
        userAddress: data.addr,
        timestamp: data.ts,
        blockchainHash: data.hash,
        grade: data.grade,
        advancementLevel: data.level,
        serialNumber: data.serial
      };
    } catch (error) {
      console.error('Failed to decode verification URL:', error);
      return null;
    }
  }

  /**
   * Generate multiple QR code formats for different use cases (with consistent colors)
   */
  public static async generateQRCodeBundle(
    verificationData: BlockchainVerificationData,
    grade: 'S' | 'A' | 'B' | 'C' = 'C'
  ): Promise<{
    dataURL: string;
    svg: string;
    canvas: HTMLCanvasElement;
    verificationURL: string;
  }> {
    const verificationURL = this.createVerificationURL(verificationData);

    // Use consistent grade colors
    const gradeColors = {
      'S': { dark: '#C5A059', light: '#FFF8E7' }, // Gold
      'A': { dark: '#3b82f6', light: '#EFF6FF' }, // Blue
      'B': { dark: '#22c55e', light: '#F0FDF4' }, // Green
      'C': { dark: '#6b7280', light: '#F9FAFB' }  // Gray
    };

    const [dataURL, svg, canvas] = await Promise.all([
      this.generatePremiumQRCode(verificationData, grade),
      this.generateQRCodeSVG(verificationData, { 
        size: 300, 
        errorCorrectionLevel: 'H',
        color: gradeColors[grade]
      }),
      this.generateQRCodeCanvas(verificationData, { 
        size: 300, 
        errorCorrectionLevel: 'H',
        color: gradeColors[grade]
      })
    ]);

    return {
      dataURL,
      svg,
      canvas,
      verificationURL
    };
  }

  /**
   * Create QR code with embedded logo (for premium branding)
   */
  public static async generateBrandedQRCode(
    verificationData: BlockchainVerificationData,
    logoDataURL?: string,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    // Generate base QR code
    const qrDataURL = await this.generatePremiumQRCode(verificationData, verificationData.grade as any);

    // If no logo provided, return standard QR code
    if (!logoDataURL) {
      return qrDataURL;
    }

    // Create canvas to combine QR code with logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    canvas.width = finalOptions.size;
    canvas.height = finalOptions.size;

    return new Promise((resolve, reject) => {
      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, finalOptions.size, finalOptions.size);

        // Add logo in center
        const logoImage = new Image();
        logoImage.onload = () => {
          const logoSize = finalOptions.size * 0.2; // 20% of QR code size
          const logoX = (finalOptions.size - logoSize) / 2;
          const logoY = (finalOptions.size - logoSize) / 2;

          // Add white background for logo
          ctx.fillStyle = 'white';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

          // Draw logo
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

          resolve(canvas.toDataURL());
        };
        logoImage.onerror = () => reject(new Error('Failed to load logo image'));
        logoImage.src = logoDataURL;
      };
      qrImage.onerror = () => reject(new Error('Failed to load QR code image'));
      qrImage.src = qrDataURL;
    });
  }
}

// Export convenience functions
export const createBlockchainQRCode = BlockchainQRGenerator.generatePremiumQRCode;
export const createVerificationData = BlockchainQRGenerator.createVerificationData;
export const generateQRBundle = BlockchainQRGenerator.generateQRCodeBundle;
export const validateQRVerification = BlockchainQRGenerator.validateVerificationURL;