
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { deepSeekClient } from './services/deepSeekClient';
import { rewardDistribution } from './services/rewardDistribution';
import { walletConnector } from './services/walletConnector';
import { evolutionProgressTracker } from './services/evolutionProgress';
import { EvolutionErrorHandler } from './services/evolutionErrorHandler';
import { SignalData, SimState, LogEntry, WalletState, SecureMessage, User, Contact, Transaction, SolvedBlock, LatticePool, ScientificDossier, Notification, QBSNFT, Proposal, UserVote, ScientificAdvance, Milestone, ShardGroup, SovereignGrade, EvolutionProgress } from './types';
import { generatePhotons, quantumEncrypt, measureAndVerify, checkEntanglement, QBS_UNITS, getMasterBreakthrough, getShardScientificFocus, getCosmicDomain, formatCurrency, GRADE_MULTIPLIERS } from './services/quantumLogic';
import { saveUser, sanitizeInput, getAllUsers, ADMIN_ID, getUserObject, initLatticeRegistry, hashSecret, getUserByIdentifier } from './services/db';
import Terminal from './components/Terminal';
import QuantumLatticeVisualizer from './components/QuantumLatticeVisualizer';
import QuantumMiner from './components/QuantumMiner';
import Auth from './components/Auth';
import LedgerPanel from './components/LedgerPanel';
import SecurityPanel from './components/SecurityPanel';
import WalletView from './components/WalletView';
import WalletConnector from './components/WalletConnector';
import CommunicationsView from './components/CommunicationsView';
import BlocksArchive from './components/BlocksArchive';
import SettingsView from './components/SettingsView';
import TokenomicsView from './components/TokenomicsView';
import MarketView from './components/MarketView';
import GovernanceView from './components/GovernanceView';
import AdminDatabaseView from './components/AdminDatabaseView';
import NotificationHub from './components/NotificationHub';
import ProfileView from './components/ProfileView';
import PeerProfileModal from './components/PeerProfileModal';
import LatticeLogo from './components/LatticeLogo';

const BASE_MINING_REWARD_QRK = 100; 
const XP_MINING_REWARD = 100;
const EVOLUTION_XP_REWARD = 500;
const EVOLUTION_COST_USD = 25; 

const LEASE_COSTS = {
  MESSAGING: 1,
  MINING: 50
};

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 500)) + 1;

const calculateReputation = (user: User) => {
  const solvedWeight = (user.solvedBlocks?.length || 0) * 100;
  const stakeWeight = (user.stakedBalance || 0) * 500;
  const levelWeight = user.level * 250;
  return Math.floor(solvedWeight + stakeWeight + levelWeight);
};

