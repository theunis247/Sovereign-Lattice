
import { SovereignGrade } from '../types';

export const QBS_UNITS = {
  QBS: 1,
  SHD: 1000,               
  QRK: 1000000000,         
  QRK_PER_SHD: 1000000,    
  USD_PER_QRK: 1,          
  TOTAL_MAX_QBS: 10000,    
  TOTAL_MAX_QRK: 10000000000000 
};

// Adjusted to provide less magnitude but higher Quark yields
export const GRADE_MULTIPLIERS: Record<SovereignGrade, number> = {
  'S': 10.0, // 10x Quarks + Rare QBS
  'A': 5.0,  // 5x Quarks
  'B': 2.0,  // 2x Quarks
  'C': 1.0   // 1x Quarks (Base)
};

export const GRADE_COLORS: Record<SovereignGrade, string> = {
  'S': '#C5A059', // Gold
  'A': '#3b82f6', // Blue
  'B': '#22c55e', // Green
  'C': '#6b7280'  // Gray
};

export const getMasterBreakthrough = (tokenId: number): string => {
  const breakthroughs = [
    "Quantum Gravity Reconciliation",
    "Neural Correlates of Consciousness",
    "Riemann Zeta Non-Trivial Zeroes",
    "Navier-Stokes Global Smoothness",
    "Dark Matter Axion Detection",
    "Baryogenesis Symmetry Violation",
    "P vs NP Mathematical Bound",
    "Fermi Paradox Great Filter Analysis",
    "Room-Temperature Superconductivity",
    "Stellar Fusion Ignition Stability",
    "Holographic Universe Mapping",
    "Grand Unified Force Coupling",
    "Vacuum Decay Threshold Limits",
    "Emergent Spacetime Quantization",
    "Quantum Chromodynamics Lattice Parity",
    "Artificial General Intelligence Alignment",
    "Biological Aging Reversal Pathways",
    "Exoplanet Biosignature Identification",
    "Multiverse Brane Interaction",
    "Infinite Energy Flux Harvesting"
  ];
  return breakthroughs[(tokenId - 1) % breakthroughs.length];
};

export const getShardScientificFocus = (tokenId: number, shardId: number): string => {
  const master = getMasterBreakthrough(tokenId);
  const focuses = [
    "Entropy Calibration",
    "Wavefunction Collapse Analysis",
    "Lattice Symmetry Verification",
    "Non-Linear Dynamics Modeling",
    "Sub-Atomic Field Mapping",
    "Neural Path Optimization",
    "Topological Defect Discovery",
    "Probability Distribution Hardening",
    "Recursive Proof Validation",
    "Interdimensional Signal Filtering"
  ];
  const focus = focuses[(shardId - 1) % focuses.length];
  return `${master} :: [Frontier: ${focus}]`;
};

export const getCosmicDomain = (tokenId: number): string => {
  const domains = [
    "Theoretical Physics",
    "Cognitive Neuroscience",
    "Analytical Mathematics",
    "Aerodynamics",
    "High-Energy Physics",
    "Quantum Cosmology",
    "Algorithmic Theory",
    "Exobiological Science",
    "Condensed Matter Physics",
    "Thermonuclear Dynamics"
  ];
  return domains[(tokenId - 1) % domains.length];
};

export const formatCurrency = (qbsAmount: number): string => {
  const usd = qbsAmount * QBS_UNITS.QRK * QBS_UNITS.USD_PER_QRK;
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(3)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  return `$${usd.toLocaleString()}`;
};

export const generatePhotons = (time: number, frequency: number, isEavesdropping: boolean, noiseFactor: number = 0.05) => {
  const aliceBase = Math.sin(2 * Math.PI * (frequency / 1000) * time);
  const aliceSignal = aliceBase + (Math.random() - 0.5) * noiseFactor;
  let bobSignal = aliceBase + (Math.random() - 0.5) * noiseFactor;
  if (isEavesdropping) {
    bobSignal = (Math.random() - 0.5) * 1.5; 
  }
  return { alice: aliceSignal, bob: bobSignal };
};

export const checkEntanglement = (signals: { alice: number; bob: number }[]): number => {
  if (signals.length < 5) return 1.0;
  const n = signals.length;
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (const s of signals) {
    sumA += s.alice; sumB += s.bob; sumAB += (s.alice * s.bob);
    sumA2 += (s.alice * s.alice); sumB2 += (s.bob * s.bob);
  }
  const num = (n * sumAB) - (sumA * sumB);
  const den = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return den === 0 ? 0 : Math.max(0, Math.min(1, Math.abs(num / den)));
};

export const quantumEncrypt = (text: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const shards = Array.from(data).flatMap(byte => {
    const bits = byte.toString(2).padStart(8, '0').split('').map(Number);
    return bits.map(bit => ({
      bit,
      basis: Math.random() > 0.5 ? 'Rectilinear' : 'Diagonal',
      spin: Math.random() > 0.5 ? 'Up' : 'Down',
      entangled: true
    }));
  });
  const signature = shards
    .slice(0, 32)
    .map(s => (s.bit ^ (s.spin === 'Up' ? 1 : 0)).toString(16))
    .join('')
    .toUpperCase();
  return { 
    signature: (signature || "NULL").padEnd(32, '0'),
    shardCount: shards.length 
  };
};

export const measureAndVerify = (isEavesdropping: boolean, quality: number): boolean => {
  const MIN_SECURE_QUALITY = 0.85; 
  if (isEavesdropping) return false;
  return quality >= MIN_SECURE_QUALITY;
};
