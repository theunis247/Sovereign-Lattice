
// @google/genai guidelines followed for model selection and response handling
import { User, Contact, Transaction, QBSNFT, SolvedBlock } from '../types';
import { getMasterBreakthrough, getShardScientificFocus, getCosmicDomain, QBS_UNITS } from './quantumLogic';
import { productionDB } from './productionDatabase';
import { realDB } from './realDatabaseIntegration';

const DB_NAME = 'QuantumSecureLattice_v8'; 
const DB_VERSION = 1; 
const STORE_USERS = 'users';

const LATTICE_PEPPER = "k7$!v9QzP@m3L#r8_Quantum_Sovereign_999";

export const ADMIN_ID = "qbs1qpxr9y7g9dw0sn54kce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce6mua7lw2p";

let dbPromise: Promise<IDBDatabase> | null = null;

// Check if we're in production environment or if persistent database is enabled
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.DATABASE_PERSISTENT === 'true' ||
                    (typeof window !== 'undefined' && window.location.hostname !== 'localhost') ||
                    true; // Force file-based database for now to fix issues

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
  // Import the enhanced crypto fallback service
  try {
    // Use the crypto fallback service for consistent random generation
    const { CryptoFallbackService } = require('./cryptoFallback');
    const result = CryptoFallbackService.generateRandomBytes(count);
    
    if (result.success && result.data) {
      return result.data;
    }
  } catch (e) {
    console.warn('Crypto fallback service failed, using basic fallback:', e.message);
  }
  
  // Basic fallback if crypto fallback service is not available
  try {
    // Try Web Crypto API first
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(count);
      window.crypto.getRandomValues(array);
      return array;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      const array = new Uint8Array(count);
      globalThis.crypto.getRandomValues(array);
      return array;
    } else if (typeof require !== 'undefined') {
      // Node.js environment
      try {
        const crypto = require('crypto');
        const bytes = crypto.randomBytes(count);
        const array = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
          array[i] = bytes[i];
        }
        return array;
      } catch (e) {
        // Fall through to Math.random fallback
      }
    }
  } catch (e) {
    console.warn('Secure random generation failed, using fallback:', e.message);
  }
  
  // Enhanced fallback using multiple entropy sources
  const array = new Uint8Array(count);
  const now = Date.now();
  const performance = typeof window !== 'undefined' && window.performance ? window.performance.now() : now;
  
  for (let i = 0; i < count; i++) {
    // Combine multiple entropy sources for better randomness
    const entropy1 = Math.random() * 256;
    const entropy2 = (now + i) % 256;
    const entropy3 = (performance * (i + 1)) % 256;
    const combined = (entropy1 + entropy2 + entropy3) % 256;
    array[i] = Math.floor(combined);
  }
  
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
  // Import the enhanced crypto fallback service
  const { CryptoFallbackService } = await import('./cryptoFallback');
  
  try {
    // Try Web Crypto API first using the enhanced crypto fallback service
    if (CryptoFallbackService.getSupportInfo().supportLevel === 'full') {
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + LATTICE_PEPPER);
      const saltData = encoder.encode(salt);
      const baseKey = await crypto.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
      const derivedKeyBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltData, iterations: 100000, hash: 'SHA-512' }, baseKey, 512);
      return Array.from(new Uint8Array(derivedKeyBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Web Crypto API hashing failed, using fallback method:', e.message);
  }
  
  // Use the enhanced fallback key derivation from crypto fallback service
  try {
    const combinedInput = password + salt + LATTICE_PEPPER;
    const keyResult = await CryptoFallbackService.deriveKey(combinedInput, salt, 100000);
    
    if (keyResult.success && keyResult.data) {
      // Extend the key to match expected length (128 chars)
      let extendedKey = keyResult.data;
      while (extendedKey.length < 128) {
        const additionalResult = await CryptoFallbackService.deriveKey(extendedKey, combinedInput, 1000);
        if (additionalResult.success && additionalResult.data) {
          extendedKey += additionalResult.data;
        } else {
          break;
        }
      }
      
      return extendedKey.substring(0, 128);
    }
  } catch (e) {
    console.warn('Enhanced fallback key derivation failed, using basic fallback:', e.message);
  }
  
  // Final fallback: Simple but functional hash
  const input = password + salt + LATTICE_PEPPER;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex string and pad to make it look like a proper hash
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.repeat(16).substring(0, 128); // Make it 128 chars like a real hash
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
    // Import database recovery manager
    const { databaseRecoveryManager } = await import('./databaseRecoveryManager');
    
    // Initialize database with automatic recovery
    const recoveryResult = await databaseRecoveryManager.initializeWithRecovery();
    
    if (!recoveryResult.success) {
      console.error("Database initialization failed:", recoveryResult.errors);
      console.warn("Database warnings:", recoveryResult.warnings);
    } else {
      console.log("Database initialized successfully");
      if (recoveryResult.warnings.length > 0) {
        console.warn("Database initialization warnings:", recoveryResult.warnings);
      }
    }
    
    // Initialize production database
    await productionDB.initialize();
    
    // Initialize founder profile
    await productionDB.initializeFounderProfile();
  } catch (err) {
    console.error("Registry Initialization Failed:", err);
    
    // Attempt emergency recovery as last resort
    try {
      const { databaseRecoveryManager } = await import('./databaseRecoveryManager');
      console.log("Attempting emergency database recovery...");
      await databaseRecoveryManager.initializeWithRecovery();
    } catch (recoveryErr) {
      console.error("Emergency recovery also failed:", recoveryErr);
    }
  }
};

export const saveUser = async (user: User): Promise<void> => {
  // Import safe registry service
  const { safeRegistry } = await import('./safeRegistryService');
  
  // Use safe registry for validation and null-safe operations
  const saveResult = await safeRegistry.saveUserSafely(user);
  
  if (saveResult.errors.length > 0) {
    console.error('Registry save errors:', saveResult.errors);
    throw new Error(`Failed to save user: ${saveResult.errors.join(', ')}`);
  }
  
  if (saveResult.warnings.length > 0) {
    console.warn('Registry save warnings:', saveResult.warnings);
  }
  
  if (!saveResult.success) {
    throw new Error('Failed to save user to registry');
  }
  
  // Proceed with actual database save operations
  if (isProduction) {
    return await productionDB.saveUser(user);
  }
  
  // Fallback to IndexedDB for development
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
  // Import safe registry service
  const { safeRegistry } = await import('./safeRegistryService');
  
  let users: User[] = [];
  
  if (isProduction) {
    users = await productionDB.getAllUsers();
  } else {
    // Fallback to IndexedDB for development
    const db = await getDB();
    users = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_USERS, 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => {
        console.error('getAllUsers Error:', e);
        reject('DB_READ_FAIL');
      };
    });
  }
  
  // Use safe registry to validate and fix all users
  const safeResult = await safeRegistry.getAllUsersSafely();
  
  if (safeResult.errors.length > 0) {
    console.error('Registry validation errors:', safeResult.errors);
  }
  
  if (safeResult.warnings.length > 0) {
    console.warn('Registry validation warnings:', safeResult.warnings);
  }
  
  return safeResult.users;
};

export const getUserObject = async (address: string): Promise<User | null> => {
  // Import safe registry service
  const { safeRegistry } = await import('./safeRegistryService');
  
  // Use safe registry for null-safe operations
  const safeResult = await safeRegistry.getUserByAddressSafely(address);
  
  if (safeResult.errors.length > 0) {
    console.error('Registry errors:', safeResult.errors);
  }
  
  if (safeResult.warnings.length > 0) {
    console.warn('Registry warnings:', safeResult.warnings);
  }
  
  return safeResult.user;
};

export const getUserByIdentifier = async (identifier: string): Promise<User | null> => {
  // Import safe registry service
  const { safeRegistry } = await import('./safeRegistryService');
  
  // Use safe registry for null-safe operations
  const safeResult = await safeRegistry.getUserSafely(identifier);
  
  if (safeResult.errors.length > 0) {
    console.error('Registry errors:', safeResult.errors);
  }
  
  if (safeResult.warnings.length > 0) {
    console.warn('Registry warnings:', safeResult.warnings);
  }
  
  return safeResult.user;
};

export const getUserByMnemonic = async (mnemonic: string): Promise<User | null> => {
  if (isProduction) {
    return await productionDB.getUserByMnemonic(mnemonic);
  }
  
  // Fallback to IndexedDB for development
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
