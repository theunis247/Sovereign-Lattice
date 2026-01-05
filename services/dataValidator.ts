/**
 * Data Validation Engine
 * Comprehensive validation system for all database operations
 */

export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'address' | 'custom';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

export interface ValidationSchema {
  collection: string;
  rules: ValidationRule[];
  relationships?: RelationshipRule[];
}

export interface RelationshipRule {
  field: string;
  referencesCollection: string;
  referencesField: string;
  required: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
}

export interface IntegrityReport {
  totalRecords: number;
  corruptedRecords: number;
  missingReferences: number;
  duplicateRecords: number;
  issues: IntegrityIssue[];
}

export interface IntegrityIssue {
  type: 'corruption' | 'missing_reference' | 'duplicate' | 'invalid_data';
  collection: string;
  recordId: string;
  field?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Data Validation Engine
 * Provides comprehensive validation for all database operations
 */
export class DataValidationEngine {
  private schemas: Map<string, ValidationSchema> = new Map();
  private customValidators: Map<string, (value: any) => boolean> = new Map();

  constructor() {
    this.initializeDefaultSchemas();
    this.initializeCustomValidators();
  }

  /**
   * Register a validation schema for a collection
   */
  public registerSchema(schema: ValidationSchema): void {
    this.schemas.set(schema.collection, schema);
  }

  /**
   * Validate data against schema
   */
  public validate<T>(collection: string, data: T): ValidationResult {
    const schema = this.schemas.get(collection);
    if (!schema) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each rule
    for (const rule of schema.rules) {
      const value = (data as any)[rule.field];
      const result = this.validateField(rule, value);
      
      if (!result.isValid) {
        errors.push({
          field: rule.field,
          message: rule.errorMessage || result.message || `Validation failed for ${rule.field}`,
          value
        });
      }

      if (result.warning) {
        warnings.push({
          field: rule.field,
          message: result.warning,
          value
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check data integrity across collections
   */
  public async checkIntegrity(database: any): Promise<IntegrityReport> {
    const issues: IntegrityIssue[] = [];
    let totalRecords = 0;
    let corruptedRecords = 0;
    let missingReferences = 0;
    let duplicateRecords = 0;

    try {
      // Check each collection
      for (const [collectionName, schema] of this.schemas) {
        const records = await database.query(collectionName, []);
        totalRecords += records.length;

        // Check for corruption
        for (const record of records) {
          const validation = this.validate(collectionName, record);
          if (!validation.isValid) {
            corruptedRecords++;
            issues.push({
              type: 'corruption',
              collection: collectionName,
              recordId: record._id || 'unknown',
              description: `Data validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
              severity: 'high'
            });
          }

          // Check checksums
          if (record._checksum) {
            const calculatedChecksum = this.calculateChecksum(record);
            if (calculatedChecksum !== record._checksum) {
              corruptedRecords++;
              issues.push({
                type: 'corruption',
                collection: collectionName,
                recordId: record._id,
                description: 'Checksum mismatch - data may be corrupted',
                severity: 'critical'
              });
            }
          }
        }

        // Check relationships
        if (schema.relationships) {
          for (const relationship of schema.relationships) {
            for (const record of records) {
              const refValue = record[relationship.field];
              if (refValue && relationship.required) {
                const refExists = await this.checkReferenceExists(
                  database,
                  relationship.referencesCollection,
                  relationship.referencesField,
                  refValue
                );
                
                if (!refExists) {
                  missingReferences++;
                  issues.push({
                    type: 'missing_reference',
                    collection: collectionName,
                    recordId: record._id,
                    field: relationship.field,
                    description: `Missing reference to ${relationship.referencesCollection}.${relationship.referencesField}`,
                    severity: 'medium'
                  });
                }
              }
            }
          }
        }

        // Check for duplicates
        const duplicates = this.findDuplicates(records);
        duplicateRecords += duplicates.length;
        duplicates.forEach(duplicate => {
          issues.push({
            type: 'duplicate',
            collection: collectionName,
            recordId: duplicate.id,
            description: `Duplicate record found: ${duplicate.field}`,
            severity: 'low'
          });
        });
      }

      return {
        totalRecords,
        corruptedRecords,
        missingReferences,
        duplicateRecords,
        issues
      };
    } catch (error) {
      console.error('Integrity check failed:', error);
      return {
        totalRecords: 0,
        corruptedRecords: 0,
        missingReferences: 0,
        duplicateRecords: 0,
        issues: [{
          type: 'corruption',
          collection: 'system',
          recordId: 'integrity_check',
          description: `Integrity check failed: ${error.message}`,
          severity: 'critical'
        }]
      };
    }
  }

  /**
   * Repair data integrity issues
   */
  public async repairData(database: any, issues: IntegrityIssue[]): Promise<{ repaired: number; failed: number }> {
    let repaired = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'corruption':
            await this.repairCorruption(database, issue);
            repaired++;
            break;
          case 'missing_reference':
            await this.repairMissingReference(database, issue);
            repaired++;
            break;
          case 'duplicate':
            await this.repairDuplicate(database, issue);
            repaired++;
            break;
          default:
            failed++;
        }
      } catch (error) {
        console.error(`Failed to repair issue ${issue.type}:`, error);
        failed++;
      }
    }

    return { repaired, failed };
  }

  // Private helper methods

  private validateField(rule: ValidationRule, value: any): { isValid: boolean; message?: string; warning?: string } {
    // Required check
    if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
      return { isValid: false, message: `${rule.field} is required` };
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return { isValid: true };
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, message: `${rule.field} must be a string` };
        }
        if (rule.minLength && value.length < rule.minLength) {
          return { isValid: false, message: `${rule.field} must be at least ${rule.minLength} characters` };
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.maxLength} characters` };
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return { isValid: false, message: `${rule.field} format is invalid` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }
        if (rule.min !== undefined && value < rule.min) {
          return { isValid: false, message: `${rule.field} must be at least ${rule.min}` };
        }
        if (rule.max !== undefined && value > rule.max) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.max}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, message: `${rule.field} must be a boolean` };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, message: `${rule.field} must be an array` };
        }
        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return { isValid: false, message: `${rule.field} must be a valid email address` };
        }
        break;

      case 'address':
        const addressPattern = /^0x[a-fA-F0-9]{40}$/;
        if (!addressPattern.test(value)) {
          return { isValid: false, message: `${rule.field} must be a valid Ethereum address` };
        }
        break;

      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          return { isValid: false, message: rule.errorMessage || `${rule.field} failed custom validation` };
        }
        break;
    }

    return { isValid: true };
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async checkReferenceExists(database: any, collection: string, field: string, value: any): Promise<boolean> {
    try {
      const results = await database.query(collection, [{ field, operator: 'eq', value }]);
      return results.length > 0;
    } catch {
      return false;
    }
  }

  private findDuplicates(records: any[]): { id: string; field: string }[] {
    const duplicates: { id: string; field: string }[] = [];
    const seen = new Map();

    for (const record of records) {
      const key = record._id || record.id;
      if (seen.has(key)) {
        duplicates.push({ id: key, field: '_id' });
      } else {
        seen.set(key, true);
      }
    }

    return duplicates;
  }

  private async repairCorruption(database: any, issue: IntegrityIssue): Promise<void> {
    // Try to restore from backup or remove corrupted record
    console.log(`Repairing corruption in ${issue.collection}:${issue.recordId}`);
    // Implementation would depend on specific corruption type
  }

  private async repairMissingReference(database: any, issue: IntegrityIssue): Promise<void> {
    // Remove invalid reference or create missing record
    console.log(`Repairing missing reference in ${issue.collection}:${issue.recordId}`);
    // Implementation would depend on relationship type
  }

  private async repairDuplicate(database: any, issue: IntegrityIssue): Promise<void> {
    // Merge duplicates or remove extras
    console.log(`Repairing duplicate in ${issue.collection}:${issue.recordId}`);
    // Implementation would merge or remove duplicate records
  }

  private initializeDefaultSchemas(): void {
    // User schema
    this.registerSchema({
      collection: 'users',
      rules: [
        { field: 'username', type: 'required' },
        { field: 'username', type: 'string', minLength: 1, maxLength: 50 },
        { field: 'address', type: 'required' },
        { field: 'address', type: 'address' },
        { field: 'balance', type: 'number', min: 0 },
        { field: 'usdBalance', type: 'number', min: 0 },
        { field: 'xp', type: 'number', min: 0 },
        { field: 'level', type: 'number', min: 1 }
      ]
    });

    // Transaction schema
    this.registerSchema({
      collection: 'transactions',
      rules: [
        { field: 'id', type: 'required' },
        { field: 'timestamp', type: 'required' },
        { field: 'type', type: 'required' },
        { field: 'amount', type: 'string' },
        { field: 'unit', type: 'string' }
      ]
    });

    // Solved block schema
    this.registerSchema({
      collection: 'blocks',
      rules: [
        { field: 'id', type: 'required' },
        { field: 'shardId', type: 'required' },
        { field: 'problem', type: 'string', minLength: 10 },
        { field: 'explanation', type: 'string', minLength: 10 },
        { field: 'grade', type: 'string', pattern: /^[SABC]$/ },
        { field: 'reward', type: 'number', min: 0 }
      ]
    });
  }

  private initializeCustomValidators(): void {
    // Ethereum address validator
    this.customValidators.set('ethereumAddress', (value: string) => {
      return /^0x[a-fA-F0-9]{40}$/.test(value);
    });

    // API key validator
    this.customValidators.set('apiKey', (value: string) => {
      return typeof value === 'string' && value.length >= 20 && /^[a-zA-Z0-9\-_]+$/.test(value);
    });

    // Scientific grade validator
    this.customValidators.set('scientificGrade', (value: string) => {
      return ['S', 'A', 'B', 'C'].includes(value);
    });

    // Positive number validator
    this.customValidators.set('positiveNumber', (value: number) => {
      return typeof value === 'number' && !isNaN(value) && value >= 0;
    });
  }
}

// Singleton instance
export const dataValidator = new DataValidationEngine();