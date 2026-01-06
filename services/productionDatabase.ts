/**
 * Production Database Service
 * Handles both file-based storage (Node.js/production) and IndexedDB (browser)
 */

import { User } from '../types';

// Database configuration
const DB_CONFIG = {
  name: 'SovereignLattice_Production_v1',
  version: 1,
  indexedDBName: 'QuantumSecureLattice_v8',
  indexedDBVersion: 1
};

// Check if we're in a Node.js environment
const isNodeEnvironment = typeof window === 'undefined' || typeof process !== 'undefined' && process.versions?.node;

/**
 * Production Database Manager
 * Automatically uses file-based storage in Node.js and IndexedDB in browsers
 */
export class ProductionDatabaseManager {
  private isInitialized = false;
  private dbType: 'file' | 'indexeddb' = 'indexeddb';
  private indexedDB: IDBDatabase | null = null;
  private dataDirectory: string | null = null;

  constructor() {
    this.dbType = isNodeEnvironment ? 'file' : 'indexeddb';
  }

  /**
   * Initialize the database
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (this.dbType === 'file') {
        await this.initializeFileDatabase();
      } else {
        await this.initializeIndexedDB();
      }
      
      this.isInitialized = true;
      console.log(`Production database initialized (${this.dbType})`);
    } catch (error) {
      console.error('Failed to initialize production database:', error);
      throw error;
    }
  }

  /**
   * Initialize file-based database (Node.js/production)
   */
  private async initializeFileDatabase(): Promise<void> {
    if (typeof require === 'undefined') {
      throw new Error('File system not available in browser environment');
    }

    const fs = require('fs');
    const path = require('path');

    // Set data directory
    this.dataDirectory = path.join(process.cwd(), 'data');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }

    // Ensure users directory exists
    const usersDir = path.join(this.dataDirectory, 'users');
    if (!fs.existsSync(usersDir)) {
      fs.mkdirSync(usersDir, { recursive: true });
    }

    console.log('File-based database initialized at:', this.dataDirectory);
  }

  /**
   * Initialize IndexedDB (browser)
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.indexedDBName, DB_CONFIG.indexedDBVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create users object store if it doesn't exist
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'address' });
          store.createIndex('username', 'username', { unique: false });
          store.createIndex('profileId', 'profileId', { unique: false });
        }
      };
    });
  }

  /**
   * Save user to database
   */
  public async saveUser(user: User): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'file') {
      await this.saveUserToFile(user);
    } else {
      await this.saveUserToIndexedDB(user);
    }
  }

  /**
   * Get user by address
   */
  public async getUserByAddress(address: string): Promise<User | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'file') {
      return await this.getUserFromFile(address);
    } else {
      return await this.getUserFromIndexedDB(address);
    }
  }

  /**
   * Get user by identifier (username, address, or profileId)
   */
  public async getUserByIdentifier(identifier: string): Promise<User | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'file') {
      return await this.getUserByIdentifierFromFile(identifier);
    } else {
      return await this.getUserByIdentifierFromIndexedDB(identifier);
    }
  }

  /**
   * Get all users
   */
  public async getAllUsers(): Promise<User[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'file') {
      return await this.getAllUsersFromFile();
    } else {
      return await this.getAllUsersFromIndexedDB();
    }
  }

  /**
   * Get user by mnemonic
   */
  public async getUserByMnemonic(mnemonic: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.mnemonic?.toLowerCase().trim() === mnemonic.toLowerCase().trim()) || null;
  }

  // File-based storage methods

  private async saveUserToFile(user: User): Promise<void> {
    if (!this.dataDirectory) {
      throw new Error('Data directory not initialized');
    }

    const fs = require('fs');
    const path = require('path');

    const userPath = path.join(this.dataDirectory, 'users', `${user.address}.json`);
    fs.writeFileSync(userPath, JSON.stringify(user, null, 2));
  }

  private async getUserFromFile(address: string): Promise<User | null> {
    if (!this.dataDirectory) {
      throw new Error('Data directory not initialized');
    }

    const fs = require('fs');
    const path = require('path');

    const userPath = path.join(this.dataDirectory, 'users', `${address}.json`);
    
    try {
      if (fs.existsSync(userPath)) {
        const userData = fs.readFileSync(userPath, 'utf8');
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error reading user file:', error);
    }
    
    return null;
  }

  private async getUserByIdentifierFromFile(identifier: string): Promise<User | null> {
    const users = await this.getAllUsersFromFile();
    const searchLower = identifier.toLowerCase();
    
    return users.find(u => 
      u.username.toLowerCase() === searchLower || 
      u.address === identifier || 
      u.profileId?.toLowerCase() === searchLower
    ) || null;
  }

  private async getAllUsersFromFile(): Promise<User[]> {
    if (!this.dataDirectory) {
      throw new Error('Data directory not initialized');
    }

    const fs = require('fs');
    const path = require('path');

    const usersDir = path.join(this.dataDirectory, 'users');
    const users: User[] = [];

    try {
      if (fs.existsSync(usersDir)) {
        const files = fs.readdirSync(usersDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(usersDir, file);
              const userData = fs.readFileSync(filePath, 'utf8');
              const user = JSON.parse(userData);
              users.push(user);
            } catch (error) {
              console.error(`Error reading user file ${file}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading users directory:', error);
    }

    return users;
  }

  // IndexedDB methods

  private async saveUserToIndexedDB(user: User): Promise<void> {
    if (!this.indexedDB) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async getUserFromIndexedDB(address: string): Promise<User | null> {
    if (!this.indexedDB) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(address);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getUserByIdentifierFromIndexedDB(identifier: string): Promise<User | null> {
    const users = await this.getAllUsersFromIndexedDB();
    const searchLower = identifier.toLowerCase();
    
    return users.find(u => 
      u.username.toLowerCase() === searchLower || 
      u.address === identifier || 
      u.profileId?.toLowerCase() === searchLower
    ) || null;
  }

  private async getAllUsersFromIndexedDB(): Promise<User[]> {
    if (!this.indexedDB) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Initialize founder profile if it doesn't exist
   */
  public async initializeFounderProfile(): Promise<void> {
    try {
      // Check if founder already exists
      const founderCheck = await this.getUserByIdentifier("Freedom24/7365");
      
      if (!founderCheck) {
        console.log("Initializing Sovereign Lattice Platform...");
        
        // Create founder profile with proper credentials
        const founderUser: User = {
          address: "0x" + Math.random().toString(16).substring(2, 42).padStart(40, '0'),
          publicKey: "FOUNDER-PUB-" + Math.random().toString(36).substring(2, 15).toUpperCase(),
          privateKey: "FOUNDER-PRV-" + Math.random().toString(36).substring(2, 15).toUpperCase(),
          profileId: "founder_freedom247365",
          mnemonic: "freedom lattice quantum breakthrough discovery innovation research science technology future progress",
          username: "Freedom24/7365",
          passwordHash: await this.hashPassword("LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU", "founder-salt"),
          password: "LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU",
          salt: "founder-salt",
          securityCode: "77777",
          role: 'admin',
          balance: 1000.0,
          usdBalance: 1000000,
          contacts: [],
          transactions: [{
            id: "TX-FOUNDER-INIT-1000",
            timestamp: new Date().toLocaleString(),
            type: 'CREDIT',
            amount: "1000",
            unit: 'QBS',
            description: "Founder Initial Allocation - Platform Owner"
          }],
          incidents: [],
          solvedBlocks: [],
          ownedNfts: [],
          shardsTowardNextQBS: 0,
          messagingActive: true,
          miningActive: true,
          xp: 100000,
          level: 50,
          tagline: "Platform Founder & Owner",
          bio: "Founder and owner of the Sovereign Lattice quantum cryptocurrency platform. Master of 1000 QBS tokens."
        };
        
        await this.saveUser(founderUser);
        
        console.log("Sovereign Lattice Platform Initialized.");
        console.log("Founder account created: Freedom24/7365");
        console.log("Balance: 1000 QBS tokens");
      }
    } catch (err) {
      console.error("Registry Initialization Failed:", err);
    }
  }

  /**
   * Simple password hashing (for compatibility)
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    const LATTICE_PEPPER = "k7$!v9QzP@m3L#r8_Quantum_Sovereign_999";
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Browser environment
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + LATTICE_PEPPER);
      const saltData = encoder.encode(salt);
      const baseKey = await crypto.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveBits']);
      const derivedKeyBuffer = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltData, iterations: 100000, hash: 'SHA-512' }, 
        baseKey, 
        512
      );
      return Array.from(new Uint8Array(derivedKeyBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Node.js environment
      const crypto = require('crypto');
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password + LATTICE_PEPPER, salt, 100000, 64, 'sha512', (err: any, derivedKey: any) => {
          if (err) reject(err);
          else resolve(derivedKey.toString('hex'));
        });
      });
    }
  }
}

// Singleton instance
export const productionDB = new ProductionDatabaseManager();