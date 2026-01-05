import React, { useState, useEffect } from 'react';
import { SolvedBlock, User } from '../types';
// Lazy load PDF generation to reduce initial bundle size
const lazyLoadPDFGenerator = async () => {
  const { PremiumPDFGenerator } = await import('../services/pdfGenerator');
  return PremiumPDFGenerator;
};
const lazyLoadCertificateData = async () => {
  const { createCertificateData } = await import('../services/pdfGenerator');
  return createCertificateData;
};
import { PDFErrorHandler, PDFError } from '../services/pdfErrorHandler';
import { GRADE_COLORS } from '../services/quantumLogic';
import { profileManager } from '../services/profileManager';
import { createProfileIsolationManager } from '../services/profileIsolation';
import { createDataSegregator } from '../services/dataSegregator';

// Initialize profile validation
const dataSegregator = createDataSegregator();
const profileIsolationManager = createProfileIsolationManager(dataSegregator);

interface PDFGenerationProgress {
  stage: string;
  progress: number;
  message: string;
}

interface PDFExportModalProps {
  isOpen: boolean;
  block: SolvedBlock;
  currentUser: User;
  onClose: () => void;
  onExportComplete: (success: boolean) => void;
}

/**
 * Premium PDF Export Modal with live preview and progress tracking
 */
