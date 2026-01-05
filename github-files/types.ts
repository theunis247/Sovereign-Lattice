
export interface ShardGroup {
  id: string;
  name: string;
  description: string;
  memberAddresses: string[];
  createdBy: string;
  createdAt: string;
  avatarSeed?: string;
}

export interface ScientificAdvance {
  id: string;
  level: number;
  pathTitle: string;
  description: string;
  consensusArgument: string;
  workingPaper?: string; 
  timestamp: string;
  contributingNodes: string[];
  formula?: string;
  constants?: Record<string, string>;
}

export interface ScientificDossier {
  title: string;
  abstract: string;
  methodology: string;
  dataSynthesis: string;
  conclusion: string;
  generatedAt: string;
  peerReviewArgument?: string;
  expansionHypothesis?: string; 
}

export interface QBSNFT {
  tokenId: number;
  title: string;
  domain: string;
  mintDate: string;
  proofHash: string;
  authorAddress: string;
}

export type SovereignGrade = 'S' | 'A' | 'B' | 'C';

export interface SolvedBlock {
  id: string;
  shardId: string;
  shardIndex: number;
  shardParentId: string;
  tokenParentId: string;
  totalShardsPerToken: number; 
  timestamp: string;
  problem: string;
  answer: string;
  explanation: string;
  reward: number; 
  payoutPerShard: string;
  difficulty: string;
  hash: string;
  parentHash: string;
  integrityHash: string;
  isPeerReviewed: boolean; 
  peerReviewArgument?: string; 
  dossier?: ScientificDossier;
  advancementLevel: number; 
  advancementHistory?: ScientificAdvance[];
  grade?: SovereignGrade;
  breakthroughScore?: number;
  consensusCritique?: string;
  // Structured Math Fields
  primaryFormula?: string;
  observedConstants?: Record<string, string>;
  neuralInterpretation?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward?: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED';
  votesFor: number;
  votesAgainst: number;
  expiresAt: string;
  requiredWeight?: number;
  category?: 'ECONOMIC' | 'SCIENTIFIC' | 'SECURITY';
  totalQuarksStaked?: number;
  proposerRewardClaimed?: boolean;
  scientificBaseline?: string;
  evolutionPath?: string;
  technicalParameters?: string[];
}

export interface SignalData {
  time: number;
  alice: number;
  bob: number;
  phase: number; 
}

export interface SimState {
  isEavesdropping: boolean;
  isSyncing: boolean;
  frequency: number;
  entanglementQuality: number;
  breachDetected: boolean;
  lastBreachTime: number | null;
  networkLatency: number; 
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'security';
}

export interface SecureMessage {
  id: string;
  senderAddress: string;
  receiverAddress: string; 
  text: string;
  timestamp: string;
  tokenHash: string;
  isCompromised?: boolean;
  senderName?: string; 
}

export interface QuantumProof {
  problem: string;
  answer: string;
  explanation: string;
}

export interface Contact {
  name: string;
  address: string;
  addedAt: string;
  profileId?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'BURN' | 'SWAP' | 'SUBSCRIPTION' | 'STAKE' | 'YIELD' | 'ADVANCEMENT_FUNDING' | 'GOVERNANCE_REWARD';
  from?: string;
  to?: string;
  amount: string;
  unit: 'USD' | 'QBS' | 'SHD' | 'QRK';
  description: string;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  attackerIp: string;
  location: string;
  isp: string;
  quantumSignature: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface LatticePool {
  qbsReserve: number;
  usdReserve: number;
  kConstant: number;
  lastPrice: number;
  totalVolumeUsd: number;
}

export interface UserVote {
  type: 'FOR' | 'AGAINST';
  weight: number; 
}

export interface User {
  address: string;
  publicKey: string;
  privateKey: string;
  profileId: string; 
  mnemonic?: string; 
  username: string;
  passwordHash: string;
  password?: string; 
  salt: string;
  securityCode: string; 
  role: 'admin' | 'user';
  balance: number; 
  usdBalance: number; 
  stakedBalance?: number;
  reputationScore?: number; 
  governanceRank?: string; 
  contacts: Contact[];
  transactions: Transaction[];
  incidents: SecurityIncident[];
  solvedBlocks: SolvedBlock[];
  ownedNfts: QBSNFT[];
  shardsTowardNextQBS: number;
  
  messagingActive: boolean;
  messagingExpires?: string;
  miningActive: boolean;
  miningExpires?: string;

  autoSignOutMinutes?: number; 
  votes?: Record<string, UserVote>;
  xp: number;
  level: number;
  tagline?: string;
  bio?: string;
  avatarSeed?: string;
  milestones?: Milestone[];
  groups?: string[]; 
  discoveryVisible?: boolean; 
  activeInitiativeId?: string;
}

export interface WalletState {
  balance: number;
  isMining: boolean;
  miningProgress: number;
  currentProblem: string;
  currentShardId?: string;
  collaborators: string[];
  lastProof?: QuantumProof;
  integrityStatus: 'SECURE' | 'PROBING' | 'COMPROMISED' | 'CALIBRATING';
  secureSessionId?: string;
}

export interface EvolutionProgress {
  blockId: string;
  stage: 'analyzing' | 'synthesizing' | 'validating' | 'finalizing';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
  startTime: number;
  error?: boolean; // Indicates if evolution failed
}

export interface EvolutionStage {
  name: string;
  duration: number; // estimated milliseconds
  message: string;
  color: string;
  icon: string;
}

export interface EvolutionError {
  type: 'api_error' | 'network_error' | 'insufficient_funds' | 'validation_error';
  message: string;
  retryable: boolean;
  suggestedAction?: string;
}
