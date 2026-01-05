import React, { useState } from 'react';
import { clearCurrentUserDiscoveries, getUserObject } from '../services/db';

/**
 * Component to clear all discoveries from the current user's profile
 */
const ClearDiscoveries: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClearRequest = () => {
    setShowConfirm(true);
    setResult(null);
  };

  const handleConfirmClear = async () => {
    if (confirmText.toLowerCase() !== 'clear all discoveries') {
      setResult({ success: false, message: 'Please type "clear all discoveries" exactly to confirm.' });
      return;
    }

    setIsClearing(true);
    setResult(null);

    try {
      // Get current user info first
      const activeAddr = localStorage.getItem('LATTICE_ACTIVE_ADDR');
      if (!activeAddr) {
        setResult({ success: false, message: 'No active user found. Please log in first.' });
        return;
      }

      const user = await getUserObject(activeAddr);
      if (!user) {
        setResult({ success: false, message: 'User data not found.' });
        return;
      }

      const discoveryCount = user.solvedBlocks?.length || 0;
      
      // Clear the discoveries
      const success = await clearCurrentUserDiscoveries();
      
      if (success) {
        setResult({ 
          success: true, 
          message: `Successfully cleared ${discoveryCount} discoveries from your profile. Please refresh the page to see the changes.` 
        });
        setShowConfirm(false);
        setConfirmText('');
        
        // Optionally reload the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setResult({ success: false, message: 'Failed to clear discoveries. Please try again.' });
      }
    } catch (error) {
      console.error('Error clearing discoveries:', error);
      setResult({ success: false, message: 'An error occurred while clearing discoveries.' });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmText('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-zinc-900/60 border border-red-500/30 rounded-3xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-red-400 uppercase tracking-wider mb-4">
            🗑️ Clear All Discoveries
          </h1>
          <p className="text-gray-400">
            This will permanently remove all breakthrough discoveries from your profile.
          </p>
        </div>

        {!showConfirm ? (
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
              <h3 className="text-yellow-400 font-black mb-3">⚠️ Warning</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• This action will remove ALL your breakthrough discoveries</li>
                <li>• This action cannot be undone</li>
                <li>• Your certificates and NFTs will no longer be accessible</li>
                <li>• Your profile statistics may be affected</li>
                <li>• You will need to refresh the page after clearing</li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={handleClearRequest}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-3xl text-lg font-black uppercase tracking-wider hover:from-red-500 hover:to-red-400 transition-all shadow-xl"
              >
                🗑️ Clear All Discoveries
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-red-400 font-black mb-3">🚨 Final Confirmation Required</h3>
              <p className="text-sm text-gray-300 mb-4">
                To confirm that you want to permanently delete all your discoveries, 
                please type the following text exactly:
              </p>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3 mb-4">
                <code className="text-green-400 font-mono">clear all discoveries</code>
              </div>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type the confirmation text here..."
                className="w-full p-3 bg-zinc-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                disabled={isClearing}
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCancel}
                disabled={isClearing}
                className="px-6 py-3 bg-gray-600 text-white rounded-2xl font-bold hover:bg-gray-500 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isClearing || confirmText.toLowerCase() !== 'clear all discoveries'}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                  isClearing || confirmText.toLowerCase() !== 'clear all discoveries'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400'
                }`}
              >
                {isClearing ? 'Clearing...' : 'Confirm Clear All'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-2xl border ${
            result.success 
              ? 'bg-green-900/20 border-green-500/30 text-green-300' 
              : 'bg-red-900/20 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {result.success ? '✅' : '❌'}
              </span>
              <div>
                <div className="font-black text-sm uppercase tracking-wider">
                  {result.success ? 'Success!' : 'Error'}
                </div>
                <div className="text-sm opacity-80">
                  {result.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClearDiscoveries;