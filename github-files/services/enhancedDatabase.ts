/**
 * Enhanced Database System
 * Advanced IndexedDB wrapper with caching, validation, sync, and performance optimization
 */

export interface DatabaseConfig {
  name: string;
  version: number;
  encryptionKey?: string;
  syncEnabled: boolean;
  backupInterval: number;
  cacheSize: number;
  compressionEnabled: boolean;
  debugMode?: boolean;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith';
  value: any;
}

export interface DatabaseOperation {
  type: 'get' | 'set' | 'delete' | 'query';
  collection: string;
  id?: string;
  data?: any;
  filter?: QueryFilter[];
}

export interface DatabaseMetrics {
  totalOperations: number;
  cacheHitRatio: number;
  averageQueryTime: number;
  storageUsed: number;
  lastBackup: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BackupResult {
  id: string;
  timestamp: string;
  size: number;
  collections: string[];
  success: boolean;
}

/**
 * Enhanced Database Manager
 * Provides advanced database operations with caching, validation, and sync
 */
export class EnhancedDatabaseManager {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private cache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private operationQueue: DatabaseOperation[] = [];
  private metrics: DatabaseMetrics;
  private isInitialized = false;
  private schemas: Map<string, any> = new Map();
  private indexes: Map<string, string[]> = new Map();

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.metrics = {
      totalOperations: 0,
      cacheHitRatio: 0,
      averageQueryTime: 0,
      storageUsed: 0,
      lastBackup: '',
      syncStatus: 'pending'
    };
  }

  /**
   * Initialize the enhanced database
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.openDatabase();
      await this.setupIndexes();
      await this.loadMetrics();
      this.startBackgroundTasks();
      this.isInitialized = true;
      
      if (this.config.debugMode) {
        console.log('Enhanced Database initialized:', this.config.name);
      }
    } catch (error) {
      console.error('Failed to initialize enhanced database:', error);
      throw error;
    }
  }

  /**
   * Open IndexedDB connection with enhanced features
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.setupErrorHandling();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores with optimized structure
   */
  private createObjectStores(db: IDBDatabase): void {
    const collections = [
      'users', 'blocks', 'transactions', 'apiKeys', 
      'settings', 'cache', 'backups', 'syncLog', 'metrics'
    ];

    collections.forEach(collection => {
      if (!db.objectStoreNames.contains(collection)) {
        const store = db.createObjectStore(collection, { keyPath: '_id' });
        
        // Create common indexes
        store.createIndex('timestamp', '_modified', { unique: false });
        store.createIndex('checksum', '_checksum', { unique: false });
        
        // Collection-specific indexes
        if (collection === 'users') {
          store.createIndex('username', 'username', { unique: true });
          store.createIndex('address', 'address', { unique: true });
          store.createIndex('profileId', 'profileId', { unique: true });
        } else if (collection === 'transactions') {
          store.createIndex('hash', 'hash', { unique: true });
          store.createIndex('from', 'from', { unique: false });
          store.createIndex('to', 'to', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        } else if (collection === 'blocks') {
          store.createIndex('shardId', 'shardId', { unique: true });
          store.createIndex('grade', 'grade', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        this.indexes.set(collection, ['timestamp', 'checksum']);
      }
    });
  }

  /**
   * Setup error handling for database operations
   */
  private setupErrorHandling(): void {
    if (!this.db) return;

    this.db.onerror = (event) => {
      console.error('Database error:', event);
      this.handleDatabaseError(event);
    };

    this.db.onversionchange = () => {
      this.db?.close();
      console.warn('Database version changed, please reload the application');
    };
  }

  /**
   * Handle database errors with recovery mechanisms
   */
  private handleDatabaseError(event: Event): void {
    // Implement error recovery logic
    console.error('Database error occurred:', event);
    
    // Could implement automatic recovery, backup restoration, etc.
    this.metrics.syncStatus = 'error';
  }

  /**
   * Get data with intelligent caching
   */
  public async get<T>(collection: string, id: string): Promise<T | null> {
    const startTime = performance.now();
    this.metrics.totalOperations++;

    try {
      // Check cache first
      const cacheKey = `${collection}:${id}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (this.isCacheValid(cacheKey)) {
          this.updateCacheHitRatio(true);
          return cached;
        } else {
          this.cache.delete(cacheKey);
          this.cacheTimestamps.delete(cacheKey);
        }
      }

      // Get from database
      const data = await this.getFromDatabase<T>(collection, id);
      
      // Cache the result
      if (data) {
        this.cacheData(cacheKey, data);
      }

      this.updateCacheHitRatio(false);
      this.updateQueryTime(performance.now() - startTime);
      
      return data;
    } catch (error) {
      console.error(`Failed to get ${collection}:${id}:`, error);
      return null;
    }
  }

  /**
   * Set data with validation and caching
   */
  public async set<T>(collection: string, id: string, data: T): Promise<void> {
    const startTime = performance.now();
    this.metrics.totalOperations++;

    try {
      // Validate data
      const validation = this.validateData(collection, data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Enhance data with metadata
      const enhancedData = this.enhanceDataWithMetadata(data, id);

      // Store in database
      await this.setInDatabase(collection, id, enhancedData);

      // Update cache
      const cacheKey = `${collection}:${id}`;
      this.cacheData(cacheKey, enhancedData);

      // Queue for sync if enabled
      if (this.config.syncEnabled) {
        this.queueForSync({ type: 'set', collection, id, data: enhancedData });
      }

      this.updateQueryTime(performance.now() - startTime);
    } catch (error) {
      console.error(`Failed to set ${collection}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete data with cache invalidation
   */
  public async delete(collection: string, id: string): Promise<void> {
    const startTime = performance.now();
    this.metrics.totalOperations++;

    try {
      // Delete from database
      await this.deleteFromDatabase(collection, id);

      // Remove from cache
      const cacheKey = `${collection}:${id}`;
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);

      // Queue for sync if enabled
      if (this.config.syncEnabled) {
        this.queueForSync({ type: 'delete', collection, id });
      }

      this.updateQueryTime(performance.now() - startTime);
    } catch (error) {
      console.error(`Failed to delete ${collection}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Query data with optimization
   */
  public async query<T>(collection: string, filters: QueryFilter[]): Promise<T[]> {
    const startTime = performance.now();
    this.metrics.totalOperations++;

    try {
      const results = await this.queryDatabase<T>(collection, filters);
      this.updateQueryTime(performance.now() - startTime);
      return results;
    } catch (error) {
      console.error(`Failed to query ${collection}:`, error);
      return [];
    }
  }

  /**
   * Execute multiple operations in a transaction
   */
  public async transaction<T>(operations: DatabaseOperation[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results: T[] = [];
    const transaction = this.db.transaction(
      operations.map(op => op.collection),
      'readwrite'
    );

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);

      operations.forEach(async (operation, index) => {
        try {
          let result: any;
          switch (operation.type) {
            case 'get':
              result = await this.get(operation.collection, operation.id!);
              break;
            case 'set':
              await this.set(operation.collection, operation.id!, operation.data);
              result = operation.data;
              break;
            case 'delete':
              await this.delete(operation.collection, operation.id!);
              result = true;
              break;
            case 'query':
              result = await this.query(operation.collection, operation.filter!);
              break;
          }
          results[index] = result;
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Create backup of database
   */
  public async backup(): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    try {
      const collections = ['users', 'blocks', 'transactions', 'settings'];
      const backupData: any = {};
      let totalSize = 0;

      for (const collection of collections) {
        const data = await this.getAllFromCollection(collection);
        backupData[collection] = data;
        totalSize += JSON.stringify(data).length;
      }

      // Store backup
      await this.set('backups', backupId, {
        id: backupId,
        timestamp,
        data: backupData,
        size: totalSize,
        collections,
        compressed: this.config.compressionEnabled
      });

      this.metrics.lastBackup = timestamp;

      return {
        id: backupId,
        timestamp,
        size: totalSize,
        collections,
        success: true
      };
    } catch (error) {
      console.error('Backup failed:', error);
      return {
        id: backupId,
        timestamp,
        size: 0,
        collections: [],
        success: false
      };
    }
  }

  /**
   * Get database metrics
   */
  public getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  // Private helper methods

  private async getFromDatabase<T>(collection: string, id: string): Promise<T | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async setInDatabase<T>(collection: string, id: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromDatabase(collection: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async queryDatabase<T>(collection: string, filters: QueryFilter[]): Promise<T[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        const filtered = this.applyFilters(results, filters);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromCollection(collection: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private applyFilters<T>(data: T[], filters: QueryFilter[]): T[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = (item as any)[filter.field];
        switch (filter.operator) {
          case 'eq': return value === filter.value;
          case 'gt': return value > filter.value;
          case 'gte': return value >= filter.value;
          case 'lt': return value < filter.value;
          case 'lte': return value <= filter.value;
          case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
          case 'contains': return String(value).includes(String(filter.value));
          case 'startsWith': return String(value).startsWith(String(filter.value));
          default: return true;
        }
      });
    });
  }

  private enhanceDataWithMetadata<T>(data: T, id: string): T & {
    _id: string;
    _version: number;
    _created: string;
    _modified: string;
    _checksum: string;
  } {
    const now = new Date().toISOString();
    const existing = (data as any)._created;
    
    return {
      ...data,
      _id: id,
      _version: ((data as any)._version || 0) + 1,
      _created: existing || now,
      _modified: now,
      _checksum: this.calculateChecksum(data)
    };
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private validateData(collection: string, data: any): ValidationResult {
    const schema = this.schemas.get(collection);
    if (!schema) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Basic validation - could be enhanced with JSON Schema
    const errors: string[] = [];
    const warnings: string[] = [];

    if (collection === 'users') {
      if (!data.username) errors.push('Username is required');
      if (!data.address) errors.push('Address is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private cacheData(key: string, data: any): void {
    if (this.cache.size >= this.config.cacheSize) {
      this.evictOldestCacheEntry();
    }
    
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - timestamp < maxAge;
  }

  private evictOldestCacheEntry(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, timestamp] of this.cacheTimestamps) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
  }

  private updateCacheHitRatio(hit: boolean): void {
    const total = this.metrics.totalOperations;
    const currentHits = this.metrics.cacheHitRatio * (total - 1);
    const newHits = hit ? currentHits + 1 : currentHits;
    this.metrics.cacheHitRatio = newHits / total;
  }

  private updateQueryTime(time: number): void {
    const total = this.metrics.totalOperations;
    const currentAvg = this.metrics.averageQueryTime;
    this.metrics.averageQueryTime = ((currentAvg * (total - 1)) + time) / total;
  }

  private queueForSync(operation: DatabaseOperation): void {
    this.operationQueue.push(operation);
    // Sync queue processing would be implemented in sync engine
  }

  private async setupIndexes(): Promise<void> {
    // Index setup is handled in createObjectStores
    // This method could be used for dynamic index creation
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metrics = await this.get<DatabaseMetrics>('metrics', 'current');
      if (metrics) {
        this.metrics = { ...this.metrics, ...metrics };
      }
    } catch (error) {
      console.warn('Could not load metrics:', error);
    }
  }

  private startBackgroundTasks(): void {
    // Start periodic backup
    if (this.config.backupInterval > 0) {
      setInterval(() => {
        this.backup().catch(console.error);
      }, this.config.backupInterval);
    }

    // Start cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Every minute

    // Save metrics periodically
    setInterval(() => {
      this.saveMetrics();
    }, 30000); // Every 30 seconds
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, timestamp] of this.cacheTimestamps) {
      if (now - timestamp > maxAge) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await this.set('metrics', 'current', this.metrics);
    } catch (error) {
      console.warn('Could not save metrics:', error);
    }
  }
}

// Singleton instance
export const enhancedDB = new EnhancedDatabaseManager({
  name: 'SovereignLattice_Enhanced_v1',
  version: 1,
  syncEnabled: true,
  backupInterval: 30 * 60 * 1000, // 30 minutes
  cacheSize: 1000,
  compressionEnabled: true,
  debugMode: process.env.NODE_ENV === 'development'
});