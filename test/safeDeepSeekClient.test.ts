import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafeDeepSeekClient } from '../services/safeDeepSeekClient';

// Mock the deepSeekClient and apiKeyManager
vi.mock('../services/deepSeekClient', () => ({
  deepSeekClient: {
    isConfigured: vi.fn(),
    testConnection: vi.fn(),
    evaluateMiningBreakthrough: vi.fn(),
    evolveBreakthrough: vi.fn()
  }
}));

vi.mock('../services/apiKeyManager', () => ({
  apiKeyManager: {
    getDeepSeekConfig: vi.fn()
  }
}));

describe('SafeDeepSeekClient', () => {
  let safeClient: SafeDeepSeekClient;
  let mockNotificationCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    safeClient = new SafeDeepSeekClient();
    mockNotificationCallback = vi.fn();
    safeClient.setNotificationCallback(mockNotificationCallback);
  });

  describe('initialization', () => {
    it('should initialize with fallback mode when API key is not configured', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      const status = await safeClient.initialize();

      expect(status.isConfigured).toBe(false);
      expect(status.fallbackMode).toBe(true);
      expect(status.isAvailable).toBe(false);
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'AI Features Limited'
        })
      );
    });

    it('should initialize successfully when API key is configured and valid', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);

      const status = await safeClient.initialize();

      expect(status.isConfigured).toBe(true);
      expect(status.hasValidKey).toBe(true);
      expect(status.fallbackMode).toBe(false);
      expect(status.isAvailable).toBe(true);
      expect(status.features.miningEvaluation).toBe(true);
      expect(status.features.breakthroughEvolution).toBe(true);
    });

    it('should handle API key validation failure gracefully', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(false);

      const status = await safeClient.initialize();

      expect(status.isConfigured).toBe(true);
      expect(status.hasValidKey).toBe(false);
      expect(status.fallbackMode).toBe(true);
      expect(status.isAvailable).toBe(false);
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'API Key Invalid'
        })
      );
    });
  });

  describe('mining evaluation', () => {
    it('should use fallback evaluation when API is not available', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      await safeClient.initialize();
      
      const result = await safeClient.evaluateMiningBreakthrough({
        problem: 'Test quantum mechanics problem with complex mathematics and physical constants'
      });

      expect(result).toHaveProperty('isFallback', true);
      expect(result).toHaveProperty('fallbackReason');
      expect(result.grade).toMatch(/^[SABC]$/);
      expect(result.breakthroughScore).toBeGreaterThan(0);
    });

    it('should use API when available and fall back on error', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);
      vi.mocked(deepSeekClient.evaluateMiningBreakthrough).mockRejectedValue(new Error('API Error'));

      await safeClient.initialize();
      
      const result = await safeClient.evaluateMiningBreakthrough({
        problem: 'Test problem'
      });

      expect(result).toHaveProperty('isFallback', true);
      expect(result.fallbackReason).toBe('API Error');
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fallback',
          title: 'Using Fallback Evaluation'
        })
      );
    });
  });

  describe('breakthrough evolution', () => {
    it('should use fallback evolution when API is not available', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      await safeClient.initialize();
      
      const result = await safeClient.evolveBreakthrough({
        currentExplanation: 'Test explanation',
        currentLevel: 1,
        blockId: 'test-block'
      });

      expect(result).toHaveProperty('isFallback', true);
      expect(result).toHaveProperty('fallbackReason');
      expect(result.newGrade).toMatch(/^[SABC]$/);
      expect(result.newScore).toBeGreaterThan(0);
    });
  });

  describe('feature availability', () => {
    it('should return correct feature availability based on status', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(true);
      vi.mocked(deepSeekClient.testConnection).mockResolvedValue(true);

      await safeClient.initialize();
      
      const features = safeClient.getFeatureAvailability();

      expect(features.miningEvaluation).toBe(true);
      expect(features.breakthroughEvolution).toBe(true);
      expect(features.apiKeyValidation).toBe(true);
      expect(features.fallbackMode).toBe(false);
    });

    it('should indicate fallback mode when API is unavailable', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockResolvedValue(false);

      await safeClient.initialize();
      
      const features = safeClient.getFeatureAvailability();

      expect(features.miningEvaluation).toBe(false);
      expect(features.breakthroughEvolution).toBe(false);
      expect(features.apiKeyValidation).toBe(false);
      expect(features.fallbackMode).toBe(true);
    });
  });

  describe('error boundaries', () => {
    it('should handle initialization errors gracefully', async () => {
      const { deepSeekClient } = await import('../services/deepSeekClient');
      vi.mocked(deepSeekClient.isConfigured).mockRejectedValue(new Error('Network error'));

      const status = await safeClient.initialize();

      expect(status.fallbackMode).toBe(true);
      expect(status.lastError).toBe('Network error');
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'AI Service Error'
        })
      );
    });

    it('should provide diagnostic information', async () => {
      await safeClient.initialize();
      
      const diagnostics = safeClient.getDiagnostics();

      expect(diagnostics).toHaveProperty('status');
      expect(diagnostics).toHaveProperty('lastHealthCheck');
      expect(diagnostics).toHaveProperty('initializationComplete');
      expect(diagnostics.initializationComplete).toBe(true);
    });
  });
});