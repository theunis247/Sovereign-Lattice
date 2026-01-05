import React, { useState } from 'react';
import { SolvedBlock, User } from '../types';
import { PremiumPDFGenerator, createCertificateData } from '../services/pdfGenerator';

/**
 * Test component to verify PDF spacing and layout optimization
 */
const PDFSpacingTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Test user
  const testUser: User = {
    profileId: 'test-user',
    username: 'Dr. Extremely Long Scientific Name That Tests Spacing',
    address: '0x1234567890abcdef',
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    passwordHash: 'test-hash',
    salt: 'test-salt',
    securityCode: 'test-security',
    role: 'user',
    balance: 1000,
    usdBalance: 5000,
    xp: 10000,
    level: 5,
    reputationScore: 2500,
    governanceRank: 'Master Observer',
    contacts: [],
    transactions: [],
    solvedBlocks: [],
    votes: {},
    incidents: [],
    ownedNfts: [],
    shardsTowardNextQBS: 0,
    messagingActive: true,
    miningActive: true,
    autoSignOutMinutes: 30,
    messagingExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    miningExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Test breakthrough with very long content to test spacing
  const testBreakthrough: SolvedBlock = {
    id: 'BLOCK-SPACING-TEST-WITH-VERY-LONG-ID-TO-TEST-TRUNCATION',
    shardId: 'SHD-99999',
    shardIndex: 1,
    shardParentId: 'SHD-MAIN',
    tokenParentId: 'QBS-ALPHA',
    totalShardsPerToken: 1000,
    timestamp: new Date().toLocaleString(),
    problem: 'This is an extremely long breakthrough description that tests the text wrapping and spacing optimization in the PDF certificate generator. It includes multiple sentences with complex scientific terminology, mathematical concepts, and detailed explanations that would normally cause spacing issues in a poorly designed layout. The purpose is to ensure that even with very long content, the certificate maintains its professional appearance and all elements fit properly within the A4 page dimensions without overlapping or being cut off.',
    answer: 'SIG_SPACING_TEST',
    explanation: 'This breakthrough demonstrates advanced text layout optimization techniques for PDF generation, ensuring that all content fits properly within the designated areas while maintaining readability and professional appearance. The solution includes dynamic text truncation, intelligent line wrapping, and responsive spacing calculations.',
    reward: 0.005,
    payoutPerShard: '1000 QRK',
    difficulty: 'PEER_REVIEW_STRICT',
    hash: '0000a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
    parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
    integrityHash: 'SHA256-SPACING-TEST-123456',
    isPeerReviewed: true,
    advancementLevel: 5,
    advancementHistory: [],
    grade: 'S',
    breakthroughScore: 98,
    consensusCritique: 'Exceptional work on PDF layout optimization with comprehensive testing of edge cases and extreme content lengths.',
    primaryFormula: 'Ψ(x,t) = ∫ G_μν(x) |ψ⟩⟨ψ| d⁴x × exp(iS[g,ψ]/ℏ) × Σ(spacing_optimization_factors) × Π(layout_constraints)',
    observedConstants: {
      'Planck_Length': '1.616 × 10⁻³⁵ m',
      'Speed_of_Light': '2.998 × 10⁸ m/s',
      'Layout_Optimization_Factor': '0.95',
      'Text_Wrapping_Efficiency': '98.7%'
    },
    neuralInterpretation: 'The optimized layout ensures perfect spacing and professional appearance regardless of content length.'
  };

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const certificateData = createCertificateData(testBreakthrough, testUser);
      
      const blob = await PremiumPDFGenerator.generateCertificate(
        certificateData,
        (progressUpdate) => {
          setProgress(progressUpdate.progress);
        }
      );

      // Download the test certificate
      PremiumPDFGenerator.downloadPDF(blob, testBreakthrough, testUser);
      
    } catch (error) {
      console.error('Test certificate generation failed:', error);
      alert('Test failed: ' + error.message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
            📏 PDF Spacing Test
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Test the optimized PDF layout with extreme content lengths to verify proper spacing, 
            text wrapping, and that everything fits within A4 dimensions.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-black text-amber-500 uppercase tracking-wider mb-6">
            🧪 Spacing Optimization Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-green-500 font-black mb-3">✅ Optimized Layout</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Reduced margins (15mm vs 20mm)</li>
                <li>• Compact header and footer</li>
                <li>• Smaller QR code (20mm vs 25mm)</li>
                <li>• Optimized font sizes</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-blue-500 font-black mb-3">📝 Smart Text Handling</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Intelligent text truncation</li>
                <li>• Line limit enforcement</li>
                <li>• Dynamic content sizing</li>
                <li>• Responsive spacing</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-purple-500 font-black mb-3">🎯 Content Limits</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Problem: 200 chars, 3 lines max</li>
                <li>• Formula: 120 chars, 2 lines max</li>
                <li>• Username: 25 chars max</li>
                <li>• IDs: Smart truncation</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-orange-500 font-black mb-3">📐 Spacing Constants</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Line spacing: 6mm</li>
                <li>• Section spacing: 12mm</li>
                <li>• Paragraph spacing: 8mm</li>
                <li>• Dynamic Y positioning</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-red-400 font-black mb-3">⚠️ Test Content</h3>
            <p className="text-sm text-gray-300 mb-3">
              This test uses extreme content lengths to verify the layout optimization:
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Username: 50+ characters</li>
              <li>• Problem description: 500+ characters</li>
              <li>• Formula: 150+ characters</li>
              <li>• Block ID: 50+ characters</li>
              <li>• All fields designed to test truncation and wrapping</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={handleGenerateTest}
              disabled={isGenerating}
              className={`px-8 py-4 rounded-3xl text-lg font-black uppercase tracking-wider transition-all ${
                isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-xl hover:shadow-2xl'
              }`}
            >
              {isGenerating 
                ? `Generating Test Certificate... ${progress}%`
                : '🧪 Generate Spacing Test Certificate'
              }
            </button>

            {isGenerating && (
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              The generated PDF will test all spacing optimizations and content limits.
              <br />
              Verify that all content fits properly within the A4 page without overlapping.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-green-500/30 rounded-3xl p-6">
          <h3 className="text-green-500 font-black mb-4">✅ Expected Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">Layout:</strong>
              <ul className="mt-2 space-y-1">
                <li>• All content fits within A4 (210×297mm)</li>
                <li>• No overlapping elements</li>
                <li>• Proper margins maintained</li>
                <li>• Professional appearance preserved</li>
              </ul>
            </div>
            <div>
              <strong className="text-white">Content:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Long text properly truncated</li>
                <li>• Line limits enforced</li>
                <li>• All sections visible</li>
                <li>• QR code properly positioned</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSpacingTest;