import React from 'react';
import { EvolutionProgress, EvolutionStage } from '../types';

interface EvolutionProgressModalProps {
  isOpen: boolean;
  progress: EvolutionProgress;
  onCancel?: () => void;
}

const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    name: 'analyzing',
    duration: 2000,
    message: 'Analyzing current breakthrough formulation...',
    color: '#3b82f6', // blue
    icon: '🔍'
  },
  {
    name: 'synthesizing', 
    duration: 8000,
    message: 'Synthesizing advanced mathematical frameworks...',
    color: '#8b5cf6', // purple
    icon: '⚗️'
  },
  {
    name: 'validating',
    duration: 3000,
    message: 'Validating scientific accuracy and consistency...',
    color: '#f59e0b', // amber
    icon: '✓'
  },
  {
    name: 'finalizing',
    duration: 1000,
    message: 'Finalizing evolution results and updating records...',
    color: '#10b981', // green
    icon: '🎯'
  }
];

const EvolutionProgressModal: React.FC<EvolutionProgressModalProps> = ({ 
  isOpen, 
  progress, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const currentStageIndex = EVOLUTION_STAGES.findIndex(stage => stage.name === progress.stage);
  const currentStage = EVOLUTION_STAGES[currentStageIndex];

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.ceil(remainingSeconds)}s`;
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-[3rem] w-full max-w-2xl shadow-[0_0_60px_rgba(139,92,246,0.2)] relative overflow-hidden">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 animate-pulse"></div>
        
        <div className="relative z-10 p-12 space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-black/60 border border-purple-500/30 rounded-2xl flex items-center justify-center text-4xl animate-bounce">
              {currentStage?.icon || '⚡'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Breakthrough Evolution
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-2">
                Advancing scientific formulation to next tier
              </p>
            </div>
          </div>

          {/* Stage Progress Indicators */}
          <div className="space-y-6">
            <div className="flex justify-between items-center relative">
              {/* Connection lines between stages */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-700/50 -z-10"></div>
              <div 
                className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 transition-all duration-1000 ease-out -z-10"
                style={{ 
                  width: `${(currentStageIndex / (EVOLUTION_STAGES.length - 1)) * 100}%`,
                  boxShadow: `0 0 10px ${currentStage?.color}60`
                }}
              ></div>
              
              {EVOLUTION_STAGES.map((stage, index) => {
                const isActive = index === currentStageIndex;
                const isCompleted = index < currentStageIndex;
                const stageColor = isActive ? currentStage.color : isCompleted ? '#10b981' : '#374151';
                
                return (
                  <div key={stage.name} className="flex flex-col items-center space-y-2 flex-1 relative">
                    <div 
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg transition-all duration-700 transform ${
                        isActive ? 'animate-pulse scale-110 shadow-lg' : isCompleted ? 'scale-105' : 'scale-100'
                      }`}
                      style={{ 
                        borderColor: stageColor,
                        backgroundColor: isActive || isCompleted ? `${stageColor}30` : 'transparent',
                        color: stageColor,
                        boxShadow: isActive ? `0 0 20px ${stageColor}60` : isCompleted ? `0 0 10px ${stageColor}40` : 'none'
                      }}
                    >
                      <span className={`transition-all duration-500 ${isActive ? 'animate-bounce' : ''}`}>
                        {isCompleted ? '✓' : stage.icon}
                      </span>
                    </div>
                    <span 
                      className={`text-xs font-bold uppercase tracking-wider text-center transition-all duration-500 ${
                        isActive ? 'animate-pulse' : ''
                      }`}
                      style={{ color: stageColor }}
                    >
                      {stage.name}
                    </span>
                    
                    {/* Ripple effect for active stage */}
                    {isActive && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                        <div 
                          className="w-12 h-12 rounded-full border-2 animate-ping opacity-30"
                          style={{ borderColor: stageColor }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Stage Message */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden">
            {/* Animated background gradient */}
            <div 
              className="absolute inset-0 opacity-10 animate-pulse"
              style={{ 
                background: `linear-gradient(45deg, ${currentStage?.color}20, transparent, ${currentStage?.color}20)`
              }}
            ></div>
            <p className="text-sm text-gray-300 font-medium italic relative z-10 animate-in slide-in-from-bottom duration-500">
              {progress.message || currentStage?.message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-xs font-bold text-white mono animate-in slide-in-from-right duration-300">
                {Math.round(progress.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden relative">
              {/* Background shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 transition-all duration-700 ease-out relative overflow-hidden"
                style={{ 
                  width: `${progress.progress}%`,
                  boxShadow: `0 0 20px ${currentStage?.color}60`
                }}
              >
                {/* Moving shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          {progress.estimatedTimeRemaining && (
            <div className="text-center animate-in slide-in-from-bottom duration-500">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Estimated Time Remaining
              </span>
              <div className="text-lg font-black text-white mono mt-1 animate-pulse">
                {formatTimeRemaining(progress.estimatedTimeRemaining)}
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {onCancel && (
            <div className="flex justify-center pt-4 animate-in slide-in-from-bottom duration-700">
              <button 
                onClick={onCancel}
                className="px-8 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
              >
                Cancel Evolution
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvolutionProgressModal;