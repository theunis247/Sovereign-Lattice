import React, { useState } from 'react';
import { SolvedBlock, User } from '../types';
import { PremiumPDFGenerator, createCertificateData } from '../services/pdfGenerator';

/**
 * Test component to demonstrate consistent certificate template with grade-specific colors
 */
const ConsistentTemplateTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<'S' | 'A' | 'B' | 'C'>('S');

  // Test user
  const testUser: User = {
    profileId: 'template-test-user',
    username: 'Dr. Template Tester',
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

  // Create test breakthrough with selected grade
  const createTestBreakthrough = (grade: 'S' | 'A' | 'B' | 'C'): SolvedBlock => ({
    id: `BLOCK-TEMPLATE-TEST-${grade}`,
    shardId: 'SHD-12345',
    shardIndex: 1,
    shardParentId: 'SHD-MAIN',
    tokenParentId: 'QBS-ALPHA',
    totalShardsPerToken: 1000,
    timestamp: new Date().toLocaleString(),
    problem: `Grade ${grade} breakthrough: Advanced quantum mechanics research with ${grade === 'S' ? 'revolutionary' : grade === 'A' ? 'significant' : grade === 'B' ? 'notable' : 'standard'} implications for modern physics.`,
    answer: `SIG_TEMPLATE_TEST_${grade}`,
    explanation: `This ${grade}-grade breakthrough demonstrates the consistent certificate template design with grade-specific color coding around the Lattice logo.`,
    reward: grade === 'S' ? 0.005 : grade === 'A' ? 0.001 : 0,
    payoutPerShard: grade === 'S' ? '1000 QRK' : grade === 'A' ? '500 QRK' : grade === 'B' ? '200 QRK' : '100 QRK',
    difficulty: 'PEER_REVIEW_STRICT',
    hash: `0000${grade}${Math.random().toString(16).slice(2, 60)}`,
    parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
    integrityHash: `SHA256-TEMPLATE-${grade}`,
    isPeerReviewed: true,
    advancementLevel: grade === 'S' ? 5 : grade === 'A' ? 3 : grade === 'B' ? 2 : 1,
    advancementHistory: [],
    grade,
    breakthroughScore: grade === 'S' ? 98 : grade === 'A' ? 87 : grade === 'B' ? 75 : 65,
    consensusCritique: `${grade}-grade evaluation with appropriate recognition for the scientific contribution.`,
    primaryFormula: `${grade}_Formula = Ψ(x,t) × Grade_Factor_${grade}`,
    observedConstants: {
      'Grade_Factor': grade,
      'Template_Consistency': '100%',
      'Color_Coding': 'Active'
    },
    neuralInterpretation: `The ${grade}-grade breakthrough showcases consistent template design with appropriate color coding.`
  });

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const testBreakthrough = createTestBreakthrough(selectedGrade);
      const certificateData = createCertificateData(testBreakthrough, testUser);
      
      const blob = await PremiumPDFGenerator.generateCertificate(
        certificateData,
        (progressUpdate) => {
          setProgress(progressUpdate.progress);
        }
      );

      // Download the template test certificate
      PremiumPDFGenerator.downloadPDF(blob, testBreakthrough, testUser);
      
    } catch (error) {
      console.error('Template test certificate generation failed:', error);
      alert('Test failed: ' + error.message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const gradeColors = {
    'S': '#C5A059', // Gold
    'A': '#3b82f6', // Blue
    'B': '#22c55e', // Green
    'C': '#6b7280'  // Gray
  };

  const gradeDescriptions = {
    'S': 'Revolutionary breakthrough with gold accents',
    'A': 'Significant advancement with blue accents',
    'B': 'Notable contribution with green accents',
    'C': 'Standard achievement with gray accents'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
            📋 Consistent Template Test
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Test the consistent certificate template design with grade-specific color coding 
            around the Lattice logo. Only the colors change - everything else stays the same.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-black text-amber-500 uppercase tracking-wider mb-6">
            🎨 Template Consistency Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-green-500 font-black mb-3">✅ Consistent Elements</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Same layout and structure for all grades</li>
                <li>• Consistent typography and spacing</li>
                <li>• Identical content organization</li>
                <li>• Same Lattice logo design</li>
                <li>• Uniform certificate format</li>
              </ul>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-blue-500 font-black mb-3">🎯 Grade-Specific Changes</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Logo hexagon color matches grade</li>
                <li>• QR code colors match grade</li>
                <li>• Grade badge uses appropriate color</li>
                <li>• All other elements remain identical</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6">
            🎨 Grade Color System
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(['S', 'A', 'B', 'C'] as const).map((grade) => (
              <div 
                key={grade}
                className={`bg-black/40 border rounded-2xl p-4 cursor-pointer transition-all ${
                  selectedGrade === grade 
                    ? 'border-white/30 bg-white/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedGrade(grade)}
              >
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-black"
                    style={{ backgroundColor: gradeColors[grade] }}
                  >
                    {grade}
                  </div>
                  <div className="text-white font-black text-sm">Grade {grade}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {gradeDescriptions[grade]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
              <h3 className="text-white font-black mb-2">Selected Grade: {selectedGrade}</h3>
              <div 
                className="inline-block px-4 py-2 rounded-full text-white font-black"
                style={{ backgroundColor: gradeColors[selectedGrade] }}
              >
                {gradeDescriptions[selectedGrade]}
              </div>
            </div>

            <button
              onClick={handleGenerateTemplate}
              disabled={isGenerating}
              className={`px-8 py-4 rounded-3xl text-lg font-black uppercase tracking-wider transition-all ${
                isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-xl hover:shadow-2xl'
              }`}
            >
              {isGenerating 
                ? `Generating Grade ${selectedGrade} Certificate... ${progress}%`
                : `📋 Generate Grade ${selectedGrade} Template Certificate`
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
              The generated certificate will use the consistent template design with 
              grade-specific colors around the Lattice logo and QR code.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-green-500/30 rounded-3xl p-6">
          <h3 className="text-green-500 font-black mb-4">✅ Template Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">Consistent Elements:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Header: "LATTICE SOVEREIGN AUTHORITY"</li>
                <li>• Title: "RESOLUTION CERTIFICATE"</li>
                <li>• Same layout and typography</li>
                <li>• Identical content structure</li>
              </ul>
            </div>
            <div>
              <strong className="text-white">Grade-Specific Elements:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Logo hexagon color</li>
                <li>• Grade badge color</li>
                <li>• QR code color scheme</li>
                <li>• All match the grade system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsistentTemplateTest;