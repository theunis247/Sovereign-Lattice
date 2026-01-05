import jsPDF from 'jspdf';
import { SolvedBlock, User } from '../types';
import { BlockchainQRGenerator, createVerificationData } from './qrCodeGenerator';
import { PDFErrorHandler, PDFError } from './pdfErrorHandler';

export interface CertificateData {
  serialNumber: string;
  breakthrough: SolvedBlock;
  user: User;
  generationDate: string;
  blockchainHash?: string;
  qrCodeData: string;
  authenticity: {
    signature: string;
    timestamp: string;
    verificationUrl: string;
  };
}

export interface PDFGenerationProgress {
  stage: 'preparing' | 'generating_qr' | 'creating_layout' | 'adding_content' | 'finalizing';
  progress: number;
  message: string;
}

export type PDFProgressCallback = (progress: PDFGenerationProgress) => void;

/**
 * Ultra-Premium NFT Certificate Generator
 * Focuses on reliable rendering with luxury design
 */
export class PremiumPDFGenerator {
  // Ultra-luxury grade-specific color schemes
  private static readonly GRADE_COLORS = {
    S: { primary: '#FFD700', secondary: '#FFA500', accent: '#FFFF00', text: '#B8860B' }, // Gold
    A: { primary: '#C0C0C0', secondary: '#A8A8A8', accent: '#E5E5E5', text: '#696969' }, // Platinum
    B: { primary: '#CD7F32', secondary: '#D2691E', accent: '#DEB887', text: '#8B4513' }, // Bronze
    C: { primary: '#4169E1', secondary: '#6495ED', accent: '#87CEEB', text: '#191970' }  // Royal Blue
  };

  // PDF dimensions and layout constants
  private static readonly LAYOUT = {
    WIDTH: 210,
    HEIGHT: 297,
    MARGIN: 15,
    CENTER_X: 105,
    QR_SIZE: 20,
    LOGO_SIZE: 15
  };

  /**
   * Generate premium NFT certificate with reliable rendering
   */
  public static async generateCertificate(
    certificateData: CertificateData,
    progressCallback?: PDFProgressCallback
  ): Promise<Blob> {
    try {
      // Browser and data validation
      const browserCheck = PDFErrorHandler.checkBrowserSupport();
      if (!browserCheck.supported) throw browserCheck.error;

      const dataValidation = PDFErrorHandler.validateCertificateData(certificateData);
      if (!dataValidation.valid) throw dataValidation.error;

      progressCallback?.({
        stage: 'preparing',
        progress: 10,
        message: 'Initializing premium NFT certificate...'
      });

      // Create PDF with optimal settings for ultra-luxury A4 rendering
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4' // Standard A4 format (210 x 297 mm)
      });

      // Set document metadata (if supported)
      try {
        pdf.setProperties({
          title: `Quantum Breakthrough NFT Certificate - ${certificateData.breakthrough.id}`,
          subject: 'Premium Scientific Breakthrough NFT Certificate',
          author: 'Sovereign Lattice Platform',
          creator: 'Quantum Breakthrough System'
        });
      } catch (e) {
        // Properties not supported in this version
      }

      progressCallback?.({
        stage: 'generating_qr',
        progress: 25,
        message: 'Generating blockchain verification QR code...'
      });

      // Generate QR code with fallback
      let qrCodeDataUrl: string | null = null;
      try {
        const verificationData = createVerificationData(
          certificateData.breakthrough,
          certificateData.user,
          certificateData.serialNumber
        );
        qrCodeDataUrl = await BlockchainQRGenerator.generatePremiumQRCode(
          verificationData,
          certificateData.breakthrough.grade as 'S' | 'A' | 'B' | 'C' || 'C'
        );
      } catch (error) {
        console.warn('QR code generation failed, continuing without QR code');
      }

      progressCallback?.({
        stage: 'creating_layout',
        progress: 40,
        message: 'Creating premium certificate layout...'
      });

      // Create the certificate layout
      this.createCertificateLayout(pdf, certificateData, qrCodeDataUrl);

      progressCallback?.({
        stage: 'finalizing',
        progress: 100,
        message: 'Premium NFT certificate complete!'
      });

      // Return PDF blob
      const pdfOutput = pdf.output('arraybuffer');
      return new Blob([pdfOutput], { type: 'application/pdf' });

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      throw PDFErrorHandler.classifyError(error);
    }
  }

  /**
   * Create clean, well-spaced NFT certificate layout for A4
   */
  private static createCertificateLayout(
    pdf: jsPDF,
    data: CertificateData,
    qrCodeDataUrl: string | null
  ): void {
    const grade = data.breakthrough.grade || 'C';
    const colors = this.GRADE_COLORS[grade as keyof typeof this.GRADE_COLORS];

    // Clean layout with proper A4 spacing
    this.addCleanBackground(pdf, colors);
    this.addSpacedHeader(pdf, data, colors);
    this.addSpacedHeroSection(pdf, data, colors);
    this.addSpacedTechPanel(pdf, data, colors);
    this.addSpacedBlockchainSection(pdf, data, qrCodeDataUrl, colors);
    this.addSpacedFooter(pdf, data, colors);
  }

  /**
   * Add clean background without interference
   */
  private static addCleanBackground(pdf: jsPDF, colors: any): void {
    const { WIDTH, HEIGHT } = this.LAYOUT;

    // Pure white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, WIDTH, HEIGHT, 'F');

    // Simple border frame
    const primaryRGB = this.hexToRgb(colors.primary);
    pdf.setDrawColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setLineWidth(1);
    pdf.rect(10, 10, WIDTH - 20, HEIGHT - 20, 'S');
  }

  /**
   * Add futuristic header with modern typography and holographic elements
   */
  private static addFuturisticHeader(pdf: jsPDF, data: CertificateData, colors: any): void {
    const { CENTER_X, WIDTH } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);

    // Modern header container
    const headerHeight = 45;
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(0, 0, WIDTH, headerHeight, 'F');

    // Gradient overlay for depth
    for (let i = 0; i < headerHeight; i++) {
      const intensity = i / headerHeight;
      pdf.setFillColor(
        Math.floor(primaryRGB.r + (50 * intensity)),
        Math.floor(primaryRGB.g + (50 * intensity)),
        Math.floor(primaryRGB.b + (50 * intensity))
      );
      pdf.rect(0, i, WIDTH, 1, 'F');
    }

    // Holographic accent lines
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(0, headerHeight - 2, WIDTH, headerHeight - 2);
    pdf.line(0, headerHeight - 1, WIDTH, headerHeight - 1);

    // Modern logo/symbol
    const logoX = 40;
    const logoY = 22;
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(2);
    
    // Hexagonal tech symbol
    const hexSize = 8;
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      hexPoints.push([
        logoX + hexSize * Math.cos(angle),
        logoY + hexSize * Math.sin(angle)
      ]);
    }
    
    for (let i = 0; i < 6; i++) {
      const start = hexPoints[i];
      const end = hexPoints[(i + 1) % 6];
      pdf.line(start[0], start[1], end[0], end[1]);
    }

    // Inner tech pattern
    pdf.setLineWidth(1);
    pdf.line(logoX - 4, logoY, logoX + 4, logoY);
    pdf.line(logoX, logoY - 4, logoX, logoY + 4);

    // Main title - Modern sans-serif style
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    const mainTitle = 'QUANTUM BREAKTHROUGH';
    this.centerText(pdf, mainTitle, CENTER_X, 18);

    // Subtitle
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    const subtitle = 'SCIENTIFIC ACHIEVEMENT NFT';
    this.centerText(pdf, subtitle, CENTER_X, 32);

    // Grade indicator - Modern pill design
    const gradeX = WIDTH - 60;
    const gradeY = 22;
    const pillWidth = 40;
    const pillHeight = 16;

    // Pill background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(gradeX - pillWidth/2, gradeY - pillHeight/2, pillWidth, pillHeight, 'F');

    // Pill border
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1);
    pdf.rect(gradeX - pillWidth/2, gradeY - pillHeight/2, pillWidth, pillHeight, 'S');

    // Grade text
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    const gradeText = `TIER ${data.breakthrough.grade || 'C'}`;
    this.centerText(pdf, gradeText, gradeX, gradeY + 2);
  }

  /**
   * Helper function to center text (compatible with jsPDF v4)
   */
  private static centerText(pdf: jsPDF, text: string, x: number, y: number): void {
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, x - (textWidth / 2), y);
  }

  /**
   * Helper function to convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Add clean hero section with proper spacing
   */
  private static addHeroSection(pdf: jsPDF, data: CertificateData, colors: any): void {
    const { CENTER_X, WIDTH } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);
    const startY = 70; // More space after header

    // Achievement statement
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const statement = 'This certifies that';
    this.centerText(pdf, statement, CENTER_X, startY);

    // Recipient name - Large and prominent
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(40, 40, 40);
    const recipientName = data.user.username.toUpperCase();
    this.centerText(pdf, recipientName, CENTER_X, startY + 20);

    // Clean underline
    const nameWidth = pdf.getTextWidth(recipientName);
    pdf.setDrawColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setLineWidth(1.5);
    pdf.line(CENTER_X - nameWidth/2, startY + 25, CENTER_X + nameWidth/2, startY + 25);

    // Achievement description with proper spacing
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(80, 80, 80);
    const achievement = 'has achieved a Quantum Breakthrough in';
    this.centerText(pdf, achievement, CENTER_X, startY + 45);

    // Breakthrough title - properly wrapped and spaced
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    
    // Truncate long titles to prevent overflow
    let breakthroughTitle = data.breakthrough.problem;
    if (breakthroughTitle.length > 60) {
      breakthroughTitle = breakthroughTitle.substring(0, 60) + '...';
    }
    breakthroughTitle = `"${breakthroughTitle}"`;
    
    this.centerText(pdf, breakthroughTitle, CENTER_X, startY + 65);
  }

  /**
   * Add technical specifications panel with clean spacing
   */
  private static addTechSpecsPanel(pdf: jsPDF, data: CertificateData, colors: any): void {
    const { CENTER_X } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);
    const panelY = 160; // Proper spacing from hero section
    const panelWidth = 140;
    const panelHeight = 45;
    const panelX = CENTER_X - panelWidth/2;

    // Clean card background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(panelX, panelY, panelWidth, panelHeight, 'F');

    // Card border
    pdf.setDrawColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setLineWidth(1);
    pdf.rect(panelX, panelY, panelWidth, panelHeight, 'S');

    // Top accent bar
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(panelX, panelY, panelWidth, 2, 'F');

    // Panel title
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    this.centerText(pdf, 'TECHNICAL SPECIFICATIONS', CENTER_X, panelY + 12);

    // Specifications in a clean 2x2 grid
    const specs = [
      { label: 'COMPLEXITY', value: this.getComplexityLevel(data.breakthrough.grade || 'C') },
      { label: 'IMPACT', value: this.getImpactLevel(data.breakthrough.grade || 'C') },
      { label: 'VERIFICATION', value: 'BLOCKCHAIN' },
      { label: 'RARITY', value: this.getRarityLevel(data.breakthrough.grade || 'C') }
    ];

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(7);
    
    const leftCol = panelX + 8;
    const rightCol = panelX + panelWidth/2 + 4;
    let specY = panelY + 20;

    specs.forEach((spec, index) => {
      const x = index % 2 === 0 ? leftCol : rightCol;
      const y = specY + Math.floor(index / 2) * 10;

      // Label
      pdf.setTextColor(120, 120, 120);
      pdf.text(spec.label, x, y);
      
      // Value
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('Helvetica', 'bold');
      pdf.text(spec.value, x, y + 5);
      pdf.setFont('Helvetica', 'normal');
    });
  }

  /**
   * Add blockchain verification section with clean layout
   */
  private static addBlockchainSection(
    pdf: jsPDF,
    data: CertificateData,
    qrCodeDataUrl: string | null,
    colors: any
  ): void {
    const { WIDTH, CENTER_X, QR_SIZE } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);
    const sectionY = 220; // Proper spacing from tech specs

    // Section title
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    this.centerText(pdf, 'BLOCKCHAIN VERIFICATION', CENTER_X, sectionY);

    // Clean layout with QR on left, details on right
    if (qrCodeDataUrl) {
      const qrX = 60;
      const qrY = sectionY + 15;

      // Simple QR frame
      pdf.setDrawColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      pdf.setLineWidth(1);
      pdf.rect(qrX - 2, qrY - 2, QR_SIZE + 4, QR_SIZE + 4, 'S');

      // Add QR code
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE);

      // QR label
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      this.centerText(pdf, 'SCAN TO VERIFY', qrX + QR_SIZE/2, qrY + QR_SIZE + 8);
    }

    // Verification features - clean list
    const featuresX = 110;
    const featuresY = sectionY + 20;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);

    const features = [
      'IMMUTABLE RECORD',
      'CRYPTOGRAPHIC PROOF',
      'DECENTRALIZED VALIDATION'
    ];

    features.forEach((feature, index) => {
      // Simple bullet
      pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      pdf.circle(featuresX, featuresY + (index * 8), 0.8, 'F');
      
      // Feature text
      pdf.text(feature, featuresX + 4, featuresY + (index * 8) + 1);
    });
  }

  /**
   * Add clean NFT metadata section
   */
  private static addNFTMetadata(pdf: jsPDF, data: CertificateData, colors: any): void {
    const { CENTER_X } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);
    const metadataY = 260; // Proper spacing

    // NFT badge - clean design
    const badgeWidth = 100;
    const badgeHeight = 16;
    const badgeX = CENTER_X - badgeWidth/2;

    // Badge background
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(badgeX, metadataY, badgeWidth, badgeHeight, 'F');

    // Badge text
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    const tokenId = `QBS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const badgeText = `NFT • ${tokenId} • 1/1`;
    this.centerText(pdf, badgeText, CENTER_X, metadataY + 11);

    // Metadata - simple two-column layout
    const metaY = metadataY + 30;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(8);

    // Left: Issue Date
    pdf.setTextColor(120, 120, 120);
    pdf.text('ISSUE DATE', 70, metaY);
    pdf.setTextColor(40, 40, 40);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(data.generationDate, 70, metaY + 6);

    // Right: Status
    pdf.setFont('Helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text('STATUS', 140, metaY);
    pdf.setTextColor(40, 40, 40);
    pdf.setFont('Helvetica', 'bold');
    pdf.text('VERIFIED', 140, metaY + 6);
  }

  /**
   * Add clean digital seals section
   */
  private static addDigitalSeals(pdf: jsPDF, data: CertificateData, colors: any): void {
    const { WIDTH, CENTER_X } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);
    const sealY = 290; // Proper spacing

    // Authority signatures - clean layout
    const leftSig = 60;
    const rightSig = WIDTH - 60;

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);

    // Left authority
    pdf.text('SOVEREIGN LATTICE', leftSig - 20, sealY);
    pdf.text('Scientific Authority', leftSig - 20, sealY + 6);
    
    // Clean signature line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(leftSig - 20, sealY + 10, leftSig + 20, sealY + 10);

    // Right authority
    pdf.text('QUANTUM REGISTRY', rightSig - 20, sealY);
    pdf.text('Blockchain Validator', rightSig - 20, sealY + 6);
    
    // Clean signature line
    pdf.line(rightSig - 20, sealY + 10, rightSig + 20, sealY + 10);

    // Central verification seal - simple and clean
    const sealRadius = 6;
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.circle(CENTER_X, sealY + 5, sealRadius, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(4);
    pdf.setTextColor(255, 255, 255);
    this.centerText(pdf, 'VERIFIED', CENTER_X, sealY + 7);
  }

  /**
   * Add clean footer without interfering elements
   */
  private static addPremiumFinish(pdf: jsPDF, colors: any): void {
    const { WIDTH, HEIGHT, CENTER_X } = this.LAYOUT;
    const primaryRGB = this.hexToRgb(colors.primary);

    // Simple footer line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(40, HEIGHT - 15, WIDTH - 40, HEIGHT - 15);

    // Clean copyright
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    const copyright = '© 2026 SOVEREIGN LATTICE PLATFORM • QUANTUM BREAKTHROUGH SYSTEM';
    this.centerText(pdf, copyright, CENTER_X, HEIGHT - 8);

    // Simple corner accents - minimal
    pdf.setDrawColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setLineWidth(1);
    const accentSize = 6;

    // Just corner L-shapes
    pdf.line(15, 15, 15 + accentSize, 15);
    pdf.line(15, 15, 15, 15 + accentSize);
    
    pdf.line(WIDTH - 15, 15, WIDTH - 15 - accentSize, 15);
    pdf.line(WIDTH - 15, 15, WIDTH - 15, 15 + accentSize);

    pdf.line(15, HEIGHT - 15, 15 + accentSize, HEIGHT - 15);
    pdf.line(15, HEIGHT - 15, 15, HEIGHT - 15 - accentSize);
    
    pdf.line(WIDTH - 15, HEIGHT - 15, WIDTH - 15 - accentSize, HEIGHT - 15);
    pdf.line(WIDTH - 15, HEIGHT - 15, WIDTH - 15, HEIGHT - 15 - accentSize);
  }

  /**
   * Helper method to get complexity level based on grade
   */
  private static getComplexityLevel(grade: string): string {
    const complexityMap: { [key: string]: string } = {
      'S': 'QUANTUM SUPREME',
      'A': 'ULTRA ADVANCED',
      'B': 'HIGHLY COMPLEX',
      'C': 'ADVANCED',
      'D': 'STANDARD'
    };
    return complexityMap[grade] || 'STANDARD';
  }

  /**
   * Helper method to get impact level based on grade
   */
  private static getImpactLevel(grade: string): string {
    const impactMap: { [key: string]: string } = {
      'S': 'REVOLUTIONARY',
      'A': 'BREAKTHROUGH',
      'B': 'SIGNIFICANT',
      'C': 'NOTABLE',
      'D': 'FOUNDATIONAL'
    };
    return impactMap[grade] || 'FOUNDATIONAL';
  }

  /**
   * Helper method to get rarity level based on grade
   */
  private static getRarityLevel(grade: string): string {
    const rarityMap: { [key: string]: string } = {
      'S': 'MYTHIC',
      'A': 'LEGENDARY', 
      'B': 'EPIC',
      'C': 'RARE',
      'D': 'UNCOMMON'
    };
    return rarityMap[grade] || 'COMMON';
  }



  /**
   * Utility function to wrap text properly
   */
  private static wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = pdf.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Generate certificate data with enhanced security
   */
  public static generateCertificateData(breakthrough: SolvedBlock, user: User): CertificateData {
    const timestamp = new Date().toISOString();
    const timestampShort = Date.now().toString();
    const randomId = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    const serialNumber = `NFT-QBS-CERT-${timestampShort}-${randomId}-${breakthrough.grade || 'C'}${breakthrough.advancementLevel || 1}`;
    
    const userHash = user.address.substring(2, 10).toUpperCase();
    const blockHash = breakthrough.hash ? breakthrough.hash.substring(0, 16).toUpperCase() : 'GENESIS';
    const gradeHash = (breakthrough.grade || 'C').charCodeAt(0).toString(16).toUpperCase();
    const timestampHash = timestampShort.substring(-8);
    
    const digitalSignature = `NFT_SIG_${userHash}_${blockHash}_${gradeHash}${timestampHash}_${Math.random().toString(16).slice(2, 18).toUpperCase()}_LATTICE_AUTH_${randomId}_BLOCKCHAIN_VERIFIED`;
    
    return {
      serialNumber,
      breakthrough,
      user,
      generationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      qrCodeData: `https://sovereignlattice.com/verify/${serialNumber}`,
      authenticity: {
        signature: digitalSignature,
        timestamp,
        verificationUrl: `https://sovereignlattice.com/verify/${serialNumber}`
      }
    };
  }

  /**
   * Download PDF with enhanced error handling
   */
  public static downloadPDF(blob: Blob, breakthrough: SolvedBlock, user: User): void {
    try {
      if (!blob || blob.size === 0) {
        throw PDFErrorHandler.classifyError(new Error('Invalid or empty PDF blob'), 'DOWNLOAD_FAILED');
      }

      if (!breakthrough || !user) {
        throw PDFErrorHandler.classifyError(new Error('Missing breakthrough or user data'), 'DATA_INVALID');
      }

      if (typeof window === 'undefined' || !window.URL || !window.URL.createObjectURL) {
        throw PDFErrorHandler.classifyError(new Error('Browser does not support file downloads'), 'BROWSER_UNSUPPORTED');
      }

      const filename = `Quantum_Breakthrough_NFT_Certificate_${breakthrough.id}_${user.username}_${Date.now()}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      throw PDFErrorHandler.classifyError(error, 'DOWNLOAD_FAILED');
    }
  }

  /**
   * Safe PDF download with fallback options
   */
  public static async safeDownloadPDF(
    blob: Blob, 
    breakthrough: SolvedBlock, 
    user: User,
    onError?: (error: PDFError) => void
  ): Promise<boolean> {
    try {
      this.downloadPDF(blob, breakthrough, user);
      return true;
    } catch (error) {
      const pdfError = error as PDFError;
      
      if (onError) {
        onError(pdfError);
      }

      // Try fallback: open in new window
      if (pdfError.fallbackAvailable) {
        try {
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          
          if (newWindow) {
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            return true;
          }
        } catch (fallbackError) {
          console.warn('Fallback download method failed:', fallbackError);
        }
      }

      return false;
    }
  }
}

// Export convenience functions
export const generatePremiumCertificate = PremiumPDFGenerator.generateCertificate;
export const downloadCertificatePDF = PremiumPDFGenerator.downloadPDF;
export const createCertificateData = PremiumPDFGenerator.generateCertificateData;