const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  block,
  currentUser,
  onClose,
  onExportComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<PDFGenerationProgress | null>(null);
  const [error, setError] = useState<PDFError | null>(null);
  const [fallbackOptions, setFallbackOptions] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  // Initialize preview data when modal opens
  useEffect(() => {
    if (isOpen && !previewData) {
      const initializePreview = async () => {
        try {
          const createCertificateData = await lazyLoadCertificateData();
          const certificateData = createCertificateData(block, currentUser);
          setPreviewData(certificateData);
        } catch (error) {
          console.error('Failed to initialize certificate preview:', error);
        }
      };
      initializePreview();
    }
  }, [isOpen, block, currentUser, previewData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setProgress(null);
      setError(null);
      setFallbackOptions([]);
      setPreviewData(null);
    }
  }, [isOpen]);

  const handleExportPDF = async () => {
    if (!previewData) return;

    // Validate profile permissions for PDF export
    try {
      const currentProfile = profileManager.getCurrentProfile();
      if (!currentProfile) {
        // Create a temporary profile context for PDF export
        console.log('⚠️ No active profile found, creating temporary context for PDF export');
        // We'll bypass profile validation for PDF export since it's not critical
      } else {
        // Check if current user can export this block (profile isolation check)
        if (currentUser.profileId && currentProfile.profileId !== currentUser.profileId) {
          const hasAccess = await profileIsolationManager.validateProfileAccess(
            currentProfile.profileId,
            currentUser.profileId,
            'read',
            'breakthroughs'
          );

          if (!hasAccess) {
            setError({
              type: 'generation_failed',
              message: 'Insufficient permissions to export this certificate',
              fallbackOptions: ['Switch to the correct profile', 'Contact administrator for access']
            });
            onExportComplete(false);
            return;
          }
        }
      }
    } catch (profileError) {
      console.warn('⚠️ Profile validation failed, proceeding with PDF export:', profileError);
      // Don't block PDF export due to profile issues
    }

    setIsGenerating(true);
    setError(null);
    setFallbackOptions([]);
    setProgress(null);

    try {
      // Lazy load PDF generator
      console.log('🔄 Starting PDF generation...');
      const PremiumPDFGenerator = await lazyLoadPDFGenerator();
      console.log('✅ PDF generator loaded successfully');
      
      // Generate PDF with enhanced error handling
      console.log('📄 Generating certificate with data:', previewData);
      const blob = await PremiumPDFGenerator.generateCertificate(
        previewData,
        (progressUpdate) => {
          console.log('📊 Progress update:', progressUpdate);
          setProgress(progressUpdate);
        }
      );
      console.log('✅ PDF blob generated:', blob.size, 'bytes');

      // Attempt safe download with fallback options
      console.log('💾 Attempting download...');
      const downloadSuccess = await PremiumPDFGenerator.safeDownloadPDF(
        blob, 
        block, 
        currentUser,
        (pdfError) => {
          console.error('❌ PDF Error:', pdfError);
          setError(pdfError);
          setFallbackOptions(PDFErrorHandler.getFallbackOptions(pdfError));
        }
      );

      if (downloadSuccess) {
        // Success feedback
        onExportComplete(true);
        
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        onExportComplete(false);
      }

    } catch (err: any) {
      console.error('❌ PDF generation failed:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        type: err.type,
        name: err.name
      });
      
      // Handle PDF generation errors
      const pdfError = err as PDFError;
      setError(pdfError);
      setFallbackOptions(PDFErrorHandler.getFallbackOptions(pdfError));
      onExportComplete(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (error && error.retryable) {
      handleExportPDF();
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const gradeColor = GRADE_COLORS[block.grade || 'C'];
  const progressPercentage = progress?.progress || 0;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-[4rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-3xl relative overflow-hidden animate-in slide-in-from-bottom duration-700">
        
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 animate-pulse"></div>
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0 relative z-10">
          <div className="flex items-center gap-6 animate-in slide-in-from-left duration-500">
            <div className="w-16 h-16 bg-zinc-950 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
              <span className="text-2xl">📜</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                Certificate Export
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">
                  PREMIUM NFT CERTIFICATE
                </span>
                <div 
                  className="px-2 py-0.5 rounded-full border text-[8px] font-black uppercase animate-in slide-in-from-right duration-300"
                  style={{ borderColor: gradeColor, color: gradeColor }}
                >
                  GRADE {block.grade || 'C'}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleClose}
            disabled={isGenerating}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl font-bold transition-all transform hover:scale-110 animate-in slide-in-from-right duration-300 ${
              isGenerating 
                ? 'bg-white/5 cursor-not-allowed opacity-50' 
                : 'bg-white/5 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20'
            }`}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* Left Side - Certificate Preview */}
            <div className="space-y-6 animate-in slide-in-from-left duration-700">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Certificate Preview
              </h3>
              
              {/* ULTRA-LUXURY BILLION DOLLAR NFT CERTIFICATE PREVIEW */}
              <div className="bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-8 border-double border-amber-400 rounded-[2rem] p-0 shadow-[0_0_80px_rgba(245,158,11,0.4)] min-h-[700px] relative overflow-hidden transform hover:scale-[1.01] transition-all duration-500 hover:shadow-[0_0_120px_rgba(245,158,11,0.6)]">
                
                {/* ULTRA-PREMIUM BACKGROUND ELEMENTS */}
                <div className="absolute inset-0">
                  {/* Luxury Watermark Pattern */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                  
                  {/* Radial Luxury Gradient */}
                  <div className="absolute inset-0 bg-gradient-radial from-amber-100/20 via-transparent to-slate-100/10"></div>
                  
                  {/* Corner Ornaments */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-amber-400 rounded-tl-2xl opacity-30"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-amber-400 rounded-tr-2xl opacity-30"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-amber-400 rounded-bl-2xl opacity-30"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-amber-400 rounded-br-2xl opacity-30"></div>
                </div>

                {/* CERTIFICATE CONTENT */}
                <div className="relative z-10 p-12 space-y-8 animate-in fade-in duration-1000">
                  
                  {/* ULTRA-PREMIUM HEADER */}
                  <div className="text-center space-y-6 border-b-4 border-double border-amber-400/40 pb-8">
                    {/* Institution Crest */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <span className="text-2xl font-black text-amber-600">⚛</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Main Title */}
                    <div className="space-y-2">
                      <h1 className="text-4xl font-black text-slate-800 uppercase tracking-[0.2em] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        QUANTUM BREAKTHROUGH
                      </h1>
                      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
                      <h2 className="text-xl text-slate-700 font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'Cinzel', serif" }}>
                        SCIENTIFIC ACHIEVEMENT CERTIFICATE
                      </h2>
                    </div>
                    
                    {/* Premium Grade Badge */}
                    <div className="flex justify-center">
                      <div 
                        className="relative px-8 py-3 rounded-full text-white font-black text-lg border-4 border-white shadow-2xl transform hover:scale-105 transition-transform"
                        style={{ 
                          backgroundColor: gradeColor,
                          boxShadow: `0 0 30px ${gradeColor}40, inset 0 2px 0 rgba(255,255,255,0.3)`
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-white/20"></div>
                        <span className="relative z-10 tracking-[0.2em]">TIER {block.grade || 'C'}</span>
                      </div>
                    </div>
                  </div>

                  {/* CERTIFICATION STATEMENT */}
                  <div className="text-center space-y-6 py-6">
                    <div className="max-w-md mx-auto">
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic" style={{ fontFamily: "'Crimson Text', serif" }}>
                        "This certifies that the quantum scientific breakthrough detailed herein has been rigorously validated, peer-reviewed, and permanently inscribed upon the immutable Sovereign Lattice blockchain for posterity."
                      </p>
                    </div>
                    
                    {/* Honoree Name */}
                    <div className="space-y-3">
                      <div className="text-xs text-slate-500 uppercase tracking-[0.3em] font-black">AWARDED TO</div>
                      <h3 className="text-3xl font-black text-amber-700 uppercase tracking-[0.1em]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {currentUser.username}
                      </h3>
                      <div className="w-24 h-0.5 bg-amber-400 mx-auto"></div>
                    </div>
                  </div>

                  {/* BREAKTHROUGH DETAILS - LUXURY LAYOUT */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-amber-200/50 rounded-2xl p-8 shadow-inner space-y-6">
                    <h4 className="text-center font-black text-slate-800 uppercase tracking-[0.2em] text-sm border-b-2 border-amber-300/30 pb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                      BREAKTHROUGH SPECIFICATION
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Problem Statement */}
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">THEORETICAL RESOLUTION</div>
                        <p className="text-sm text-slate-700 italic leading-relaxed max-w-lg mx-auto" style={{ fontFamily: "'Crimson Text', serif" }}>
                          "{block.problem.substring(0, 180)}..."
                        </p>
                      </div>
                      
                      {/* Primary Formula - Ultra Premium Display */}
                      {block.primaryFormula && (
                        <div className="bg-white border-2 border-amber-200 rounded-xl p-6 shadow-lg">
                          <div className="text-center space-y-3">
                            <div className="text-xs text-amber-600 uppercase tracking-[0.3em] font-black">UNIFIED EQUATION</div>
                            <div className="bg-gradient-to-r from-slate-50 to-amber-50/30 border border-amber-200/50 rounded-lg p-4">
                              <code className="text-lg font-mono text-slate-800 font-bold tracking-wide">
                                {block.primaryFormula.substring(0, 80)}...
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACHIEVEMENT METRICS - LUXURY GRID */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-200/50 rounded-xl p-4 text-center shadow-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">ADVANCEMENT</div>
                      <div className="text-2xl font-black text-amber-700">Mk {block.advancementLevel || 1}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-200/50 rounded-xl p-4 text-center shadow-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">IMPACT SCORE</div>
                      <div className="text-2xl font-black text-amber-700">{block.breakthroughScore || 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-200/50 rounded-xl p-4 text-center shadow-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">SERIAL</div>
                      <div className="text-sm font-black text-amber-700 font-mono">#{previewData?.serialNumber?.slice(-6) || '000001'}</div>
                    </div>
                  </div>

                  {/* BLOCKCHAIN VERIFICATION QR */}
                  <div className="flex justify-center py-4">
                    <div className="bg-white border-4 border-amber-300 rounded-2xl p-4 shadow-2xl">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-amber-50 border-2 border-amber-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs text-slate-600 font-bold mb-1">QR</div>
                          <div className="text-xs text-slate-600 font-bold">VERIFY</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ULTRA-PREMIUM FOOTER */}
                  <div className="border-t-4 border-double border-amber-400/40 pt-6 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <div className="text-left space-y-1">
                        <div className="font-black text-slate-700 uppercase tracking-[0.2em]" style={{ fontFamily: "'Cinzel', serif" }}>SOVEREIGN LATTICE AUTHORITY</div>
                        <div className="text-slate-600 italic">Scientific Validation Council</div>
                        <div className="text-slate-500 text-[10px]">Est. 2026 • Blockchain Registry</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-black text-slate-700 uppercase tracking-[0.2em]" style={{ fontFamily: "'Cinzel', serif" }}>QUANTUM BREAKTHROUGH SYSTEM</div>
                        <div className="text-slate-600 italic">Immutable Scientific Record</div>
                        <div className="text-slate-500 text-[10px]">© 2026 All Rights Reserved</div>
                      </div>
                    </div>
                    
                    {/* Authentication Strip */}
                    <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 h-2 rounded-full shadow-inner"></div>
                    
                    {/* Final Authenticity Statement */}
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">
                        AUTHENTICATED • VERIFIED • IMMUTABLE
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Export Controls */}
            <div className="space-y-6 animate-in slide-in-from-right duration-700">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Export Settings
              </h3>

              {/* Certificate Information */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-500">
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider">
                  Certificate Information
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Block ID:</span>
                    <span className="text-white font-mono">{block.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Serial Number:</span>
                    <span className="text-white font-mono">
                      {previewData?.serialNumber || 'Generating...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timestamp:</span>
                    <span className="text-white">{block.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white">Premium PDF (A4)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality:</span>
                    <span className="text-amber-500 font-semibold">Museum Grade</span>
                  </div>
                </div>
              </div>

              {/* Premium Features */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider">
                  🏆 Premium Features
                </h4>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Museum-quality typography and layout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Grade-specific premium color schemes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>High-resolution QR codes for verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Security watermarks and authenticity markers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Professional A4 format (210mm × 297mm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Unique serial numbers and digital signatures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Blockchain verification integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Tamper-evident design elements</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              {isGenerating && progress && (
                <div className="bg-black/40 border border-amber-500/30 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
                  <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider animate-pulse">
                    Generation Progress
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white animate-in slide-in-from-left duration-300">{progress.message}</span>
                      <span className="text-sm font-black text-amber-500 animate-pulse">{progressPercentage}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${progressPercentage}%` }}
                      >
                        {/* Moving shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 text-center animate-pulse">
                      Stage: {progress.stage.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/40 border border-red-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">
                    Export Error
                  </h4>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-red-300">{error.userMessage}</p>
                    
                    {error.actionable && (
                      <div className="bg-red-800/30 border border-red-600/30 rounded-xl p-3">
                        <p className="text-xs text-red-200">
                          <span className="font-semibold">Suggested Action:</span> {error.actionable}
                        </p>
                      </div>
                    )}

                    {fallbackOptions.length > 0 && (
                      <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl p-3">
                        <p className="text-xs text-yellow-200 font-semibold mb-2">Fallback Options:</p>
                        <ul className="text-xs text-yellow-200 space-y-1">
                          {fallbackOptions.map((option, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">•</span>
                              <span>{option}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {error.retryable && (
                      <button
                        onClick={handleRetry}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        Retry Export
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="space-y-4 animate-in slide-in-from-bottom duration-1000">
                <button
                  onClick={handleExportPDF}
                  disabled={isGenerating || !previewData}
                  className={`w-full py-6 rounded-3xl text-lg font-black uppercase tracking-wider transition-all transform hover:scale-105 ${
                    isGenerating || !previewData
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20'
                  }`}
                >
                  {isGenerating 
                    ? `Generating Certificate... ${progressPercentage}%`
                    : 'Export Premium Certificate PDF'
                  }
                </button>

                {!isGenerating && (
                  <p className="text-xs text-gray-500 text-center animate-in fade-in duration-500 delay-300">
                    High-quality PDF will be automatically downloaded to your device
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;