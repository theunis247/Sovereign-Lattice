
// @google/genai guidelines followed for model selection and response handling
import { User, Contact, Transaction, QBSNFT, SolvedBlock } from '../types';
import { getMasterBreakthrough, getShardScientificFocus, getCosmicDomain, QBS_UNITS } from './quantumLogic';

const DB_NAME = 'QuantumSecureLattice_v8'; 
const DB_VERSION = 1; 
const STORE_USERS = 'users';

const LATTICE_PEPPER = "k7$!v9QzP@m3L#r8_Quantum_Sovereign_999";

export const ADMIN_ID = "qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p";

let dbPromise: Promise<IDBDatabase> | null = null;

const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

const toBase32 = (bytes: Uint8Array): string => {
  let result = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      result += BECH32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BECH32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return result;
};

const getSecureRandom = (count: number): Uint8Array => {
  const array = new Uint8Array(count);
  window.crypto.getRandomValues(array);
  return array;
};

export const generateMnemonic = (wordCount: number = 24): string => {
  const SCI_WORDS = [
    "photon", "hadron", "muon", "gravity", "boson", "qubit", "flux", "energy", "matrix", "vector", "scalar", "tensor",
    "quark", "gluon", "parity", "symmetry", "vacuum", "void", "space", "time", "chaos", "logic", "proof", "axiom"
  ];
  const random = getSecureRandom(wordCount);
  return Array.from(random)
    .map(val => SCI_WORDS[val % SCI_WORDS.length])
    .join(' ');
};

export const generateRandomCode = (length: number = 5): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = getSecureRandom(length);
  return Array.from(random).map(val => chars[val % chars.length]).join('');
};

export const generateProfileId = (username: string): string => {
  const chars = "0123456789ABCDEF";
  const random = getSecureRandom(4);
  const suffix = Array.from(random).map(val => chars[val % chars.length]).join('');
  return `${username.replace(/\s+/g, '_').toUpperCase()}#${suffix}`;
};

export const generateKeys = (): { publicKey: string; privateKey: string } => {
  const pubB32 = toBase32(getSecureRandom(32));
  const prvB32 = toBase32(getSecureRandom(64));
  return { publicKey: `qbs1q${pubB32.substring(0, 58)}`, privateKey: `LATTICE-PRV-${prvB32.substring(0, 64)}` };
};

export const generateSalt = (): string => Array.from(getSecureRandom(32)).map(b => b.toString(16).padStart(2, '0')).join('');

export const hashSecret = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + LATTICE_PEPPER);
  const saltData = encoder.encode(salt);
  const baseKey = await crypto.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
  const derivedKeyBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltData, iterations: 100000, hash: 'SHA-512' }, baseKey, 512);
  return Array.from(new Uint8Array(derivedKeyBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const sanitizeInput = (input: string): string => input?.replace(/[<>]/g, '').trim() || '';

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: 'address' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => { 
      console.error('IndexedDB Error:', e);
      dbPromise = null; 
      reject('Vault Access Failed'); 
    };
  });
  return dbPromise;
};

export const initLatticeRegistry = async (): Promise<void> => {
  try {
    // FIX: Check for ADMIN_ID address directly. 
    // Checking by 'username' caused resets if the admin changed their alias.
    const genesisCheck = await getUserObject(ADMIN_ID);
    
    if (!genesisCheck) {
      console.log("Initializing Genesis Node Registry...");
      const salt = generateSalt();
      // Generate random genesis password for security
      const genesisPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const passwordHash = await hashSecret(genesisPassword, salt);
      
      const ADJECTIVES = ["Non-local", "Supersymmetric", "Entropy-bound", "Asymptotic", "Coherent", "Topological", "Relativistic", "Quantized", "Emergent", "Holographic"];
      const NOUNS = ["Singularity", "Metric", "Field", "Lattice", "Boson", "Tachyon", "Flux", "Wavefunction", "Manifold", "Tensor"];
      const FRONTIERS = ["Calabi-Yau Compactification", "Schwinger Effect Verification", "Majorana Fermion Stability", "Dark Energy Scalar Coupling", "Yang-Mills Existence Gap", "Riemannian Manifold Curvature", "Hawking Radiation Information Preservation", "Penrose Tiling Quasicrystals", "Landau Level Transitions", "Bose-Einstein Condensate Turbulence"];

      const genesisBlocks: SolvedBlock[] = [];
      for (let i = 1; i <= 1000; i++) {
        const tokenId = Math.floor((i - 1) / QBS_UNITS.SHD) + 1;
        const shardIdInToken = ((i - 1) % QBS_UNITS.SHD) + 1;
        const master = getMasterBreakthrough(tokenId);
        
        const adj = ADJECTIVES[i % ADJECTIVES.length];
        const noun = NOUNS[i % NOUNS.length];
        const frontier = FRONTIERS[i % FRONTIERS.length];
        
        const problem = `Scientific Resolution ${i}: Mapping the ${adj} variance across the ${noun} manifold. Initial observations suggest a parity breach during the ${master} phase. Analysis required for ${frontier} stability.`;
        const explanation = `Success: Through recursive ${adj} field mapping, we have stabilized the ${noun} flux. This resolution provides the mathematical certainty required for ${frontier}, proving that the ${adj} constants are invariant under the Sovereign Lattice. SHA-256 integrity confirmed.`;

        genesisBlocks.push({
          id: `GENESIS-SHD-${i.toString().padStart(4, '0')}`,
          shardId: `SHD-G-${i}`,
          shardIndex: i,
          shardParentId: `SHD-${shardIdInToken}`,
          tokenParentId: `QBS-${tokenId}`,
          totalShardsPerToken: 1000,
          timestamp: new Date().toLocaleString(),
          problem,
          answer: `SIG_VAL_${i.toString(16).toUpperCase()}`,
          explanation,
          reward: 1.0, 
          payoutPerShard: "$1,000,000.00",
          difficulty: "MAX_GENESIS_RESOLUTION",
          hash: `00000000000000${Math.random().toString(16).slice(2)}`,
          parentHash: i === 1 ? "0".repeat(64) : genesisBlocks[i-2].hash,
          integrityHash: `ROOT_${i}`,
          isPeerReviewed: true,
          advancementLevel: 1,
          advancementHistory: [],
          grade: 'S',
          breakthroughScore: 99
        });
      }

      const genesisUser: User = {
        address: ADMIN_ID,
        publicKey: ADMIN_ID,
        privateKey: "LATTICE-PRV-GENESIS-MASTER",
        profileId: "GENESIS#0001",
        mnemonic: "photon photon photon hadron hadron hadron",
        username: "Genesis",
        passwordHash,
        password: genesisPassword,
        salt,
        securityCode: "00000",
        role: 'admin',
        balance: 1000.0,
        usdBalance: 1000000000,
        contacts: [],
        transactions: [{
          id: "TX-GENESIS-ALLOC-1K",
          timestamp: new Date().toLocaleString(),
          type: 'CREDIT',
          amount: "1000",
          unit: 'QBS',
          description: "Genesis Magnitude Allocation (1,000 Detailed Breakthroughs)"
        }],
        incidents: [],
        solvedBlocks: genesisBlocks,
        ownedNfts: [],
        shardsTowardNextQBS: 0,
        messagingActive: true,
        miningActive: true,
        xp: 250000,
        level: 30,
        tagline: "The First Observer",
        bio: "Master Node for the Sovereign Lattice. Architect of the 10,000 breakthrough cap. Observing the resolution of 1,000 primary shards of the universe."
    
    if (!genesisCheck) {
      console.log("Initializing Sovereign Lattice Platform...");
      console.log("Platform ready for user registration.");
    }
  } catch (err) {
    console.error("Registry Initialization Failed:", err);
  }
};

export const saveUser = async (user: User): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_USERS, 'readwrite');
    const store = transaction.objectStore(STORE_USERS);
    const request = store.put(user);
    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => {
      console.error('saveUser Error:', e);
      reject('DB_WRITE_FAIL');
    };
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_USERS, 'readonly');
    const store = transaction.objectStore(STORE_USERS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      console.error('getAllUsers Error:', e);
      reject('DB_READ_FAIL');
    };
  });
};

export const getUserObject = async (address: string): Promise<User | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_USERS, 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.get(address);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

export const getUserByIdentifier = async (identifier: string): Promise<User | null> => {
  const users = await getAllUsers();
  const searchLower = identifier.toLowerCase();
  return users.find(u => 
    u.username.toLowerCase() === searchLower || 
    u.address === identifier || 
    u.profileId.toLowerCase() === searchLower
  ) || null;
};

export const getUserByMnemonic = async (mnemonic: string): Promise<User | null> => {
  const users = await getAllUsers();
  return users.find(u => u.mnemonic?.toLowerCase().trim() === mnemonic.toLowerCase().trim()) || null;
};

/**
 * Clear all discoveries (solved blocks) from a user's profile
 */
export const clearUserDiscoveries = async (userAddress: string): Promise<boolean> => {
  try {
    const user = await getUserObject(userAddress);
    if (!user) {
      console.error('User not found:', userAddress);
      return false;
    }

    // Clear all solved blocks and reset related stats
    const updatedUser: User = {
      ...user,
      solvedBlocks: [], // Clear all discoveries
      // Optionally reset related stats (uncomment if desired)
      // balance: 0,
      // usdBalance: 0,
      // xp: 0,
      // level: 1,
      // transactions: user.transactions.filter(t => t.type !== 'CREDIT' || !t.description.includes('Shard')),
    };

    await saveUser(updatedUser);
    console.log(`Cleared ${user.solvedBlocks?.length || 0} discoveries for user: ${user.username}`);
    return true;
  } catch (error) {
    console.error('Failed to clear user discoveries:', error);
    return false;
  }
};

/**
 * Clear all discoveries from the current active user
 */
export const clearCurrentUserDiscoveries = async (): Promise<boolean> => {
  try {
    const activeAddr = localStorage.getItem('LATTICE_ACTIVE_ADDR');
    if (!activeAddr) {
      console.error('No active user found');
      return false;
    }

    return await clearUserDiscoveries(activeAddr);
  } catch (error) {
    console.error('Failed to clear current user discoveries:', error);
    return false;
  }
};
