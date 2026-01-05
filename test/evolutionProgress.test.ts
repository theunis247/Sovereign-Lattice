import { EvolutionProgressTracker, EVOLUTION_STAGES } from '../services/evolutionProgress';
import { EvolutionProgress } from '../types';

// Mock timers for testing
jest.useFakeTimers();

describe('EvolutionProgressTracker', () => {
  let tracker: EvolutionProgressTracker;
  let mockProgressCallback: jest.Mock;

  beforeEach(() => {
    tracker = new EvolutionProgressTracker();
    mockProgressCallback = jest.fn();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Evolution Progress State Management', () => {
    test('should start evolution with initial progress state', () => {
      const blockId = 'test-block-123';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          blockId,
          stage: 'analyzing',
          progress: 0,
          message: 'Analyzing current breakthrough formulation...',
          estimatedTimeRemaining: expect.any(Number),
          startTime: expect.any(Number)
        })
      );
    });

    test('should track multiple evolutions simultaneously', () => {
      const blockId1 = 'block-1';
      const blockId2 = 'block-2';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      tracker.startEvolution(blockId1, callback1);
      tracker.startEvolution(blockId2, callback2);

      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining({ blockId: blockId1 })
      );
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({ blockId: blockId2 })
      );
    });

    test('should clean up existing evolution when starting new one for same block', () => {
      const blockId = 'test-block';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      tracker.startEvolution(blockId, callback1);
      tracker.startEvolution(blockId, callback2);

      // Should only call the new callback
      expect(callback2).toHaveBeenCalled();
      
      // Advance to next stage should only affect new callback
      tracker.advanceToStage(blockId, 'synthesizing');
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'synthesizing' })
      );
    });

    test('should get current progress for active evolution', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      const progress = tracker.getProgress(blockId);
      
      expect(progress).toMatchObject({
        blockId,
        stage: 'analyzing',
        progress: 0
      });
    });

    test('should return null for non-existent evolution progress', () => {
      const progress = tracker.getProgress('non-existent-block');
      expect(progress).toBeNull();
    });
  });

  describe('Stage Timing and Progress Calculation', () => {
    test('should advance through evolution stages correctly', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      // Test advancing to synthesizing stage
      tracker.advanceToStage(blockId, 'synthesizing');
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stage: 'synthesizing',
          message: 'Synthesizing advanced mathematical frameworks...',
          progress: expect.any(Number)
        })
      );

      // Test advancing to validating stage
      tracker.advanceToStage(blockId, 'validating');
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stage: 'validating',
          message: 'Validating scientific accuracy and consistency...'
        })
      );

      // Test advancing to finalizing stage
      tracker.advanceToStage(blockId, 'finalizing');
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stage: 'finalizing',
          message: 'Finalizing evolution results and updating records...'
        })
      );
    });

    test('should calculate progress percentage correctly', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      // Mock time progression
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 1000); // 1 second later
      
      tracker.advanceToStage(blockId, 'synthesizing');
      
      const progress = tracker.getProgress(blockId);
      expect(progress?.progress).toBeGreaterThan(0);
      expect(progress?.progress).toBeLessThanOrEqual(100);
    });

    test('should calculate estimated time remaining', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      const progress = tracker.getProgress(blockId);
      expect(progress?.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    test('should handle stage advancement for non-existent evolution gracefully', () => {
      expect(() => {
        tracker.advanceToStage('non-existent-block', 'synthesizing');
      }).not.toThrow();
    });

    test('should complete evolution and clean up resources', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      tracker.completeEvolution(blockId);
      
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stage: 'finalizing',
          progress: 100,
          message: 'Evolution completed successfully!',
          estimatedTimeRemaining: 0
        })
      );

      // Should clean up after completion
      jest.advanceTimersByTime(1100);
      expect(tracker.getProgress(blockId)).toBeNull();
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should handle evolution error with enhanced error details', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      tracker.handleEvolutionError(blockId, 'API connection failed', 'NETWORK_CONNECTION');
      
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          blockId,
          stage: 'analyzing',
          progress: 0,
          message: 'Evolution failed: Connection lost - Check internet',
          estimatedTimeRemaining: 0,
          error: true
        })
      );

      // Should clean up after error
      expect(tracker.getProgress(blockId)).toBeNull();
    });

    test('should handle retryable evolution error', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      tracker.handleRetryableError(blockId, 'Rate limit exceeded', 5000);
      
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'Rate limit exceeded - Retrying in 5s...',
          estimatedTimeRemaining: 5000,
          error: false
        })
      );
    });

    test('should handle different error types with appropriate messages', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);

      // Test API key missing error
      tracker.handleEvolutionError(blockId, 'No API key', 'API_KEY_MISSING');
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'Evolution failed: API key required - Configure in Settings'
        })
      );

      // Restart for next test
      tracker.startEvolution(blockId, mockProgressCallback);

      // Test timeout error
      tracker.handleEvolutionError(blockId, 'Request timed out', 'API_TIMEOUT');
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'Evolution failed: Request timed out - Try again'
        })
      );
    });

    test('should handle error for non-existent evolution gracefully', () => {
      expect(() => {
        tracker.handleEvolutionError('non-existent-block', 'Some error');
      }).not.toThrow();
    });

    test('should stop evolution and clean up resources', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      tracker.stopEvolution(blockId);
      
      expect(tracker.getProgress(blockId)).toBeNull();
    });
  });

  describe('Evolution Stages Configuration', () => {
    test('should have correct evolution stages defined', () => {
      expect(EVOLUTION_STAGES).toHaveLength(4);
      
      const stageNames = EVOLUTION_STAGES.map(stage => stage.name);
      expect(stageNames).toEqual(['analyzing', 'synthesizing', 'validating', 'finalizing']);
      
      // Check that all stages have required properties
      EVOLUTION_STAGES.forEach(stage => {
        expect(stage).toHaveProperty('name');
        expect(stage).toHaveProperty('duration');
        expect(stage).toHaveProperty('message');
        expect(stage).toHaveProperty('color');
        expect(stage).toHaveProperty('icon');
        expect(typeof stage.duration).toBe('number');
        expect(stage.duration).toBeGreaterThan(0);
      });
    });

    test('should have appropriate stage durations', () => {
      const totalDuration = EVOLUTION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
      expect(totalDuration).toBeGreaterThan(10000); // At least 10 seconds total
      
      // Synthesizing should be the longest stage
      const synthesizingStage = EVOLUTION_STAGES.find(s => s.name === 'synthesizing');
      const otherStages = EVOLUTION_STAGES.filter(s => s.name !== 'synthesizing');
      
      expect(synthesizingStage?.duration).toBeGreaterThan(
        Math.max(...otherStages.map(s => s.duration))
      );
    });

    test('should have unique colors and icons for each stage', () => {
      const colors = EVOLUTION_STAGES.map(stage => stage.color);
      const icons = EVOLUTION_STAGES.map(stage => stage.icon);
      
      expect(new Set(colors).size).toBe(colors.length);
      expect(new Set(icons).size).toBe(icons.length);
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should clean up timers when stopping evolution', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      // Verify timer was created
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      
      tracker.stopEvolution(blockId);
      
      // Timers should be cleaned up
      expect(tracker.getProgress(blockId)).toBeNull();
    });

    test('should handle multiple rapid start/stop cycles', () => {
      const blockId = 'test-block';
      
      for (let i = 0; i < 5; i++) {
        tracker.startEvolution(blockId, mockProgressCallback);
        tracker.stopEvolution(blockId);
      }
      
      expect(tracker.getProgress(blockId)).toBeNull();
    });

    test('should clean up resources when evolution completes naturally', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      tracker.completeEvolution(blockId);
      
      // Fast-forward past cleanup delay
      jest.advanceTimersByTime(1100);
      
      expect(tracker.getProgress(blockId)).toBeNull();
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle empty or invalid block IDs', () => {
      expect(() => {
        tracker.startEvolution('', mockProgressCallback);
      }).not.toThrow();
      
      expect(() => {
        tracker.getProgress('');
      }).not.toThrow();
    });

    test('should handle null or undefined callbacks gracefully', () => {
      expect(() => {
        tracker.startEvolution('test-block', null as any);
      }).not.toThrow();
    });

    test('should handle concurrent operations on same block', () => {
      const blockId = 'test-block';
      
      tracker.startEvolution(blockId, mockProgressCallback);
      
      // Simulate concurrent operations
      tracker.advanceToStage(blockId, 'synthesizing');
      tracker.advanceToStage(blockId, 'validating');
      tracker.completeEvolution(blockId);
      
      expect(mockProgressCallback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          progress: 100,
          message: 'Evolution completed successfully!'
        })
      );
    });
  });
});