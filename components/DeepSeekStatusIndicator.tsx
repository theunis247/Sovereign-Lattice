import React, { useState, useEffect } from 'react';
import { safeDeepSeekClient, DeepSeekServiceStatus } from '../services/safeDeepSeekClient';

interface DeepSeekStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const DeepSeekStatusIndicator: React.FC<DeepSeekStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<DeepSeekServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const currentStatus = await safeDeepSeekClient.initialize();
        setStatus(currentStatus);
      } catch (error) {
        console.warn('Failed to get DeepSeek status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateStatus();
    
    // Update status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-500 font-mono">Checking AI status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-xs text-red-400 font-mono">AI Status Unknown</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.isAvailable && !status.fallbackMode) {
      return 'green';
    } else if (status.isConfigured && status.fallbackMode) {
      return 'yellow';
    } else {
      return 'red';
    }
  };

  const getStatusText = () => {
    if (status.isAvailable && !status.fallbackMode) {
      return 'AI Active';
    } else if (status.isConfigured && status.fallbackMode) {
      return 'AI Fallback';
    } else if (!status.isConfigured) {
      return 'AI Not Configured';
    } else {
      return 'AI Unavailable';
    }
  };

  const getStatusDescription = () => {
    if (status.isAvailable && !status.fallbackMode) {
      return 'DeepSeek API connected and operational';
    } else if (status.isConfigured && status.fallbackMode) {
      return 'Using local evaluation system';
    } else if (!status.isConfigured) {
      return 'API key required for full AI features';
    } else {
      return status.lastError || 'AI services temporarily unavailable';
    }
  };

  const color = getStatusColor();
  const colorClasses = {
    green: 'bg-green-500 text-green-400',
    yellow: 'bg-yellow-500 text-yellow-400',
    red: 'bg-red-500 text-red-400'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${colorClasses[color].split(' ')[0]} ${status.isAvailable && !status.fallbackMode ? 'animate-pulse' : ''}`}></div>
      <span className={`text-xs font-mono ${colorClasses[color].split(' ')[1]}`}>
        {getStatusText()}
      </span>
      
      {showDetails && (
        <div className="ml-2">
          <span className="text-xs text-gray-500">
            {getStatusDescription()}
          </span>
          
          {status.features && (
            <div className="mt-1 flex gap-1">
              <span className={`text-xs px-1 py-0.5 rounded ${status.features.miningEvaluation ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                Mining
              </span>
              <span className={`text-xs px-1 py-0.5 rounded ${status.features.breakthroughEvolution ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                Evolution
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepSeekStatusIndicator;