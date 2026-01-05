import React, { useState, useEffect } from 'react';
import { apiKeyManager, APIKeyInfo } from '../services/apiKeyManager';

interface APIKeyManagerProps {
  onKeyChange?: (hasKey: boolean) => void;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ onKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [keyInfo, setKeyInfo] = useState<APIKeyInfo | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    loadKeyInfo();
  }, []);

  const loadKeyInfo = () => {
    const securityStatus = apiKeyManager.getSecurityStatus();
    setIsSupported(securityStatus.isSupported);
    setHasKey(securityStatus.hasKey);
    setKeyInfo(securityStatus.keyInfo);
    onKeyChange?.(securityStatus.hasKey);
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Store the API key
      await apiKeyManager.storeAPIKey(apiKey.trim());
      
      // Validate the key
      setIsValidating(true);
      const isValid = await apiKeyManager.validateAPIKey();
      
      if (isValid) {
        setSuccess('API key saved and validated successfully!');
        setApiKey(''); // Clear the input
        loadKeyInfo();
      } else {
        setError('API key saved but validation failed. Please check your key.');
        loadKeyInfo();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    apiKeyManager.removeAPIKey();
    setSuccess('API key removed successfully');
    setError(null);
    loadKeyInfo();
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    setError(null);
    setSuccess(null);

    try {
      const isValid = await apiKeyManager.validateAPIKey();
      if (isValid) {
        setSuccess('API key is valid and working!');
      } else {
        setError('API key validation failed. Please check your key.');
      }
      loadKeyInfo();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? '✓' : '✗';
  };

  if (!isSupported) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-sm">⚠</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400">Encryption Not Supported</h3>
            <p className="text-xs text-gray-400">Your browser doesn't support secure encryption</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">DeepSeek API Key</h3>
        {hasKey && (
          <button
            onClick={handleRemoveKey}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Remove Key
          </button>
        )}
      </div>

      {hasKey && keyInfo ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-500 text-sm">🔑</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-green-400">API Key Configured</h4>
              <p className="text-xs text-gray-400">Your personal DeepSeek API key is securely stored</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <p className={`text-sm font-bold ${getStatusColor(keyInfo.isValid)}`}>
                {getStatusIcon(keyInfo.isValid)} {keyInfo.isValid ? 'Valid' : 'Invalid'}
              </p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-bold text-white mono">{formatDate(keyInfo.createdAt)}</p>
            </div>
          </div>

          {keyInfo.lastUsed && (
            <div className="bg-black/20 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Used</p>
              <p className="text-sm font-bold text-white mono">{formatDate(keyInfo.lastUsed)}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleValidateKey}
              disabled={isValidating}
              className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Validating...
                </>
              ) : (
                'Validate Key'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-500 text-sm">🔑</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-400">Add Your DeepSeek API Key</h4>
              <p className="text-xs text-gray-400">Use your own API credits for mining operations</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-all text-white font-mono pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-400 mb-2">
                <strong>🔒 Security:</strong> Your API key is encrypted and stored locally in your browser. 
                It never leaves your device.
              </p>
              <p className="text-xs text-gray-400">
                Get your API key from <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">DeepSeek Platform</a>
              </p>
            </div>

            <button
              onClick={handleSaveKey}
              disabled={isSaving || isValidating || !apiKey.trim()}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : isValidating ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Validating...
                </>
              ) : (
                'Save & Validate API Key'
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-400">{success}</p>
        </div>
      )}

      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">How it works</h5>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Your API key is encrypted using AES-256-GCM encryption</li>
          <li>• Keys are stored locally and never transmitted to our servers</li>
          <li>• Each mining operation uses your personal DeepSeek credits</li>
          <li>• You maintain full control over your API usage and costs</li>
        </ul>
      </div>
    </div>
  );
};

export default APIKeyManager;