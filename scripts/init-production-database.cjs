#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * Creates persistent file-based database for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Initializing production database with persistent storage...');

// Database configuration
const DB_CONFIG = {
  name: 'SovereignLattice_Production_v1',
  version: 1,
  persistent: true,
  backupEnabled: true,
  encryptionEnabled: true
};

// Founder credentials (matching the Auth component expectations)
const FOUNDER_CREDENTIALS = {
  username: 'Freedom24/7365',
  password: 'LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU',
  securityCode: '77777',
  profileId: 'founder_freedom247365',
  displayName: 'Founder - Freedom24/7365'
};

async function initializeProductionDatabase() {
  try {
    // Create directory structure
    const dataDir = path.join(process.cwd(), 'data');
    const usersDir = path.join(dataDir, 'users');
    const profilesDir = path.join(dataDir, 'profiles');
    const credentialsDir = path.join(dataDir, 'credentials');
    const transactionsDir = path.join(dataDir, 'transactions');
    const backupsDir = path.join(dataDir, 'backups');
    const logsDir = path.join(process.cwd(), 'logs');

    // Ensure all directories exist
    [dataDir, usersDir, profilesDir, credentialsDir, transactionsDir, backupsDir, logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${path.relative(process.cwd(), dir)}`);
      }
    });

    // Initialize database metadata
    const dbMetadata = {
      ...DB_CONFIG,
      initialized: new Date().toISOString(),
      lastBackup: null,
      userCount: 0,
      transactionCount: 0
    };

    const metadataPath = path.join(dataDir, 'db-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(dbMetadata, null, 2));
    console.log('✅ Database metadata initialized');

    // Create founder profile with proper authentication
    await createFounderProfile(dataDir);

    // Initialize user registry
    const userRegistry = {
      users: [FOUNDER_CREDENTIALS.profileId],
      totalUsers: 1,
      lastUpdated: new Date().toISOString()
    };

    const registryPath = path.join(dataDir, 'user-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(userRegistry, null, 2));
    console.log('✅ User registry initialized');

    // Create database access layer configuration
    const dbAccessConfig = {
      type: 'file-based',
      dataDirectory: dataDir,
      collections: {
        users: usersDir,
        profiles: profilesDir,
        credentials: credentialsDir,
        transactions: transactionsDir,
        backups: backupsDir
      },
      indexedDB: {
        fallback: true,
        name: 'QuantumSecureLattice_v8',
        version: 1
      }
    };

    const accessConfigPath = path.join(dataDir, 'db-access-config.json');
    fs.writeFileSync(accessConfigPath, JSON.stringify(dbAccessConfig, null, 2));
    console.log('✅ Database access configuration created');

    // Update environment configuration
    updateEnvironmentConfig();

    console.log('🎉 Production database initialization completed successfully');
    console.log(`👑 Founder profile: ${FOUNDER_CREDENTIALS.username}`);
    console.log(`🔐 Security code: ${FOUNDER_CREDENTIALS.securityCode}`);
    console.log(`💰 Initial QBS balance: 1000`);
    
    return true;
  } catch (error) {
    console.error('❌ Production database initialization failed:', error.message);
    process.exit(1);
  }
}

async function createFounderProfile(dataDir) {
  try {
    // Generate secure salt and hash password
    const salt = crypto.randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(FOUNDER_CREDENTIALS.password, salt);

    // Create founder user object (compatible with existing Auth component)
    const founderUser = {
      // Identity
      address: generateAddress(),
      publicKey: generatePublicKey(),
      privateKey: generatePrivateKey(),
      profileId: FOUNDER_CREDENTIALS.profileId,
      username: FOUNDER_CREDENTIALS.username,
      
      // Authentication
      passwordHash: passwordHash,
      password: FOUNDER_CREDENTIALS.password, // Stored for compatibility
      salt: salt,
      securityCode: FOUNDER_CREDENTIALS.securityCode,
      
      // Profile data
      role: 'admin',
      balance: 1000.0,
      usdBalance: 1000000,
      
      // Generated data
      mnemonic: generateMnemonic(),
      
      // Collections
      contacts: [],
      transactions: [{
        id: "TX-FOUNDER-INIT-1000",
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        amount: "1000",
        unit: 'QBS',
        description: "Founder Initial Allocation - Platform Owner"
      }],
      incidents: [],
      solvedBlocks: [],
      ownedNfts: [],
      
      // Stats
      shardsTowardNextQBS: 0,
      messagingActive: true,
      miningActive: true,
      xp: 100000,
      level: 50,
      
      // Profile info
      tagline: "Platform Founder & Owner",
      bio: "Founder and owner of the Sovereign Lattice quantum cryptocurrency platform. Master of 1000 QBS tokens.",
      
      // Metadata
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      isLocked: false,
      isFounder: true,
      verified: true
    };

    // Save founder user to users collection
    const userPath = path.join(dataDir, 'users', `${founderUser.address}.json`);
    fs.writeFileSync(userPath, JSON.stringify(founderUser, null, 2));

    // Create profile-specific data structure
    const founderProfile = {
      profileId: FOUNDER_CREDENTIALS.profileId,
      username: FOUNDER_CREDENTIALS.username,
      displayName: FOUNDER_CREDENTIALS.displayName,
      securityLevel: 'SECRET',
      encryptionConfig: {
        algorithm: 'AES-GCM',
        keyLength: 256,
        rotationInterval: 30,
        backupEncryption: true
      },
      qbsBalance: 1000,
      permissions: ['admin', 'founder', 'all_access'],
      isFounder: true,
      isAdmin: true,
      verified: true,
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      isLocked: false
    };

    // Save founder profile
    const profilePath = path.join(dataDir, 'profiles', `${FOUNDER_CREDENTIALS.profileId}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(founderProfile, null, 2));

    // Create authentication credentials
    const founderCredentials = {
      profileId: FOUNDER_CREDENTIALS.profileId,
      username: FOUNDER_CREDENTIALS.username,
      passwordHash: passwordHash,
      salt: salt,
      securityCode: FOUNDER_CREDENTIALS.securityCode,
      passwordHistory: [passwordHash],
      mfaEnabled: false,
      biometricEnabled: false,
      trustedDevices: [],
      lastPasswordChange: new Date().toISOString(),
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    // Save founder credentials
    const credentialsPath = path.join(dataDir, 'credentials', `${FOUNDER_CREDENTIALS.profileId}.json`);
    fs.writeFileSync(credentialsPath, JSON.stringify(founderCredentials, null, 2));

    console.log('✅ Founder profile created successfully');
    console.log(`   Username: ${FOUNDER_CREDENTIALS.username}`);
    console.log(`   Profile ID: ${FOUNDER_CREDENTIALS.profileId}`);
    console.log(`   Security Code: ${FOUNDER_CREDENTIALS.securityCode}`);
    console.log(`   QBS Balance: 1000`);

  } catch (error) {
    console.error('❌ Failed to create founder profile:', error);
    throw error;
  }
}

function updateEnvironmentConfig() {
  const envConfig = {
    NODE_ENV: 'production',
    DATABASE_PERSISTENT: 'true',
    BACKUP_ENABLED: 'true',
    DATA_DIRECTORY: './data',
    LOGS_DIRECTORY: './logs',
    DB_TYPE: 'file-based',
    FOUNDER_INITIALIZED: 'true'
  };

  // Write .env file
  const envPath = path.join(process.cwd(), '.env.production');
  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Production environment configuration created');
}

// Helper functions
async function hashPassword(password, salt) {
  const LATTICE_PEPPER = "k7$!v9QzP@m3L#r8_Quantum_Sovereign_999";
  const iterations = 100000;
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password + LATTICE_PEPPER, salt, iterations, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

function generateAddress() {
  const randomBytes = crypto.randomBytes(20);
  return '0x' + randomBytes.toString('hex');
}

function generatePublicKey() {
  const randomBytes = crypto.randomBytes(32);
  return 'qbs1q' + randomBytes.toString('hex').substring(0, 58);
}

function generatePrivateKey() {
  const randomBytes = crypto.randomBytes(32);
  return 'LATTICE-PRV-' + randomBytes.toString('hex').substring(0, 64);
}

function generateMnemonic() {
  const SCI_WORDS = [
    "photon", "hadron", "muon", "gravity", "boson", "qubit", "flux", "energy", "matrix", "vector", "scalar", "tensor",
    "quark", "gluon", "parity", "symmetry", "vacuum", "void", "space", "time", "chaos", "logic", "proof", "axiom"
  ];
  
  const words = [];
  for (let i = 0; i < 24; i++) {
    const randomIndex = crypto.randomInt(0, SCI_WORDS.length);
    words.push(SCI_WORDS[randomIndex]);
  }
  
  return words.join(' ');
}

// Run initialization
initializeProductionDatabase();