const getGovernanceRank = (reputation: number) => {
  if (reputation > 50000) return "Grand Architect";
  if (reputation > 25000) return "Sovereign Councilor";
  if (reputation > 10000) return "Master Observer";
  if (reputation > 5000) return "Senior Resolver";
  return "Node Aspirant";
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'communications' | 'wallet' | 'archive' | 'database' | 'settings' | 'tokenomics' | 'market' | 'governance' | 'profile'>('terminal');
  const [allLatticeUsers, setAllLatticeUsers] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  const [selectedGroup, setSelectedGroup] = useState<ShardGroup | undefined>(undefined);
  const [shardGroups, setShardGroups] = useState<ShardGroup[]>([]);
  const [isSyncingToDb, setIsSyncingToDb] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const lastActiveRef = useRef(Date.now());
  
  const [observingPeer, setObservingPeer] = useState<User | null>(null);
  const [isSynthesizingDossier, setIsSynthesizingDossier] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Evolution progress tracking state
  const [isEvolvingBreakthrough, setIsEvolvingBreakthrough] = useState<Record<string, boolean>>({});
  const [evolutionProgress, setEvolutionProgress] = useState<Record<string, EvolutionProgress>>({});

  const [pool, setPool] = useState<LatticePool>({
    qbsReserve: 1000,
    usdReserve: 1000000,
    kConstant: 1000 * 1000000,
    lastPrice: 1000,
    totalVolumeUsd: 0
  });

  const [simState, setSimState] = useState<SimState>({
    isEavesdropping: false, 
    isSyncing: true,
    frequency: 45000,
    entanglementQuality: 1.0,
    breachDetected: false,
    lastBreachTime: null,
    networkLatency: 42
  });
  
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    isMining: false,
    miningProgress: 0,
    currentProblem: '',
    collaborators: [],
    integrityStatus: 'SECURE'
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // SESSION SECURITY: AUTO-LOCK
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const idleTime = (Date.now() - lastActiveRef.current) / 60000;
      const limit = currentUser.autoSignOutMinutes || 30;
      if (idleTime > limit) {
        handleSignOut();
        addNotification("Session Expired", "Node locked due to inactivity.", "security");
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const updateActivity = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [updateActivity]);

  useEffect(() => {
    const recoverNodeSession = async () => {
      try {
        await initLatticeRegistry(); 
        const activeAddr = localStorage.getItem('LATTICE_ACTIVE_ADDR');
        if (activeAddr) {
          const user = await getUserObject(activeAddr);
          if (user) {
            setCurrentUser(user);
            setWallet(prev => ({ ...prev, balance: user.balance }));
          }
        }
        const users = await getAllUsers();
        setAllLatticeUsers(users);
        
        setProposals([
          {
            id: "LGP-001",
            title: "Prioritize Gravitational Wave Mapping",
            description: "Redirect consensus resources to resolve the entanglement paradox in Hawking Radiation.",
            proposer: ADMIN_ID,
            status: 'ACTIVE',
            votesFor: 85.421,
            votesAgainst: 12.009,
            requiredWeight: 150,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            category: 'SCIENTIFIC',
            totalQuarksStaked: 50000,
            scientificBaseline: "LIGO-based laser interferometry baseline established.",
            evolutionPath: "Evolving toward Quantum Gravity mapping.",
            technicalParameters: ["Coherence Threshold: 0.9992"]
          }
        ]);
      } catch (err) {
        console.error("Critical Failure:", err);
      } finally {
        setIsAppReady(true);
      }
    };
    recoverNodeSession();

    // Set up wallet state monitoring
    const handleWalletStateChange = (walletState: any) => {
      setWalletConnected(walletState.isConnected);
      setWalletAddress(walletState.address);
      
      // Link wallet to current user if both are available
      if (walletState.isConnected && currentUser && walletState.address !== currentUser.walletAddress) {
        const updatedUser = { ...currentUser, walletAddress: walletState.address, isWalletConnected: true };
        syncUser(updatedUser);
      }
    };

    walletConnector.onStateChange(handleWalletStateChange);

    return () => {
      walletConnector.removeStateListener(handleWalletStateChange);
    };
  }, [currentUser]);

  useEffect(() => {
    if (wallet.isMining && !isEvaluating) {
      const interval = setInterval(() => {
        setWallet(prev => {
          if (prev.miningProgress >= 100) {
            clearInterval(interval);
            handleMiningComplete();
            return { ...prev, miningProgress: 100 };
          }
          return { ...prev, miningProgress: prev.miningProgress + 1.2 };
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [wallet.isMining, isEvaluating]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      message: sanitizeInput(message),
      type
    };
    setLogs(prev => [...prev.slice(-49), entry]);
  }, []);

  const syncUser = useCallback(async (updatedUser: User) => {
    setIsSyncingToDb(true);
    updatedUser.reputationScore = calculateReputation(updatedUser);
    updatedUser.governanceRank = getGovernanceRank(updatedUser.reputationScore);
    const newLevel = calculateLevel(updatedUser.xp);
    if (newLevel > updatedUser.level) {
      updatedUser.level = newLevel;
      addNotification("Level Up!", `Node intelligence expanded to Level ${newLevel}.`, "success");
    }
    try {
      await saveUser(updatedUser);
      localStorage.setItem('LATTICE_ACTIVE_ADDR', updatedUser.address);
      setCurrentUser({ ...updatedUser });
      setWallet(w => ({ ...w, balance: updatedUser.balance }));
      const users = await getAllUsers();
      setAllLatticeUsers(users);
    } catch (e) {
      addNotification("Sync Error", "Failed to etch lattice state.", "error");
    } finally {
      setTimeout(() => setIsSyncingToDb(false), 300);
    }
  }, [addNotification]);

  const handleMiningStart = () => {
    if (!currentUser?.miningActive) {
      addNotification("Access Denied", "Renew Mining Lease to resolve shards.", "warning");
      return;
    }
    const problem = currentUser.activeInitiativeId 
      ? `Resolving Initiative Task: ${proposals.find(p => p.id === currentUser.activeInitiativeId)?.title}...`
      : `Resolving frontier in ${getShardScientificFocus(Math.floor(Math.random() * 1000) + 1, Math.floor(Math.random() * 100) + 1)}...`;
    
    setWallet(w => ({ ...w, isMining: true, miningProgress: 0, currentProblem: problem }));
    addLog("MINER: Shard synchronization started.", "info");
  };

  const handleMiningComplete = async () => {
    if (!currentUser || isEvaluating) return;
    setIsEvaluating(true);
    setIsVerifying(true);
    addLog("CONSENSUS: Shard proof detected. Peer-Review process engaged.", "warning");

    try {
      // Check if DeepSeek API is configured
      const isConfigured = await deepSeekClient.isConfigured();
      if (!isConfigured) {
        addNotification("API Key Required", "Please configure your DeepSeek API key in settings.", "warning");
        setIsEvaluating(false);
        setIsVerifying(false);
        setWallet(w => ({ ...w, isMining: false, miningProgress: 0 }));
        return;
      }

      // Use DeepSeek API for evaluation
      const review = await deepSeekClient.evaluateMiningBreakthrough({
        problem: wallet.currentProblem
      });

      const grade: SovereignGrade = review.grade;
      const multiplier = GRADE_MULTIPLIERS[grade];
      const quarkReward = BASE_MINING_REWARD_QRK * multiplier;
      const qbsMagnitudeBonus = grade === 'S' ? 0.005 : 0; 

      const newBlock: SolvedBlock = {
        id: `BLOCK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        shardId: `SHD-${Math.floor(Math.random() * 100000)}`,
        shardIndex: (currentUser.solvedBlocks?.length || 0) + 1,
        shardParentId: "SHD-MAIN",
        tokenParentId: "QBS-ALPHA",
        totalShardsPerToken: 1000,
        timestamp: new Date().toLocaleString(),
        problem: wallet.currentProblem,
        answer: `SIG_${Math.random().toString(16).slice(2).toUpperCase()}`,
        explanation: review.explanation,
        reward: qbsMagnitudeBonus,
        payoutPerShard: `${quarkReward} QRK`,
        difficulty: "PEER_REVIEW_STRICT",
        hash: `0000${Math.random().toString(16).slice(2, 64)}`,
        parentHash: currentUser.solvedBlocks[currentUser.solvedBlocks.length - 1]?.hash || "0".repeat(64),
        integrityHash: `SHA256-${Math.random().toString(36).substr(2, 10)}`,
        isPeerReviewed: true,
        advancementLevel: 1,
        advancementHistory: [],
        grade,
        breakthroughScore: review.breakthroughScore,
        consensusCritique: review.consensusCritique,
        primaryFormula: review.primaryFormula,
        observedConstants: review.observedConstants,
        neuralInterpretation: review.neuralInterpretation
      };

      const updatedUser: User = {
        ...currentUser,
        usdBalance: currentUser.usdBalance + quarkReward,
        balance: currentUser.balance + qbsMagnitudeBonus,
        xp: currentUser.xp + XP_MINING_REWARD,
        solvedBlocks: [...(currentUser.solvedBlocks || []), newBlock],
        transactions: [...(currentUser.transactions || []), {
          id: `MN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          timestamp: new Date().toLocaleString(),
          type: 'CREDIT',
          amount: quarkReward.toString(),
          unit: 'QRK',
          description: `Resolved Shard #${newBlock.shardIndex} (${grade} Grade)`
        }]
      };

      if (qbsMagnitudeBonus > 0) {
        updatedUser.transactions.push({
          id: `MAG-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          timestamp: new Date().toLocaleString(),
          type: 'CREDIT',
          amount: qbsMagnitudeBonus.toFixed(6),
          unit: 'QBS',
          description: `Rare S-Grade Magnitude Accrual`
        });
      }

      // Distribute blockchain rewards if wallet is connected
      if (walletConnected && walletAddress) {
        try {
          addLog("BLOCKCHAIN: Initiating QBS token minting...", "info");
          
          const rewardResult = await rewardDistribution.distributeMiningReward(
            walletAddress,
            qbsMagnitudeBonus, // QBS amount (magnitude bonus)
            grade,
            newBlock.id
          );

          if (rewardResult.success && !rewardResult.queued) {
            addLog(`BLOCKCHAIN: QBS tokens minted successfully. TX: ${rewardResult.transactionHash?.slice(0, 10)}...`, "success");
            addNotification("Blockchain Reward", `${qbsMagnitudeBonus.toFixed(6)} QBS minted to your wallet!`, "success");
            
            // Add blockchain transaction to user record
            updatedUser.transactions.push({
              id: `BLOCKCHAIN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
              timestamp: new Date().toLocaleString(),
              type: 'CREDIT',
              amount: qbsMagnitudeBonus.toFixed(6),
              unit: 'QBS',
              description: `Blockchain Mining Reward - TX: ${rewardResult.transactionHash?.slice(0, 10)}...`
            });
          } else if (rewardResult.queued) {
            addLog("BLOCKCHAIN: Reward queued for when wallet/contract is available.", "warning");
            addNotification("Reward Queued", "QBS tokens will be minted when blockchain is available.", "warning");
          } else {
            addLog(`BLOCKCHAIN: Minting failed - ${rewardResult.error}`, "error");
            addNotification("Blockchain Error", rewardResult.error || "Failed to mint QBS tokens", "error");
          }
        } catch (blockchainError: any) {
          console.error("Blockchain reward error:", blockchainError);
          addLog(`BLOCKCHAIN: Error - ${blockchainError.message}`, "error");
        }
      } else {
        addLog("BLOCKCHAIN: Wallet not connected. Rewards stored locally.", "warning");
      }

      await syncUser(updatedUser);
      addNotification(`Peer-Review: Grade ${grade}`, `Awarded ${quarkReward} QRK.${grade === 'S' ? ' MAGNITUDE ACCRUED.' : ''}`, grade === 'S' ? 'security' : 'success');
    } catch (err: any) {
      console.error("DeepSeek API Error:", err);
      addNotification("Review Error", err.message || "DeepSeek API failed to respond.", "error");
    } finally {
      setIsEvaluating(false);
      setIsVerifying(false);
      setWallet(w => ({ ...w, isMining: false, miningProgress: 0 }));
    }
  };

  const handleEvolveBreakthrough = async (blockId: string, isRetryAttempt: boolean = false) => {
    if (!currentUser || isEvolvingBreakthrough[blockId]) return;
    const block = currentUser.solvedBlocks.find(b => b.id === blockId);
    if (!block) {
      const error = EvolutionErrorHandler.classifyError(new Error("Block not found"), 'BLOCK_NOT_FOUND');
      addNotification("Evolution Error", error.userMessage, EvolutionErrorHandler.getNotificationType(error));
      return;
    }
    if (currentUser.usdBalance < EVOLUTION_COST_USD) {
      const error = EvolutionErrorHandler.classifyError(new Error("Insufficient funds"), 'INSUFFICIENT_FUNDS');
      addNotification("Evolution Error", error.userMessage, EvolutionErrorHandler.getNotificationType(error));
      return;
    }

    // Set evolution state and start progress tracking
    setIsEvolvingBreakthrough(prev => ({ ...prev, [blockId]: true }));
    setIsSynthesizingDossier(true);
    
    // Start progress tracking with enhanced callback and profile validation
    evolutionProgressTracker.startEvolution(blockId, (progress) => {
      setEvolutionProgress(prev => ({ ...prev, [blockId]: progress }));
      addLog(`EVOLUTION: ${progress.message}`, "info");
    }, currentUser.profileId);

    addLog(`EVOLUTION: Initiating refinement of Mk ${block.advancementLevel || 1} breakthrough "${block.problem.substring(0, 50)}..."`, "info");

    try {
      // Check if DeepSeek API is configured
      const isConfigured = await deepSeekClient.isConfigured();
      if (!isConfigured) {
        const error = EvolutionErrorHandler.classifyError(new Error("API key not configured"), 'API_KEY_MISSING');
        addNotification("Evolution Error", error.userMessage, EvolutionErrorHandler.getNotificationType(error));
        addNotification("Suggested Action", error.actionable, "info");
        evolutionProgressTracker.handleEvolutionError(blockId, error.userMessage, error.type);
        return;
      }

      // Test API connection before proceeding
      addLog("EVOLUTION: Verifying DeepSeek API connection...", "info");
      const connectionTest = await deepSeekClient.testConnection();
      if (!connectionTest) {
        const error = EvolutionErrorHandler.classifyError(new Error("Connection test failed"), 'NETWORK_CONNECTION');
        addNotification("Evolution Error", error.userMessage, EvolutionErrorHandler.getNotificationType(error));
        addNotification("Suggested Action", error.actionable, "info");
        evolutionProgressTracker.handleEvolutionError(blockId, error.userMessage, error.type);
        return;
      }

      // Advance through stages with realistic timing and progress callbacks
      setTimeout(async () => {
        await evolutionProgressTracker.advanceToStage(blockId, 'synthesizing');
        addLog("EVOLUTION: Synthesizing advanced mathematical frameworks...", "info");
      }, 1500);
      
      setTimeout(async () => {
        await evolutionProgressTracker.advanceToStage(blockId, 'validating');
        addLog("EVOLUTION: Validating scientific accuracy and consistency...", "info");
      }, 6000);
      
      setTimeout(async () => {
        await evolutionProgressTracker.advanceToStage(blockId, 'finalizing');
        addLog("EVOLUTION: Finalizing evolution results...", "info");
      }, 10000);

      // Use DeepSeek API for evolution with progress reporting
      addLog("EVOLUTION: Submitting breakthrough to DeepSeek Council...", "info");
      const synth = await deepSeekClient.evolveBreakthrough({
        currentExplanation: block.explanation,
        currentLevel: block.advancementLevel || 1,
        blockId: block.id
      }, (progress) => {
        // Progress callback for DeepSeek API calls
        addLog(`EVOLUTION: ${progress.message}`, "info");
      });
      const newGrade: SovereignGrade = synth.newGrade;
      const qbsMagnitudeBonus = newGrade === 'S' ? 0.005 : newGrade === 'A' ? 0.001 : 0;
      const quarkYield = newGrade === 'S' ? 1000 : newGrade === 'A' ? 500 : 100;

      const newHistoryEntry: ScientificAdvance = {
        id: `ADV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        level: (block.advancementLevel || 1) + 1,
        pathTitle: `Refinement to Mk ${(block.advancementLevel || 1) + 1}`,
        description: synth.evolvedExplanation,
        consensusArgument: synth.consensusCritique,
        workingPaper: `MATH: ${synth.scientificMath}\n\nIMP: ${synth.realWorldImplementation}`,
        timestamp: new Date().toLocaleString(),
        contributingNodes: [currentUser.username, "Council-Skeptic"],
        formula: synth.evolvedFormula,
        constants: synth.observedConstants
      };

      const updatedBlocks = currentUser.solvedBlocks.map(b => {
        if (b.id === blockId) {
          return {
            ...b,
            advancementLevel: (b.advancementLevel || 1) + 1,
            explanation: synth.evolvedExplanation,
            grade: newGrade,
            breakthroughScore: synth.newScore,
            consensusCritique: synth.consensusCritique,
            reward: b.reward + qbsMagnitudeBonus,
            payoutPerShard: `${quarkYield} QRK`,
            advancementHistory: [...(b.advancementHistory || []), newHistoryEntry],
            primaryFormula: synth.evolvedFormula,
            observedConstants: synth.observedConstants
          };
        }
        return b;
      });

      const updatedUser: User = {
        ...currentUser,
        usdBalance: currentUser.usdBalance - EVOLUTION_COST_USD + quarkYield,
        balance: currentUser.balance + qbsMagnitudeBonus,
        xp: currentUser.xp + EVOLUTION_XP_REWARD,
        solvedBlocks: updatedBlocks,
        transactions: [...(currentUser.transactions || []), {
          id: `EV-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          timestamp: new Date().toLocaleString(),
          type: 'DEBIT',
          amount: EVOLUTION_COST_USD.toString(),
          unit: 'USD',
          description: `Evolution Funding`
        }, {
          id: `EVY-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          timestamp: new Date().toLocaleString(),
          type: 'CREDIT',
          amount: quarkYield.toString(),
          unit: 'QRK',
          description: `Evolution Yield (${newGrade})`
        }]
      };

      // Distribute blockchain evolution rewards if wallet is connected
      if (walletConnected && walletAddress && qbsMagnitudeBonus > 0) {
        try {
          addLog("BLOCKCHAIN: Initiating evolution reward minting...", "info");
          
          const rewardResult = await rewardDistribution.distributeEvolutionReward(
            walletAddress,
            qbsMagnitudeBonus, // QBS amount (magnitude bonus)
            block.id,
            (block.advancementLevel || 1) + 1
          );

          if (rewardResult.success && !rewardResult.queued) {
            addLog(`BLOCKCHAIN: Evolution QBS tokens minted successfully. TX: ${rewardResult.transactionHash?.slice(0, 10)}...`, "success");
            addNotification("Evolution Reward", `${qbsMagnitudeBonus.toFixed(6)} QBS minted for breakthrough evolution!`, "success");
            
            // Add blockchain transaction to user record
            updatedUser.transactions.push({
              id: `BLOCKCHAIN-EV-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
              timestamp: new Date().toLocaleString(),
              type: 'CREDIT',
              amount: qbsMagnitudeBonus.toFixed(6),
              unit: 'QBS',
              description: `Blockchain Evolution Reward - TX: ${rewardResult.transactionHash?.slice(0, 10)}...`
            });
          } else if (rewardResult.queued) {
            addLog("BLOCKCHAIN: Evolution reward queued for when wallet/contract is available.", "warning");
            addNotification("Evolution Reward Queued", "QBS tokens will be minted when blockchain is available.", "warning");
          } else {
            addLog(`BLOCKCHAIN: Evolution minting failed - ${rewardResult.error}`, "error");
            addNotification("Evolution Blockchain Error", rewardResult.error || "Failed to mint evolution QBS tokens", "error");
          }
        } catch (blockchainError: any) {
          console.error("Blockchain evolution reward error:", blockchainError);
          addLog(`BLOCKCHAIN: Evolution error - ${blockchainError.message}`, "error");
        }
      }

      // Complete the evolution progress
      evolutionProgressTracker.completeEvolution(blockId);
      
      await syncUser(updatedUser);
      addNotification("Evolution Concluded", `Reached Mk ${(block.advancementLevel || 1) + 1} with Grade ${newGrade}.`, "success");
    } catch (err: any) {
       console.error("DeepSeek Evolution Error:", err);
       
       // Use enhanced error handling system
       const evolutionError = EvolutionErrorHandler.classifyError(err);
       const retryConfig = EvolutionErrorHandler.getRetryConfig(evolutionError);
       
       // Log detailed error information
       addLog(`EVOLUTION ERROR: ${EvolutionErrorHandler.formatForLog(evolutionError)}`, "error");
       
       // Handle retryable errors
       if (retryConfig.shouldRetry && !isRetryAttempt) {
         evolutionProgressTracker.handleRetryableError(blockId, evolutionError.userMessage, retryConfig.delay);
         
         // Schedule retry after delay
         setTimeout(async () => {
           addLog(`EVOLUTION: Retrying evolution after ${retryConfig.delay/1000}s delay...`, "info");
           await handleEvolveBreakthrough(blockId, true); // Mark as retry attempt
         }, retryConfig.delay);
         
         return; // Don't clean up state yet, retry is scheduled
       }
       
       // Show user-friendly error notification
       const notificationType = EvolutionErrorHandler.getNotificationType(evolutionError);
       addNotification("Evolution Error", evolutionError.userMessage, notificationType);
       
       // Show actionable guidance if available
       if (evolutionError.actionable) {
         setTimeout(() => {
           addNotification("Suggested Action", evolutionError.actionable, "info");
         }, 1000);
       }
       
       // Handle evolution error in progress tracker
       evolutionProgressTracker.handleEvolutionError(blockId, evolutionError.userMessage, evolutionError.type);
    } finally {
       setIsEvolvingBreakthrough(prev => ({ ...prev, [blockId]: false }));
       setIsSynthesizingDossier(false);
    }
  };

  const handleVote = async (proposalId: string, type: 'FOR' | 'AGAINST', weightInQuarks: number) => {
    if (!currentUser) return;
    if (currentUser.votes?.[proposalId]) return addNotification("Action Locked", "Consensus already etched.", "warning");
    const updatedProposals = proposals.map(p => {
      if (p.id === proposalId) {
        const qbsWeight = weightInQuarks / QBS_UNITS.QRK;
        return {
          ...p,
          votesFor: type === 'FOR' ? p.votesFor + qbsWeight : p.votesFor,
          votesAgainst: type === 'AGAINST' ? p.votesAgainst + qbsWeight : p.votesAgainst,
          totalQuarksStaked: (p.totalQuarksStaked || 0) + weightInQuarks
        };
      }
      return p;
    });
    setProposals(updatedProposals);
    const updatedUser: User = {
      ...currentUser,
      votes: { ...(currentUser.votes || {}), [proposalId]: { type, weight: weightInQuarks } },
      xp: currentUser.xp + 50
    };
    await syncUser(updatedUser);
    addNotification("Poll Broadcast", "Magnitude contribution synchronized.", "success");
  };

  const handleJoinInitiative = async (proposalId: string) => {
    if (!currentUser) return;
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;
    const updatedUser: User = { ...currentUser, activeInitiativeId: proposalId, xp: currentUser.xp + 200 };
    await syncUser(updatedUser);
    addNotification("Task Assigned", `Mining now focused on: ${prop.title}.`, "success");
    setActiveTab('terminal');
  };

  const handleNewProposal = async (partial: Partial<Proposal>) => {
    if (!currentUser) return;
    const fee = 500; 
    if (currentUser.usdBalance < fee) return addNotification("Insufficient Quarks", "500 QRK required.", "error");
    const newProp: Proposal = {
      id: `LGP-${Math.floor(Math.random() * 900) + 100}`,
      title: partial.title || "Untitled",
      description: partial.description || "No abstract.",
      proposer: currentUser.profileId,
      status: 'ACTIVE',
      votesFor: 0,
      votesAgainst: 0,
      requiredWeight: 300,
      expiresAt: new Date(Date.now() + 604800000).toISOString(),
      category: partial.category || 'SCIENTIFIC',
      totalQuarksStaked: fee,
      scientificBaseline: "Foundational data synthesis active.",
      evolutionPath: "Pending consensus mapping."
    };
    const updatedUser: User = {
      ...currentUser,
      usdBalance: currentUser.usdBalance - fee,
      transactions: [...(currentUser.transactions || []), {
        id: `GOV-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'DEBIT',
        amount: fee.toString(),
        unit: 'USD',
        description: `Initiative Broadcast: ${newProp.id}`
      }]
    };
    setProposals([newProp, ...proposals]);
    await syncUser(updatedUser);
  };

  const handleLogin = (user: User) => {
    localStorage.setItem('LATTICE_ACTIVE_ADDR', user.address);
    setCurrentUser(user);
    setWallet(w => ({ ...w, balance: user.balance }));
    addNotification("Node Linked", `Authenticated as ${user.username}.`, "success");
  };

  const handleSignOut = () => {
    localStorage.removeItem('LATTICE_ACTIVE_ADDR');
    setCurrentUser(null);
  };

  const handleSendMessage = async (text: string, isGroup: boolean = false) => {
    if (!currentUser?.messagingActive) return;
    const msgCost = 0.000005; 
    const { signature } = quantumEncrypt(text);
    const newMessage: SecureMessage = {
      id: `MSG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      senderAddress: currentUser.address,
      receiverAddress: isGroup ? (selectedGroup?.id || '') : (selectedContact?.address || ''),
      text,
      timestamp: new Date().toLocaleString(),
      tokenHash: signature,
      senderName: currentUser.username
    };
    const updatedUser: User = {
      ...currentUser,
      usdBalance: currentUser.usdBalance - msgCost,
      transactions: [...(currentUser.transactions || []), {
        id: `TX-MSG-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'DEBIT',
        amount: msgCost.toString(),
        unit: 'USD',
        description: `Messaging Burn`
      }]
    };
    setMessages(prev => [newMessage, ...prev]);
    await syncUser(updatedUser);
  };

  const handleAddContact = async (address: string, name: string) => {
    if (!currentUser) return;
    const newContact: Contact = { name, address, addedAt: new Date().toISOString(), profileId: allLatticeUsers.find(u => u.address === address)?.profileId };
    await syncUser({ ...currentUser, contacts: [...currentUser.contacts, newContact] });
  };

  const handleSubscribeService = async (type: 'MESSAGING' | 'MINING') => {
    if (!currentUser) return;
    const cost = LEASE_COSTS[type];
    if (currentUser.usdBalance < cost) return addNotification("Insufficient Funds", "Acquire more Quarks.", "error");
    const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
    const updatedUser: User = { 
      ...currentUser, 
      usdBalance: currentUser.usdBalance - cost, 
      [type === 'MESSAGING' ? 'messagingActive' : 'miningActive']: true,
      [type === 'MESSAGING' ? 'messagingExpires' : 'miningExpires']: expiry.toISOString(),
      transactions: [...(currentUser.transactions || []), {
        id: `SUB-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'SUBSCRIPTION',
        amount: cost.toString(),
        unit: 'USD',
        description: `${type} Activation`
      }]
    };
    await syncUser(updatedUser);
  };

  const handleTransfer = async (toAddr: string, amount: number, privKey: string, unit: Transaction['unit']) => {
    if (!currentUser || privKey !== currentUser.privateKey) return addNotification("Key Mismatch", "Auth error.", "error");
    const recipient = await getUserObject(toAddr);
    if (!recipient) return;
    let qbsVal = 0, usdVal = 0;
    if (unit === 'QBS') qbsVal = amount;
    else if (unit === 'QRK' || unit === 'USD') usdVal = amount;
    
    if (currentUser.balance < qbsVal || currentUser.usdBalance < usdVal) return addNotification("Low Balance", "Transfer rejected.", "error");

    const updatedSender: User = {
      ...currentUser,
      balance: currentUser.balance - qbsVal,
      usdBalance: currentUser.usdBalance - usdVal,
      transactions: [...(currentUser.transactions || []), {
        id: `TX-OUT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'TRANSFER_OUT',
        to: toAddr,
        amount: amount.toString(),
        unit: unit,
        description: `Transmission to ${recipient.username}`
      }]
    };
    const updatedRecipient: User = {
      ...recipient,
      balance: recipient.balance + qbsVal,
      usdBalance: recipient.usdBalance + usdVal,
      transactions: [...(recipient.transactions || []), {
        id: `TX-IN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'TRANSFER_IN',
        from: currentUser.address,
        amount: amount.toString(),
        unit: unit,
        description: `Received from ${currentUser.username}`
      }]
    };
    await saveUser(updatedRecipient);
    await syncUser(updatedSender);
  };

  const handleSwap = async (fromUnit: 'QRK' | 'USD', amount: number) => {
    if (!currentUser) return;
    if (fromUnit === 'USD' && currentUser.usdBalance < amount) return;
    // Swap logic: 1,000,000 QRK = 0.001 QBS (Rare magnitude)
    const qbsDelta = amount / QBS_UNITS.QRK; 
    const updatedUser: User = {
      ...currentUser,
      balance: currentUser.balance + qbsDelta,
      usdBalance: currentUser.usdBalance - (fromUnit === 'USD' ? amount : amount),
      transactions: [...(currentUser.transactions || []), {
        id: `SWAP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'SWAP',
        amount: amount.toString(),
        unit: fromUnit,
        description: `Swap to Magnitude`
      }]
    };
    await syncUser(updatedUser);
  };

  const handlePurchase = async (usd: number) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      usdBalance: currentUser.usdBalance + usd,
      transactions: [...(currentUser.transactions || []), {
        id: `PUR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp: new Date().toLocaleString(),
        type: 'CREDIT',
        amount: usd.toString(),
        unit: 'USD',
        description: "Fiat Liquidity On-Ramp"
      }]
    };
    await syncUser(updatedUser);
  };

  if (!isAppReady) return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 font-black animate-pulse uppercase tracking-widest">Synchronizing Scientific Registry...</div>;
  if (!currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto bg-black text-gray-200 h-screen overflow-hidden relative">
      <NotificationHub notifications={notifications} />
      {observingPeer && <PeerProfileModal peer={observingPeer} onClose={() => setObservingPeer(null)} />}
      
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6 shrink-0 no-print">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('profile')} className="hover:scale-105 transition-transform">
              <LatticeLogo size="lg" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-tighter italic">Sovereign Lattice</h1>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{currentUser.governanceRank || "Node Aspirant"}</p>
                 <span className="text-[8px] text-gray-600 font-bold mono">SYNC: {simState.networkLatency}ms</span>
              </div>
            </div>
          </div>
          <nav className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 ml-4">
            {['terminal', 'communications', 'wallet', 'market', 'governance', 'archive', 'profile', 'settings'].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab as any); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex gap-4 items-center">
            <div className="hidden lg:block">
              <WalletConnector />
            </div>
            <div className="hidden lg:flex flex-col items-end mr-4">
               <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Influence Score</span>
               <span className="text-sm font-black text-white mono">Σ {(currentUser.reputationScore || 0).toLocaleString()}</span>
            </div>
            <button onClick={() => syncUser(currentUser)} disabled={isSyncingToDb} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase bg-green-600/10 text-green-500 border border-green-500/20">{isSyncingToDb ? 'SYNCING...' : 'CHECKPOINT'}</button>
            <button onClick={handleSignOut} className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase bg-red-600/10 text-red-500 border border-red-500/20">Sign Out</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar rounded-3xl no-print">
        <div className="p-1 pb-24 h-full">
          {activeTab === 'terminal' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in h-full">
              <section className="lg:col-span-3 flex flex-col gap-4 h-full">
                <QuantumMiner 
                  isMining={wallet.isMining} 
                  progress={wallet.miningProgress} 
                  problem={wallet.currentProblem} 
                  onStart={handleMiningStart} 
                  balance={currentUser.balance} 
                  isVerifying={isVerifying} 
                  collaborators={wallet.collaborators} 
                  solvedCount={currentUser.solvedBlocks?.length || 0} 
                  integrityStatus={wallet.integrityStatus} 
                  publicRemaining={9000 - allLatticeUsers.reduce((s, u) => s + (u.address === ADMIN_ID ? 0 : u.balance), 0)} 
                  miningActive={currentUser.miningActive}
                  activeInitiative={proposals.find(p => p.id === currentUser.activeInitiativeId)?.title}
                />
                <Terminal logs={logs} />
              </section>
              <section className="lg:col-span-9 flex flex-col gap-6">
                <div className="bg-zinc-900/40 border border-white/10 rounded-[3.5rem] h-[450px] shrink-0">
                  <QuantumLatticeVisualizer 
                    progress={wallet.miningProgress} 
                    isBreach={simState.breachDetected} 
                    entanglementQuality={simState.entanglementQuality} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <LedgerPanel transactions={currentUser.transactions || []} />
                   <SecurityPanel incidents={currentUser.incidents || []} onGenerateReport={() => {}} isGenerating={false} />
                </div>
              </section>
            </div>
          )}
          {activeTab === 'communications' && (
            <CommunicationsView 
              user={currentUser} 
              allUsers={allLatticeUsers}
              messages={messages} 
              selectedContact={selectedContact} 
              onSelectContact={(c) => { setSelectedContact(c); setSelectedGroup(undefined); }} 
              onAddContact={handleAddContact} 
              onSendMessage={handleSendMessage} 
              isChannelRunning={true} 
              onUpdateUser={syncUser}
              onObservePeer={(c) => setObservingPeer(allLatticeUsers.find(u => u.address === c.address) || null)}
              groups={shardGroups}
              selectedGroup={selectedGroup}
              onSelectGroup={(g) => { setSelectedGroup(g); setSelectedContact(undefined); }}
              onCreateGroup={(n, m) => {}}
            />
          )}
          {activeTab === 'wallet' && <WalletView user={currentUser} onSubscribe={handleSubscribeService} onTransfer={handleTransfer} />}
          {activeTab === 'archive' && (
            <BlocksArchive 
              blocks={currentUser.solvedBlocks || []} 
              onGenerateDossier={handleEvolveBreakthrough} 
              isGeneratingDossier={isSynthesizingDossier} 
              currentUser={currentUser}
              isEvolvingBreakthrough={isEvolvingBreakthrough}
              evolutionProgress={evolutionProgress}
              onCancelEvolution={async (blockId) => {
                // Validate profile access before cancelling
                const hasAccess = await evolutionProgressTracker.validateEvolutionAccess(blockId, 'cancel');
                if (!hasAccess) {
                  addNotification("Access Denied", "Insufficient permissions to cancel this evolution.", "error");
                  return;
                }

                // Cancel evolution logic - stop progress tracking and reset state
                if (evolutionProgressTracker) {
                  evolutionProgressTracker.handleEvolutionError(blockId, "Evolution cancelled by user");
                }
                setIsEvolvingBreakthrough(prev => ({ ...prev, [blockId]: false }));
                setEvolutionProgress(prev => {
                  const updated = { ...prev };
                  delete updated[blockId];
                  return updated;
                });
                setIsSynthesizingDossier(false);
                addNotification("Evolution Cancelled", "Breakthrough evolution was cancelled.", "warning");
              }}
            />
          )}
          {activeTab === 'profile' && <ProfileView user={currentUser} onUpdate={syncUser} />}
          {activeTab === 'market' && <MarketView user={currentUser} pool={pool} onSwap={handleSwap} onStake={() => {}} onPurchase={handlePurchase} />}
          {activeTab === 'governance' && (
            <GovernanceView 
              user={currentUser} 
              proposals={proposals}
              onVote={handleVote} 
              onNewProposal={handleNewProposal}
              onExecute={() => {}}
              onJoin={handleJoinInitiative}
            />
          )}
          {activeTab === 'settings' && <SettingsView user={currentUser} onUpdateUser={syncUser} addLog={addLog} />}
        </div>
      </main>
    </div>
  );
};

export default App;
