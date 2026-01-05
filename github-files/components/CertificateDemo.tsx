import React from 'react';
import { SolvedBlock, User } from '../types';
import BlocksArchive from './BlocksArchive';

/**
 * Demo component to showcase the premium certificate functionality
 */
const CertificateDemo: React.FC = () => {
  // Sample user data
  const demoUser: User = {
    profileId: 'demo-user',
    username: 'Dr. Quantum Researcher',
    address: '0x1234567890abcdef',
    publicKey: 'demo-public-key',
    privateKey: 'demo-private-key',
    passwordHash: 'demo-hash',
    salt: 'demo-salt',
    securityCode: 'demo-security',
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

  // Sample breakthrough data showcasing different grades
  const demoBreakthroughs: SolvedBlock[] = [
    {
      id: 'BLOCK-S-GRADE-DEMO',
      shardId: 'SHD-99999',
      shardIndex: 1,
      shardParentId: 'SHD-MAIN',
      tokenParentId: 'QBS-ALPHA',
      totalShardsPerToken: 1000,
      timestamp: new Date().toLocaleString(),
      problem: 'Unified Theory of Quantum Gravity: Resolving the fundamental incompatibility between General Relativity and Quantum Mechanics through novel mathematical frameworks',
      answer: 'SIG_QUANTUM_GRAVITY_UNIFIED',
      explanation: 'This breakthrough presents a revolutionary mathematical framework that unifies quantum mechanics and general relativity through a novel approach to spacetime quantization. The solution introduces a new class of operators that preserve both quantum coherence and gravitational field equations, potentially solving the black hole information paradox.',
      reward: 0.005,
      payoutPerShard: '1000 QRK',
      difficulty: 'PEER_REVIEW_STRICT',
      hash: '0000a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
      parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      integrityHash: 'SHA256-DEMO123456',
      isPeerReviewed: true,
      advancementLevel: 5,
      advancementHistory: [],
      grade: 'S',
      breakthroughScore: 98,
      consensusCritique: 'Extraordinary theoretical work with profound implications for fundamental physics. The mathematical rigor is exceptional and the proposed experimental validations are feasible.',
      primaryFormula: 'Ψ(x,t) = ∫ G_μν(x) |ψ⟩⟨ψ| d⁴x × exp(iS[g,ψ]/ℏ)',
      observedConstants: {
        'Planck_Length': '1.616 × 10⁻³⁵ m',
        'Speed_of_Light': '2.998 × 10⁸ m/s',
        'Gravitational_Constant': '6.674 × 10⁻¹¹ m³/kg⋅s²',
        'Reduced_Planck_Constant': '1.055 × 10⁻³⁴ J⋅s'
      },
      neuralInterpretation: 'The unified field equations suggest that spacetime itself exhibits quantum properties at the Planck scale, with gravitational waves carrying quantum information.'
    },
    {
      id: 'BLOCK-A-GRADE-DEMO',
      shardId: 'SHD-88888',
      shardIndex: 2,
      shardParentId: 'SHD-MAIN',
      tokenParentId: 'QBS-ALPHA',
      totalShardsPerToken: 1000,
      timestamp: new Date().toLocaleString(),
      problem: 'Room Temperature Superconductivity: Developing materials that exhibit zero electrical resistance at ambient conditions',
      answer: 'SIG_ROOM_TEMP_SUPERCONDUCTOR',
      explanation: 'Discovery of a novel copper-based perovskite structure with hydrogen intercalation that maintains superconducting properties up to 295K. The material exhibits perfect diamagnetism and zero resistance through a unique electron-phonon coupling mechanism.',
      reward: 0.001,
      payoutPerShard: '500 QRK',
      difficulty: 'PEER_REVIEW_STRICT',
      hash: '0000b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234',
      parentHash: '0000a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
      integrityHash: 'SHA256-DEMO234567',
      isPeerReviewed: true,
      advancementLevel: 3,
      advancementHistory: [],
      grade: 'A',
      breakthroughScore: 87,
      consensusCritique: 'Significant advancement in materials science with clear practical applications. The synthesis method is reproducible and the theoretical model is well-supported.',
      primaryFormula: 'Tc = (ℏωD/kB) × exp(-1/N(0)V)',
      observedConstants: {
        'Critical_Temperature': '295 K',
        'Debye_Frequency': '4.2 × 10¹³ Hz',
        'Coupling_Constant': '0.85',
        'Coherence_Length': '150 nm'
      },
      neuralInterpretation: 'The hydrogen intercalation creates optimal electron-phonon coupling conditions that persist at room temperature through lattice stabilization.'
    },
    {
      id: 'BLOCK-B-GRADE-DEMO',
      shardId: 'SHD-77777',
      shardIndex: 3,
      shardParentId: 'SHD-MAIN',
      tokenParentId: 'QBS-ALPHA',
      totalShardsPerToken: 1000,
      timestamp: new Date().toLocaleString(),
      problem: 'Efficient Carbon Capture: Developing cost-effective methods for atmospheric CO2 removal and conversion',
      answer: 'SIG_CARBON_CAPTURE_CATALYST',
      explanation: 'Novel metal-organic framework (MOF) catalyst that selectively captures CO2 from ambient air and converts it to useful hydrocarbons using solar energy. The process achieves 85% efficiency with minimal energy input.',
      reward: 0,
      payoutPerShard: '100 QRK',
      difficulty: 'PEER_REVIEW_STRICT',
      hash: '0000c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      parentHash: '0000b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234',
      integrityHash: 'SHA256-DEMO345678',
      isPeerReviewed: true,
      advancementLevel: 2,
      advancementHistory: [],
      grade: 'B',
      breakthroughScore: 72,
      consensusCritique: 'Solid engineering solution with good practical potential. The efficiency metrics are impressive and the environmental impact is significant.',
      primaryFormula: 'CO2 + 2H2O + hν → CH3OH + 3/2 O2',
      observedConstants: {
        'Conversion_Efficiency': '85%',
        'Solar_Energy_Required': '2.1 eV/molecule',
        'Capture_Rate': '1.2 kg CO2/m²/day',
        'Selectivity': '94%'
      },
      neuralInterpretation: 'The MOF structure provides optimal binding sites for CO2 while facilitating photocatalytic conversion through embedded semiconductor nanoparticles.'
    }
  ];

  // Update demo user with the breakthrough blocks
  const userWithBreakthroughs: User = {
    ...demoUser,
    solvedBlocks: demoBreakthroughs
  };

  const handleEvolution = (blockId: string) => {
    console.log('Evolution requested for block:', blockId);
    // In a real app, this would trigger the evolution process
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
            🏆 Premium Certificate Demo
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Experience billion-dollar quality NFT certificates. Click on any discovery to view detailed information, 
            then use the "Export" button to generate and download a museum-quality PDF certificate.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-black text-amber-500 uppercase tracking-wider mb-4">
            ✨ Premium Features Showcase
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="text-green-500 font-black mb-2">🔍 Clickable Details</div>
              <div className="text-gray-300">Click "Inspect Equations" to view comprehensive breakthrough information</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="text-amber-500 font-black mb-2">📜 Premium Certificates</div>
              <div className="text-gray-300">Export museum-quality PDF certificates with security features</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="text-blue-500 font-black mb-2">🏅 Grade-Specific Design</div>
              <div className="text-gray-300">Each grade (S, A, B, C) has unique premium styling and colors</div>
            </div>
          </div>
        </div>

        <BlocksArchive
          blocks={demoBreakthroughs}
          onGenerateDossier={handleEvolution}
          isGeneratingDossier={false}
          currentUser={userWithBreakthroughs}
          isEvolvingBreakthrough={{}}
          evolutionProgress={{}}
        />
      </div>
    </div>
  );
};

export default CertificateDemo;