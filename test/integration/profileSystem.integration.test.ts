/**
 * Profile System Integration Test
 * Tests the complete profile management workflow
 */

import { ProfileManager, ProfileConfig, SecurityClassification } from '../../services/profileManager';
import { ProfileContextManager } from '../../services/profileContext';
import { ProfileAuthenticationService } from '../../services/profileAuth';
import { enhancedDB } from '../../services/enhancedDatabase';

// Simple test runner for integration testing
class IntegrationTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running Profile System Integration Tests...\n');

    for (const test of this.tests) {
      try {
        console.log(`⏳ Running: ${test.name}`);
        await test.fn();
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ PASSED: ${test.name}\n`);
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }
  }
}

// Mock IndexedDB for testing
class MockIDBDatabase {
  private stores: Map<string, Map<string, any>> = new Map();

  transaction(storeNames: string[], mode: string) {
    return {
      objectStore: (name: string) => ({
        get: (key: string) => ({
          onsuccess: null as any,
          onerror: null as any,
          result: this.stores.get(name)?.get(key) || null
        }),
        put: (value: any) => ({
          onsuccess: null as any,
          onerror: null as any
        }),
        delete: (key: string) => ({
          onsuccess: null as any,
          onerror: null as any
        }),
        getAll: () => ({
          onsuccess: null as any,
          onerror: null as any,
          result: Array.from(this.stores.get(name)?.values() || [])
        })
      }),
      oncomplete: null as any,
      onerror: null as any
    };
  }

  mockSet(storeName: string, key: string, value: any) {
    if (!this.stores.has(storeName)) {
      this.stores.set(storeName, new Map());
    }
    this.stores.get(storeName)!.set(key, value);
  }

  mockGet(storeName: string, key: string) {
    return this.stores.get(storeName)?.get(key) || null;
  }
}

// Mock enhanced database
const mockDB = new MockIDBDatabase();

// Override enhancedDB methods for testing
const originalMethods = {
  set: enhancedDB.set,
  get: enhancedDB.get,
  delete: enhancedDB.delete,
  query: enhancedDB.query
};

// Simple mock implementations
(enhancedDB as any).set = async (collection: string, id: string, data: any) => {
  mockDB.mockSet(collection, id, data);
  return Promise.resolve();
};

(enhancedDB as any).get = async (collection: string, id: string) => {
  return Promise.resolve(mockDB.mockGet(collection, id));
};

(enhancedDB as any).delete = async (collection: string, id: string) => {
  const store = mockDB['stores'].get(collection);
  if (store) {
    store.delete(id);
  }
  return Promise.resolve();
};

(enhancedDB as any).query = async (collection: string, filters: any[]) => {
  const store = mockDB['stores'].get(collection);
  if (!store) return [];
  return Array.from(store.values());
};

// Integration Tests
const runner = new IntegrationTestRunner();

runner.test('Profile Creation and Authentication Flow', async () => {
  const profileManager = new ProfileManager();
  const authService = new ProfileAuthenticationService();

  // Create a new profile
  const config: ProfileConfig = {
    profileId: 'test-user-001',
    username: 'testuser',
    encryptionSeed: 'test-encryption-seed-123456789',
    securityLevel: 'standard',
    syncEnabled: true,
    backupEnabled: true,
    auditEnabled: true
  };

  const profile = await profileManager.createProfile(config);
  
  if (!profile) throw new Error('Profile creation failed');
  if (profile.profileId !== config.profileId) throw new Error('Profile ID mismatch');
  if (profile.username !== config.username) throw new Error('Username mismatch');
  if (profile.securityLevel !== SecurityClassification.INTERNAL) throw new Error('Security level mapping failed');

  // Create authentication credentials
  await authService.createProfileCredentials(
    config.profileId,
    'TestPassword123!',
    SecurityClassification.INTERNAL
  );

  // Test authentication
  const authResult = await authService.authenticateProfile({
    profileId: config.profileId,
    password: 'TestPassword123!',
    deviceFingerprint: 'test-device-123'
  });

  if (!authResult.success) throw new Error(`Authentication failed: ${authResult.failureReason}`);
  if (!authResult.sessionToken) throw new Error('Session token not generated');
});

runner.test('Profile Context Management', async () => {
  const profileManager = new ProfileManager();
  const contextManager = new ProfileContextManager(profileManager);

  // Create and switch to profile
  const config: ProfileConfig = {
    profileId: 'context-test-001',
    username: 'contextuser',
    encryptionSeed: 'context-encryption-seed-123456789',
    securityLevel: 'high',
    syncEnabled: true,
    backupEnabled: true,
    auditEnabled: true
  };

  const profile = await profileManager.createProfile(config);
  
  // Mock the profile manager's getCurrentProfile method
  (profileManager as any).currentProfile = profile;
  (profileManager.getCurrentProfile as any) = () => profile;

  // Initialize context
  const contextProfile = await contextManager.initializeContext(config.profileId);
  
  if (!contextProfile) throw new Error('Context initialization failed');
  if (contextProfile.profileId !== config.profileId) throw new Error('Context profile mismatch');

  // Check active profile
  const activeProfile = contextManager.getActiveProfile();
  if (!activeProfile) throw new Error('No active profile in context');
  if (activeProfile.profileId !== config.profileId) throw new Error('Active profile mismatch');

  // Check session
  const session = contextManager.getActiveSession();
  if (!session) throw new Error('No active session');
  if (session.profileId !== config.profileId) throw new Error('Session profile mismatch');
  if (!session.isActive) throw new Error('Session not active');

  // Check permissions
  if (!contextManager.hasPermission('canRead')) throw new Error('Missing read permission');
  if (!contextManager.hasPermission('canWrite')) throw new Error('Missing write permission');

  // Check security context
  const securityContext = contextManager.getSecurityContext();
  if (securityContext.securityLevel !== SecurityClassification.CONFIDENTIAL) throw new Error('Security level mismatch');
  if (securityContext.encryptionKeys.size === 0) throw new Error('No encryption keys initialized');

  // Cleanup
  contextManager.destroy();
});

runner.test('Profile Security Levels and Policies', async () => {
  const authService = new ProfileAuthenticationService();

  // Test different security levels
  const securityLevels = [
    { level: SecurityClassification.INTERNAL, name: 'standard' },
    { level: SecurityClassification.CONFIDENTIAL, name: 'high' },
    { level: SecurityClassification.SECRET, name: 'military' }
  ];

  for (const { level, name } of securityLevels) {
    const profileId = `security-test-${name}`;
    
    await authService.createProfileCredentials(profileId, 'TestPassword123!', level);
    
    // Get the authentication policy
    const policy = await (authService as any).getAuthenticationPolicy(profileId);
    
    if (level === SecurityClassification.SECRET) {
      // Military security should have stricter requirements
      if (policy.passwordPolicy.minLength < 12) throw new Error('Military password policy too weak');
      if (!policy.mfaPolicy.required) throw new Error('Military should require MFA');
      if (policy.lockoutPolicy.maxAttempts > 3) throw new Error('Military lockout policy too lenient');
    }
  }
});

runner.test('Profile Export and Import', async () => {
  const profileManager = new ProfileManager();

  // Create a profile
  const config: ProfileConfig = {
    profileId: 'export-test-001',
    username: 'exportuser',
    encryptionSeed: 'export-encryption-seed-123456789',
    securityLevel: 'standard',
    syncEnabled: true,
    backupEnabled: true,
    auditEnabled: true
  };

  const profile = await profileManager.createProfile(config);

  // Export the profile
  const exportData = await profileManager.exportProfile(config.profileId, 'export-password-123');
  
  if (!exportData) throw new Error('Profile export failed');
  if (exportData.profileId !== config.profileId) throw new Error('Export profile ID mismatch');
  if (!exportData.encryptedData) throw new Error('No encrypted data in export');
  if (!exportData.metadata.checksum) throw new Error('No checksum in export metadata');

  // Import the profile (with different ID to avoid conflict)
  const importedProfile = await profileManager.importProfile(exportData, 'export-password-123');
  
  if (!importedProfile) throw new Error('Profile import failed');
  if (importedProfile.username !== config.username) throw new Error('Imported username mismatch');
});

runner.test('Profile Audit and Monitoring', async () => {
  const profileManager = new ProfileManager();

  // Create a profile
  const config: ProfileConfig = {
    profileId: 'audit-test-001',
    username: 'audituser',
    encryptionSeed: 'audit-encryption-seed-123456789',
    securityLevel: 'high',
    syncEnabled: true,
    backupEnabled: true,
    auditEnabled: true
  };

  const profile = await profileManager.createProfile(config);

  // Perform some operations to generate audit events
  await profileManager.lockProfile(config.profileId);
  await profileManager.unlockProfile(config.profileId, { password: 'test' });

  // Generate audit report
  const auditReport = await profileManager.auditProfile(config.profileId);
  
  if (!auditReport) throw new Error('Audit report generation failed');
  if (auditReport.profileId !== config.profileId) throw new Error('Audit report profile mismatch');
  if (auditReport.events.length === 0) throw new Error('No audit events recorded');
  if (!auditReport.securityMetrics) throw new Error('No security metrics in audit report');
  if (!auditReport.complianceStatus) throw new Error('No compliance status in audit report');
});

// Run the tests
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('Profile System Integration Tests can be run in browser console');
  (window as any).runProfileTests = () => runner.run();
} else {
  // Node environment
  runner.run().then(() => {
    // Restore original methods
    Object.assign(enhancedDB, originalMethods);
    console.log('\n🎉 Integration tests completed!');
  }).catch(error => {
    console.error('Integration test runner failed:', error);
    Object.assign(enhancedDB, originalMethods);
  });
}

export { runner as profileIntegrationTests };