import React, { useState } from 'react';
import { SolvedBlock, User } from '../types';
import { PremiumPDFGenerator, createCertificateData } from '../services/pdfGenerator';

/**
 * Test component to verify complete serial numbers and digital signatures
 */
const SecurityVerificationTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certificateData, setCertificateData] = useState<any>(null);

  // Test user
  const testUser: User = {
    profileId: 'security-test-user',
    username: 'Dr. Security Tester',
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

  // Test breakthrough
  const testBreakthrough: SolvedBlock = {
    id: 'BLOCK-SECURITY-VERIFICATION-TEST-12345',
    shardId: 'SHD-99999',
    shardIndex: 1,
    shardParentId: 'SHD-MAIN',
    tokenParentId: 'QBS-ALPHA',
    totalShardsPerToken: 1000,
    timestamp: new Date().toLocaleString(),
    problem: 'Security verification test for complete serial numbers and digital signatures in premium NFT certificates.',
    answer: 'SIG_SECURITY_VERIFICATION_TEST',
    explanation: 'This test verifies that all security elements including serial numbers and digital signatures are displayed completely without truncation.',
    reward: 0.005,
    payoutPerShard: '1000 QRK',
    difficulty: 'PEER_REVIEW_STRICT',
    hash: '0000ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456',
    parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
    integrityHash: 'SHA256-SECURITY-TEST-789',
    isPeerReviewed: true,
    advancementLevel: 3,
    advancementHistory: [],
    grade: 'A',
    breakthroughScore: 95,
    consensusCritique: 'Excellent security implementation with complete verification elements.',
    primaryFormula: 'Security(x) = Σ(serial_complete + signature_complete + verification_complete)',
    observedConstants: {
      'Security_Level': 'Maximum',
      'Verification_Status': 'Complete',
      'Authenticity_Score': '100%'
    },
    neuralInterpretation: 'All security elements are properly displayed and verifiable.'
  };

  const handleGenerateSecurityTest = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const certData = createCertificateData(testBreakthrough, testUser);
      setCertificateData(certData);
      
      const blob = await PremiumPDFGenerator.generateCertificate(
        certData,
        (progressUpdate) => {
          setProgress(progressUpdate.progress);
        }
      );

      // Download the security test certificate
      PremiumPDFGenerator.downloadPDF(blob, testBreakthrough, testUser);
      
    } catch (error) {
      console.error('Security test certificate generation failed:', error);
      alert('Security test failed: ' + error.message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleGenerateNewData = () => {
    const newCertData = createCertificateData(testBreakthrough, testUser);
    setCertificateData(newCertData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
            🔐 Security Verification Test
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Verify that all serial numbers and digital signatures are displayed completely 
            without truncation in the premium NFT certificates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Security Information */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-red-500/30 rounded-3xl p-6">
              <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider mb-4">
                🚨 Critical Security Elements
              </h2>
              
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-amber-500 font-black mb-2">Serial Number Requirements</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Must be displayed completely (no truncation)</li>
                    <li>• Format: QBS-CERT-[timestamp]-[id]-[grade][level]</li>
                    <li>• Essential for certificate authenticity</li>
                    <li>• Used for blockchain verification</li>
                  </ul>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-blue-500 font-black mb-2">Digital Signature Requirements</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Must be displayed completely (no truncation)</li>
                    <li>• Contains user hash, block hash, grade hash</li>
                    <li>• Critical for forensic verification</li>
                    <li>• Includes timestamp and random elements</li>
                  </ul>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-green-500 font-black mb-2">Verification URL</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Complete URL displayed with wrapping</li>
                    <li>• Links to blockchain verification</li>
                    <li>• QR code contains same verification data</li>
                    <li>• Essential for authenticity checking</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-green-500/30 rounded-3xl p-6">
              <h2 className="text-2xl font-black text-green-400 uppercase tracking-wider mb-4">
                ✅ Security Enhancements
              </h2>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Enhanced serial number format with grade and level</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Multi-component digital signatures</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Complete display without truncation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Intelligent text wrapping for long elements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Multiple invisible security markers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Comprehensive PDF metadata</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Data and Controls */}
          <div className="space-y-6">
            
            {/* Certificate Data Preview */}
            {certificateData && (
              <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-6">
                <h2 className="text-xl font-black text-amber-500 uppercase tracking-wider mb-4">
                  📋 Generated Certificate Data
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-black mb-2">Serial Number:</h3>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-green-500/20">
                      <code className="text-green-400 text-xs font-mono break-all">
                        {certificateData.serialNumber}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Length: {certificateData.serialNumber.length} characters
                    </p>
                  </div>
                  
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-black mb-2">Digital Signature:</h3>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-blue-500/20 max-h-32 overflow-y-auto">
                      <code className="text-blue-400 text-xs font-mono break-all">
                        {certificateData.authenticity.signature}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Length: {certificateData.authenticity.signature.length} characters
                    </p>
                  </div>
                  
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-black mb-2">Verification URL:</h3>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-purple-500/20">
                      <code className="text-purple-400 text-xs font-mono break-all">
                        {certificateData.authenticity.verificationUrl}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">
                🎮 Test Controls
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleGenerateNewData}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  🔄 Generate New Security Data
                </button>
                
                <button
                  onClick={handleGenerateSecurityTest}
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-3xl text-lg font-black uppercase tracking-wider transition-all ${
                    isGenerating
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-xl hover:shadow-2xl'
                  }`}
                >
                  {isGenerating 
                    ? `Generating Security Test... ${progress}%`
                    : '🔐 Generate Security Verification Certificate'
                  }
                </button>

                {isGenerating && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4">
                  <h3 className="text-yellow-400 font-black mb-2">⚠️ Verification Checklist</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>1. Download the generated PDF certificate</div>
                    <div>2. Verify serial number is displayed completely</div>
                    <div>3. Verify digital signature is displayed completely</div>
                    <div>4. Check that verification URL is complete</div>
                    <div>5. Ensure all text is properly wrapped, not truncated</div>
                    <div>6. Confirm QR code is scannable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityVerificationTest;