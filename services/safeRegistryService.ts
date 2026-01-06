/**
 * Safe Registry Service
 * Provides null-safe operations for user registry with defensive programming patterns
 */

import { User, Contact, Transaction, SecurityIncident, SolvedBlock, QBSNFT } from '../types';
import { getUserByIdentifier, getUserObject, saveUser, getAllUsers } from './db';

export interface SafeUserData {
  user: User | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RegistryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedFields: string[];
}

/**
 * Safe Registry Service
 * Provides null-safe operations with automatic data structure initialization
 */
export class SafeRegistryService {
  private static instance: SafeRegistryService;
  
  public static getInstance(): SafeRegistryService {
    if (!SafeRegistryService.instance) {
      SafeRegistryService.instance = new SafeRegistryService();
    }
    return SafeRegistryService.instance;
  }

  /**
   * Safely get user by identifier with null-safe operations
   */
  public async getUserSafely(identifier: string): Promise<SafeUserData> {
    const result: SafeUserData = {
      user: null,
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      // Validate input
      if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
        result.errors.push('Invalid identifier provided');
        return result;
      }

      const sanitizedIdentifier = identifier.trim();
      
      // Attempt to get user with error handling
      let user: User | null = null;
      
      try {
        user = await getUserByIdentifier(sanitizedIdentifier);
      } catch (error) {
        result.errors.push(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
      }

      if (!user) {
        result.warnings.push('User not found');
        return result;
      }

      // Validate and fix user data structure
      const validationResult = this.validateAndFixUserStructure(user);
      
      if (validationResult.fixedFields.length > 0) {
        result.warnings.push(`Fixed missing fields: ${validationResult.fixedFields.join(', ')}`);
        
        // Save the fixed user data
        try {
          await saveUser(user);
        } catch (error) {
          result.warnings.push('Failed to save fixed user data');
        }
      }

      result.user = user;
      result.isValid = validationResult.isValid;
      result.errors = validationResult.errors;
      result.warnings = [...result.warnings, ...validationResult.warnings];

      return result;
    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Safely get user by address with null-safe operations
   */
  public async getUserByAddressSafely(address: string): Promise<SafeUserData> {
    const result: SafeUserData = {
      user: null,
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      // Validate input
      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        result.errors.push('Invalid address provided');
        return result;
      }

      const sanitizedAddress = address.trim();
      
      // Attempt to get user with error handling
      let user: User | null = null;
      
      try {
        user = await getUserObject(sanitizedAddress);
      } catch (error) {
        result.errors.push(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
      }

      if (!user) {
        result.warnings.push('User not found');
        return result;
      }

      // Validate and fix user data structure
      const validationResult = this.validateAndFixUserStructure(user);
      
      if (validationResult.fixedFields.length > 0) {
        result.warnings.push(`Fixed missing fields: ${validationResult.fixedFields.join(', ')}`);
        
        // Save the fixed user data
        try {
          await saveUser(user);
        } catch (error) {
          result.warnings.push('Failed to save fixed user data');
        }
      }

      result.user = user;
      result.isValid = validationResult.isValid;
      result.errors = validationResult.errors;
      result.warnings = [...result.warnings, ...validationResult.warnings];

      return result;
    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Safely save user with validation and error handling
   */
  public async saveUserSafely(user: User): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const result = {
      success: false,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Validate input
      if (!user || typeof user !== 'object') {
        result.errors.push('Invalid user object provided');
        return result;
      }

      // Validate and fix user structure
      const validationResult = this.validateAndFixUserStructure(user);
      
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        result.errors = validationResult.errors;
        return result;
      }

      if (validationResult.fixedFields.length > 0) {
        result.warnings.push(`Fixed missing fields: ${validationResult.fixedFields.join(', ')}`);
      }

      result.warnings = [...result.warnings, ...validationResult.warnings];

      // Attempt to save user
      try {
        await saveUser(user);
        result.success = true;
      } catch (error) {
        result.errors.push(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Safely get all users with error handling
   */
  public async getAllUsersSafely(): Promise<{ users: User[]; errors: string[]; warnings: string[] }> {
    const result = {
      users: [] as User[],
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      let users: User[] = [];
      
      try {
        users = await getAllUsers();
      } catch (error) {
        result.errors.push(`Failed to retrieve users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
      }

      // Validate and fix each user's data structure
      const validUsers: User[] = [];
      let totalFixedFields = 0;

      for (const user of users) {
        if (!user || typeof user !== 'object') {
          result.warnings.push('Skipped invalid user object');
          continue;
        }

        const validationResult = this.validateAndFixUserStructure(user);
        
        if (validationResult.isValid || validationResult.fixedFields.length > 0) {
          validUsers.push(user);
          totalFixedFields += validationResult.fixedFields.length;
          
          // Save fixed user data if needed
          if (validationResult.fixedFields.length > 0) {
            try {
              await saveUser(user);
            } catch (error) {
              result.warnings.push(`Failed to save fixed user data for ${user.username || 'unknown'}`);
            }
          }
        } else {
          result.warnings.push(`Skipped invalid user: ${user.username || 'unknown'}`);
        }
      }

      if (totalFixedFields > 0) {
        result.warnings.push(`Fixed ${totalFixedFields} missing fields across ${validUsers.length} users`);
      }

      result.users = validUsers;
      return result;
    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Validate and fix user data structure with defensive programming
   */
  public validateAndFixUserStructure(user: User): RegistryValidationResult {
    const result: RegistryValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixedFields: []
    };

    try {
      // Check required fields
      const requiredFields = ['address', 'username', 'passwordHash', 'salt'];
      for (const field of requiredFields) {
        if (!user[field as keyof User] || typeof user[field as keyof User] !== 'string') {
          result.errors.push(`Missing or invalid required field: ${field}`);
          result.isValid = false;
        }
      }

      // Initialize missing array fields with safe defaults
      if (!Array.isArray(user.contacts)) {
        user.contacts = [];
        result.fixedFields.push('contacts');
      }

      if (!Array.isArray(user.transactions)) {
        user.transactions = [];
        result.fixedFields.push('transactions');
      }

      if (!Array.isArray(user.incidents)) {
        user.incidents = [];
        result.fixedFields.push('incidents');
      }

      if (!Array.isArray(user.solvedBlocks)) {
        user.solvedBlocks = [];
        result.fixedFields.push('solvedBlocks');
      }

      if (!Array.isArray(user.ownedNfts)) {
        user.ownedNfts = [];
        result.fixedFields.push('ownedNfts');
      }

      if (!Array.isArray(user.milestones)) {
        user.milestones = [];
        result.fixedFields.push('milestones');
      }

      if (!Array.isArray(user.groups)) {
        user.groups = [];
        result.fixedFields.push('groups');
      }

      // Initialize missing numeric fields with safe defaults
      if (typeof user.balance !== 'number' || isNaN(user.balance)) {
        user.balance = 0;
        result.fixedFields.push('balance');
      }

      if (typeof user.usdBalance !== 'number' || isNaN(user.usdBalance)) {
        user.usdBalance = 0;
        result.fixedFields.push('usdBalance');
      }

      if (typeof user.shardsTowardNextQBS !== 'number' || isNaN(user.shardsTowardNextQBS)) {
        user.shardsTowardNextQBS = 0;
        result.fixedFields.push('shardsTowardNextQBS');
      }

      if (typeof user.xp !== 'number' || isNaN(user.xp)) {
        user.xp = 0;
        result.fixedFields.push('xp');
      }

      if (typeof user.level !== 'number' || isNaN(user.level)) {
        user.level = 1;
        result.fixedFields.push('level');
      }

      // Initialize missing boolean fields with safe defaults
      if (typeof user.messagingActive !== 'boolean') {
        user.messagingActive = false;
        result.fixedFields.push('messagingActive');
      }

      if (typeof user.miningActive !== 'boolean') {
        user.miningActive = false;
        result.fixedFields.push('miningActive');
      }

      if (typeof user.discoveryVisible !== 'boolean') {
        user.discoveryVisible = true;
        result.fixedFields.push('discoveryVisible');
      }

      // Initialize missing string fields with safe defaults
      if (!user.role || typeof user.role !== 'string') {
        user.role = 'user';
        result.fixedFields.push('role');
      }

      if (!user.publicKey || typeof user.publicKey !== 'string') {
        user.publicKey = '';
        result.fixedFields.push('publicKey');
        result.warnings.push('Public key was missing and set to empty string');
      }

      if (!user.privateKey || typeof user.privateKey !== 'string') {
        user.privateKey = '';
        result.fixedFields.push('privateKey');
        result.warnings.push('Private key was missing and set to empty string');
      }

      if (!user.profileId || typeof user.profileId !== 'string') {
        user.profileId = `${user.username}_${Date.now()}`;
        result.fixedFields.push('profileId');
      }

      if (!user.securityCode || typeof user.securityCode !== 'string') {
        user.securityCode = '';
        result.fixedFields.push('securityCode');
        result.warnings.push('Security code was missing');
      }

      // Validate and fix nested array structures
      this.validateAndFixContacts(user.contacts, result);
      this.validateAndFixTransactions(user.transactions, result);
      this.validateAndFixIncidents(user.incidents, result);
      this.validateAndFixSolvedBlocks(user.solvedBlocks, result);
      this.validateAndFixNFTs(user.ownedNfts, result);

      // Initialize votes object if missing
      if (!user.votes || typeof user.votes !== 'object') {
        user.votes = {};
        result.fixedFields.push('votes');
      }

      return result;
    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
      return result;
    }
  }

  /**
   * Validate and fix contacts array
   */
  private validateAndFixContacts(contacts: Contact[], result: RegistryValidationResult): void {
    try {
      for (let i = contacts.length - 1; i >= 0; i--) {
        const contact = contacts[i];
        
        if (!contact || typeof contact !== 'object') {
          contacts.splice(i, 1);
          result.fixedFields.push(`contacts[${i}] (removed invalid)`);
          continue;
        }

        if (!contact.name || typeof contact.name !== 'string') {
          contact.name = 'Unknown Contact';
          result.fixedFields.push(`contacts[${i}].name`);
        }

        if (!contact.address || typeof contact.address !== 'string') {
          contacts.splice(i, 1);
          result.fixedFields.push(`contacts[${i}] (removed - no address)`);
          continue;
        }

        if (!contact.addedAt || typeof contact.addedAt !== 'string') {
          contact.addedAt = new Date().toISOString();
          result.fixedFields.push(`contacts[${i}].addedAt`);
        }
      }
    } catch (error) {
      result.warnings.push('Error validating contacts array');
    }
  }

  /**
   * Validate and fix transactions array
   */
  private validateAndFixTransactions(transactions: Transaction[], result: RegistryValidationResult): void {
    try {
      for (let i = transactions.length - 1; i >= 0; i--) {
        const transaction = transactions[i];
        
        if (!transaction || typeof transaction !== 'object') {
          transactions.splice(i, 1);
          result.fixedFields.push(`transactions[${i}] (removed invalid)`);
          continue;
        }

        if (!transaction.id || typeof transaction.id !== 'string') {
          transaction.id = `tx_${Date.now()}_${i}`;
          result.fixedFields.push(`transactions[${i}].id`);
        }

        if (!transaction.timestamp || typeof transaction.timestamp !== 'string') {
          transaction.timestamp = new Date().toISOString();
          result.fixedFields.push(`transactions[${i}].timestamp`);
        }

        if (!transaction.type || typeof transaction.type !== 'string') {
          transaction.type = 'CREDIT';
          result.fixedFields.push(`transactions[${i}].type`);
        }

        if (!transaction.amount || typeof transaction.amount !== 'string') {
          transaction.amount = '0';
          result.fixedFields.push(`transactions[${i}].amount`);
        }

        if (!transaction.unit || typeof transaction.unit !== 'string') {
          transaction.unit = 'QBS';
          result.fixedFields.push(`transactions[${i}].unit`);
        }

        if (!transaction.description || typeof transaction.description !== 'string') {
          transaction.description = 'Transaction';
          result.fixedFields.push(`transactions[${i}].description`);
        }
      }
    } catch (error) {
      result.warnings.push('Error validating transactions array');
    }
  }

  /**
   * Validate and fix incidents array
   */
  private validateAndFixIncidents(incidents: SecurityIncident[], result: RegistryValidationResult): void {
    try {
      for (let i = incidents.length - 1; i >= 0; i--) {
        const incident = incidents[i];
        
        if (!incident || typeof incident !== 'object') {
          incidents.splice(i, 1);
          result.fixedFields.push(`incidents[${i}] (removed invalid)`);
          continue;
        }

        if (!incident.id || typeof incident.id !== 'string') {
          incident.id = `incident_${Date.now()}_${i}`;
          result.fixedFields.push(`incidents[${i}].id`);
        }

        if (!incident.timestamp || typeof incident.timestamp !== 'string') {
          incident.timestamp = new Date().toISOString();
          result.fixedFields.push(`incidents[${i}].timestamp`);
        }

        if (!incident.severity || typeof incident.severity !== 'string') {
          incident.severity = 'Low';
          result.fixedFields.push(`incidents[${i}].severity`);
        }

        // Set default values for missing fields
        if (!incident.attackerIp) incident.attackerIp = 'Unknown';
        if (!incident.location) incident.location = 'Unknown';
        if (!incident.isp) incident.isp = 'Unknown';
        if (!incident.quantumSignature) incident.quantumSignature = 'Unknown';
      }
    } catch (error) {
      result.warnings.push('Error validating incidents array');
    }
  }

  /**
   * Validate and fix solved blocks array
   */
  private validateAndFixSolvedBlocks(solvedBlocks: SolvedBlock[], result: RegistryValidationResult): void {
    try {
      for (let i = solvedBlocks.length - 1; i >= 0; i--) {
        const block = solvedBlocks[i];
        
        if (!block || typeof block !== 'object') {
          solvedBlocks.splice(i, 1);
          result.fixedFields.push(`solvedBlocks[${i}] (removed invalid)`);
          continue;
        }

        if (!block.id || typeof block.id !== 'string') {
          block.id = `block_${Date.now()}_${i}`;
          result.fixedFields.push(`solvedBlocks[${i}].id`);
        }

        if (!block.timestamp || typeof block.timestamp !== 'string') {
          block.timestamp = new Date().toISOString();
          result.fixedFields.push(`solvedBlocks[${i}].timestamp`);
        }

        // Set default values for missing required fields
        if (!block.shardId) block.shardId = 'unknown';
        if (typeof block.shardIndex !== 'number') block.shardIndex = 0;
        if (!block.problem) block.problem = 'Unknown problem';
        if (!block.answer) block.answer = 'Unknown answer';
        if (!block.explanation) block.explanation = 'No explanation provided';
        if (typeof block.reward !== 'number') block.reward = 0;
        if (!block.difficulty) block.difficulty = 'Unknown';
        if (!block.hash) block.hash = 'unknown_hash';
        if (!block.parentHash) block.parentHash = 'unknown_parent';
        if (!block.integrityHash) block.integrityHash = 'unknown_integrity';
        if (typeof block.isPeerReviewed !== 'boolean') block.isPeerReviewed = false;
        if (typeof block.advancementLevel !== 'number') block.advancementLevel = 1;
      }
    } catch (error) {
      result.warnings.push('Error validating solved blocks array');
    }
  }

  /**
   * Validate and fix NFTs array
   */
  private validateAndFixNFTs(nfts: QBSNFT[], result: RegistryValidationResult): void {
    try {
      for (let i = nfts.length - 1; i >= 0; i--) {
        const nft = nfts[i];
        
        if (!nft || typeof nft !== 'object') {
          nfts.splice(i, 1);
          result.fixedFields.push(`ownedNfts[${i}] (removed invalid)`);
          continue;
        }

        if (typeof nft.tokenId !== 'number') {
          nft.tokenId = i;
          result.fixedFields.push(`ownedNfts[${i}].tokenId`);
        }

        if (!nft.title || typeof nft.title !== 'string') {
          nft.title = 'Unknown NFT';
          result.fixedFields.push(`ownedNfts[${i}].title`);
        }

        if (!nft.domain || typeof nft.domain !== 'string') {
          nft.domain = 'Unknown';
          result.fixedFields.push(`ownedNfts[${i}].domain`);
        }

        if (!nft.mintDate || typeof nft.mintDate !== 'string') {
          nft.mintDate = new Date().toISOString();
          result.fixedFields.push(`ownedNfts[${i}].mintDate`);
        }

        if (!nft.proofHash || typeof nft.proofHash !== 'string') {
          nft.proofHash = 'unknown_proof';
          result.fixedFields.push(`ownedNfts[${i}].proofHash`);
        }

        if (!nft.authorAddress || typeof nft.authorAddress !== 'string') {
          nft.authorAddress = 'unknown_author';
          result.fixedFields.push(`ownedNfts[${i}].authorAddress`);
        }
      }
    } catch (error) {
      result.warnings.push('Error validating NFTs array');
    }
  }

  /**
   * Initialize missing user data structures
   */
  public initializeUserDataStructures(user: Partial<User>): User {
    const defaultUser: User = {
      address: user.address || '',
      publicKey: user.publicKey || '',
      privateKey: user.privateKey || '',
      profileId: user.profileId || `${user.username || 'user'}_${Date.now()}`,
      mnemonic: user.mnemonic || '',
      username: user.username || '',
      passwordHash: user.passwordHash || '',
      password: user.password || '',
      salt: user.salt || '',
      securityCode: user.securityCode || '',
      role: user.role || 'user',
      balance: typeof user.balance === 'number' ? user.balance : 0,
      usdBalance: typeof user.usdBalance === 'number' ? user.usdBalance : 0,
      stakedBalance: typeof user.stakedBalance === 'number' ? user.stakedBalance : 0,
      reputationScore: typeof user.reputationScore === 'number' ? user.reputationScore : 0,
      governanceRank: user.governanceRank || '',
      contacts: Array.isArray(user.contacts) ? user.contacts : [],
      transactions: Array.isArray(user.transactions) ? user.transactions : [],
      incidents: Array.isArray(user.incidents) ? user.incidents : [],
      solvedBlocks: Array.isArray(user.solvedBlocks) ? user.solvedBlocks : [],
      ownedNfts: Array.isArray(user.ownedNfts) ? user.ownedNfts : [],
      shardsTowardNextQBS: typeof user.shardsTowardNextQBS === 'number' ? user.shardsTowardNextQBS : 0,
      messagingActive: typeof user.messagingActive === 'boolean' ? user.messagingActive : false,
      messagingExpires: user.messagingExpires || '',
      miningActive: typeof user.miningActive === 'boolean' ? user.miningActive : false,
      miningExpires: user.miningExpires || '',
      autoSignOutMinutes: typeof user.autoSignOutMinutes === 'number' ? user.autoSignOutMinutes : 30,
      votes: user.votes && typeof user.votes === 'object' ? user.votes : {},
      xp: typeof user.xp === 'number' ? user.xp : 0,
      level: typeof user.level === 'number' ? user.level : 1,
      tagline: user.tagline || '',
      bio: user.bio || '',
      avatarSeed: user.avatarSeed || '',
      milestones: Array.isArray(user.milestones) ? user.milestones : [],
      groups: Array.isArray(user.groups) ? user.groups : [],
      discoveryVisible: typeof user.discoveryVisible === 'boolean' ? user.discoveryVisible : true,
      activeInitiativeId: user.activeInitiativeId || ''
    };

    return defaultUser;
  }

  /**
   * Check if user data structure is valid
   */
  public isValidUserStructure(user: any): boolean {
    if (!user || typeof user !== 'object') {
      return false;
    }

    const requiredFields = ['address', 'username', 'passwordHash', 'salt'];
    for (const field of requiredFields) {
      if (!user[field] || typeof user[field] !== 'string') {
        return false;
      }
    }

    const requiredArrays = ['contacts', 'transactions', 'incidents', 'solvedBlocks', 'ownedNfts'];
    for (const field of requiredArrays) {
      if (!Array.isArray(user[field])) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const safeRegistry = SafeRegistryService.getInstance();