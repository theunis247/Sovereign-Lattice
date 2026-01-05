import React, { useState } from 'react';
import { SolvedBlock, User } from '../types';
import { PremiumPDFGenerator, createCertificateData } from '../services/pdfGenerator';

/**
 * Test component to verify PDF text fixes
 */
const PDFTextFixTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Test user with proper name
  const testUser: User = {
    profileId: 'text-fix-test-user',
    username: 'Dr. Quantum Researcher',
    address: '0x0000000000000000000000000000000000000000',
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

  // Test breakthrough with proper data
  const testBreakthrough: SolvedBlock = {
    id: 'BLOCK-TEXT-FIX-TEST',
    shardId: 'SHD-12345',
    shardIndex: 1,
    shardParentId: 'SHD-MAIN',
    tokenParentId: 'QBS-ALPHA',
    totalShardsPerToken: 1000,
    timestamp: new Date().toLocaleString(),
    problem: 'Advanced quantum entanglement protocols for secure communication networks with enhanced cryptographic verification.',
    answer: 'SIG_TEXT_FIX_VERIFICATION',
    explanation: 'This breakthrough demonstrates proper text formatting and display in premium NFT certificates without text rendering issues.',
    reward: 0.001,
    payoutPerShard: '500 QRK',
    difficulty: 'PEER_REVIEW_STRICT',
    hash: '0000FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA098765',
    parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
    integrityHash: 'SHA256-TEXT-FIX-TEST',
    isPeerReviewed: true,
    advancementLevel: 2,
    advancementHistory: [],
    grade: 'B',
    breakthroughScore: 78,
    consensusCritique: 'Solid implementation with proper text formatting and display optimization.',
    primaryFormula: 'E = mc² × Ψ(quantum_entanglement) + Σ(cryptographic_strength)',
    observedConstants: {
      'Speed_of_Light': '2.998 × 10⁸ m/s',
      'Planck_Constant': '6.626 × 10⁻³⁴ J⋅s',
      'Entanglement_Efficiency': '94.7%'
    },
    neuralInterpretation: 'The quantum protocols ensure secure communication with minimal decoherence.'
  };

  const handleGenerateFixedTest = async () => {
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

      // Download the fixed certificate
      PremiumPDFGenerator.downloadPDF(blob, testBreakthrough, testUser);
      
    } catch (error) {
      console.error('Fixed certificate generation failed:', error);
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
            🔧 PDF Text Fix Verification
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Test the fixed PDF generation to ensure proper text formatting, 
            minimal watermarks, and invisible security markers.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-green-500/30 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-black text-green-400 uppercase tracking-wider mb-6">
            ✅ Text Fixes Applied
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-green-500 font-black mb-3">🎨 Watermark Fixes</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Reduced watermark density (80mm spacing vs 40mm)</li>
                <li>• Lighter color (250,250,250 vs 240,240,240)</li>
                <li>• Smaller font size (6pt vs 8pt)</li>
                <li>• Fewer watermarks overall</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-blue-500 font-black mb-3">🔒 Security Marker Fixes</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Truly invisible (0.1pt font size)</li>
                <li>• Positioned in corners (0.1mm coordinates)</li>
                <li>• Shortened content to prevent visibility</li>
                <li>• White on white background</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-purple-500 font-black mb-3">📝 Text Formatting Fixes</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Proper username display (no hardcoded names)</li>
                <li>• Truncated timestamps for better fit</li>
                <li>• Formula validation (skip invalid formulas)</li>
                <li>• Improved text wrapping</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-orange-500 font-black mb-3">🎯 Layout Improvements</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Better spacing calculations</li>
                <li>• Proper content positioning</li>
                <li>• No overlapping elements</li>
                <li>• Clean professional appearance</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-black text-amber-500 uppercase tracking-wider mb-6">
            🧪 Test Data
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <h3 className="text-white font-black mb-2">User Information:</h3>
              <div className="text-gray-300 space-y-1">
                <div><strong>Username:</strong> {testUser.username}</div>
                <div><strong>Address:</strong> {testUser.address.substring(0, 20)}...</div>
                <div><strong>Level:</strong> {testUser.level}</div>
              </div>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <h3 className="text-white font-black mb-2">Breakthrough Info:</h3>
              <div className="text-gray-300 space-y-1">
                <div><strong>Grade:</strong> {testBreakthrough.grade}</div>
                <div><strong>Level:</strong> Mk {testBreakthrough.advancementLevel}</div>
                <div><strong>Score:</strong> {testBreakthrough.breakthroughScore}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleGenerateFixedTest}
            disabled={isGenerating}
            className={`px-8 py-4 rounded-3xl text-lg font-black uppercase tracking-wider transition-all ${
              isGenerating
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 shadow-xl hover:shadow-2xl'
            }`}
          >
            {isGenerating 
              ? `Generating Fixed Certificate... ${progress}%`
              : '🔧 Generate Fixed Certificate PDF'
            }
          </button>

          {isGenerating && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-blue-400 font-black mb-3">📋 Verification Checklist</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>Watermarks are subtle and barely visible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>No visible security text at the end</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>Username displays correctly (no hardcoded names)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>All text is properly formatted and spaced</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>Serial number and signature are complete</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">□</span>
                <span>Professional appearance maintained</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTextFixTest;