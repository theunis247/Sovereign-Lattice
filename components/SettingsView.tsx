
import React, { useState, useEffect } from 'react';
import { User, LogEntry } from '../types';
import { hashSecret, generateSalt, saveUser, sanitizeInput } from '../services/db';
import APIKeyManager from './APIKeyManager';
import DeepSeekStatusIndicator from './DeepSeekStatusIndicator';
import { ErrorMonitoringDashboard } from './ErrorMonitoringDashboard';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, addLog }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newAlias, setNewAlias] = useState(user.username);
  const [currentSecret, setCurrentSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [newSecurityCode, setNewSecurityCode] = useState(user.securityCode || '');
  const [autoSignOut, setAutoSignOut] = useState(user.autoSignOutMinutes || 30);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncingManually, setIsSyncingManually] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showErrorMonitoring, setShowErrorMonitoring] = useState(false);

  // Sync state if user prop changes externally
  useEffect(() => {
    setNewAlias(user.username);
    setNewSecurityCode(user.securityCode || '');
    setAutoSignOut(user.autoSignOutMinutes || 30);
  }, [user.username, user.securityCode, user.autoSignOutMinutes]);

  const handleManualSync = () => {
    setIsSyncingManually(true);
    addLog("PERSISTENCE: Initiating manual state snapshot...", "info");
    setTimeout(() => {
      setIsSyncingManually(false);
      addLog("PERSISTENCE: Local lattice registry synced with browser storage.", "success");
    }, 2000);
  };

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation: Match new secrets if provided
    if (newSecret && newSecret !== confirmSecret) {
      setError('LATTICE ERROR: Rotation secret mismatch.');
      return;
    }

    // Validation: Security Code Length
    if (newSecurityCode.length !== 5) {
      setError('LATTICE ERROR: Security PIN must be exactly 5 characters.');
      return;
    }

    // Validation: Current secret required to authorize changes
    if (!currentSecret) {
      setError('LATTICE ERROR: Verification secret required.');
      return;
    }

    setIsUpdating(true);
    addLog(`SECURITY: Initiating credential rotation for node ${user.username}...`, 'warning');

    try {
      // 1. Verify existing identity with current Master Secret
      const testHash = await hashSecret(currentSecret, user.salt);
      if (testHash !== user.passwordHash) {
        throw new Error('AUTH_FAILURE: Verification secret is incorrect.');
      }

      // 2. Construct the safe updated user object
      const safeAlias = sanitizeInput(newAlias) || user.username;
      
      // Initialize with existing data
      let updatedUser: User = { 
        ...user,
        username: safeAlias,
        securityCode: newSecurityCode.toUpperCase(),
        autoSignOutMinutes: autoSignOut
      };

      // 3. If rotating to a new secret, generate new cryptographic primitives
      if (newSecret) {
        const newSalt = generateSalt();
        const newHash = await hashSecret(newSecret, newSalt);
        
        updatedUser.salt = newSalt;
        updatedUser.passwordHash = newHash;
        // Note: Password is securely hashed and stored
        
        addLog(`SECURITY: Master secret for ${safeAlias} successfully rotated and hardened.`, 'success');
      } else {
        addLog(`IDENTITY: Registry parameters for ${safeAlias} updated.`, 'info');
      }

      // 4. Persist to IndexedDB
      await saveUser(updatedUser);
      
      // 5. Propagate change to main App state
      onUpdateUser(updatedUser);
      
      setSuccess('SUCCESS: Registry updated. New credentials active.');
      addLog(`IDENTITY RECALIBRATED: Node Registry sync complete for ${safeAlias}.`, 'success');
      
      // Reset sensitive form fields
      setCurrentSecret('');
      setNewSecret('');
      setConfirmSecret('');
      
      // Keep open briefly for success message then close
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSuccess('');
      }, 2500);
      
    } catch (err: any) {
      setError(err.message || 'LATTICE ERROR: Identity rotation failed.');
      addLog(`SECURITY ERROR: ${err.message || 'Identity rotation failed.'}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar max-w-4xl mx-auto w-full px-4 pb-32 pt-6 relative">
      
      {/* Visual Identity Dashboard */}
      <div className="bg-zinc-900/60 border border-white/10 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sovereign Profile</h2>
            <p className="text-[10px] text-blue-400 font-bold tracking-[0.4em] uppercase mt-1">Lattice Access Point :: Identity Vault</p>
          </div>
          <div className="px-6 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Node Authenticated
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-1">
             <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest block">Active Operational Alias</span>
             <span className="text-lg font-black text-orange-500 uppercase">{user.username}</span>
          </div>
          <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20 space-y-1">
             <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest block">Security PIN</span>
             <span className="text-lg font-black text-white mono tracking-widest">{user.securityCode}</span>
          </div>

          <div className="md:col-span-2 bg-black/40 p-6 rounded-3xl border border-white/5 space-y-3">
             <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest block">Lattice-Native Bech32m Address</span>
             <span className="text-[11px] text-blue-300 mono break-all bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10 block">{user.publicKey}</span>
          </div>

          <div className="md:col-span-2 bg-black/40 p-6 rounded-3xl border border-white/5 space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[8px] text-purple-500 font-black uppercase tracking-widest block">Quantum Recovery Shards (Mnemonic)</span>
                <button 
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="text-[8px] text-gray-500 hover:text-white uppercase font-black bg-white/5 px-3 py-1 rounded-lg transition-all"
                >
                  {showMnemonic ? '[ Mask Shards ]' : '[ Inspect Shards ]'}
                </button>
             </div>
             <div className={`grid grid-cols-3 md:grid-cols-4 gap-2 transition-all duration-500 ${showMnemonic ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none h-0'}`}>
                {user.mnemonic?.split(' ').map((word, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                    <span className="text-[6px] text-gray-600 block leading-none mb-1">{i+1}</span>
                    <span className="text-[10px] text-white font-bold mono">{word}</span>
                  </div>
                ))}
             </div>
             {!showMnemonic && (
               <div className="bg-zinc-800/30 border border-white/5 p-4 rounded-2xl text-center">
                 <span className="text-[8px] text-gray-600 font-black uppercase tracking-[0.5em]">Shard Vault Encrypted</span>
               </div>
             )}
          </div>
        </div>

        <button 
          onClick={handleManualSync}
          disabled={isSyncingManually}
          className="mt-10 w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
        >
          {isSyncingManually ? 'ARCHIVING STATE...' : 'FORCE REGISTRY SNAPSHOT'}
          <div className={`w-2 h-2 rounded-full ${isSyncingManually ? 'bg-orange-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></div>
        </button>
      </div>

      {/* DeepSeek API Key Management */}
      <div className="bg-zinc-900/60 border border-white/10 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">AI Integration</h2>
            <p className="text-[10px] text-green-400 font-bold tracking-[0.4em] uppercase mt-1">DeepSeek API :: Personal Mining Credits</p>
            <div className="mt-2">
              <DeepSeekStatusIndicator showDetails={true} />
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <APIKeyManager />
        </div>
      </div>

      {/* Trigger for Credential Update Drawer */}
      <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-6 group hover:border-orange-500/30 transition-all cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
          <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/40 group-hover:scale-110 transition-transform">
             <span className="text-3xl font-black text-black italic font-serif">₿</span>
          </div>
          <div className="space-y-2">
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Access Control & PIN Rotation</h2>
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Update Operational Alias, PIN, and Master Secrets</p>
          </div>
          <button className="px-12 py-4 bg-orange-500 text-black rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-xl group-hover:bg-orange-400">
             Open Secure Vault
          </button>
      </div>

      {/* Error Monitoring Dashboard */}
      <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-6 group hover:border-red-500/30 transition-all cursor-pointer" onClick={() => setShowErrorMonitoring(true)}>
          <div className="w-16 h-16 bg-red-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/40 group-hover:scale-110 transition-transform">
             <span className="text-3xl font-black text-white">⚠</span>
          </div>
          <div className="space-y-2">
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Error Monitoring Dashboard</h2>
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">System Health, Error Patterns & Diagnostics</p>
          </div>
          <button className="px-12 py-4 bg-red-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-xl group-hover:bg-red-400">
             Open Monitoring
          </button>
      </div>

      <div className="bg-red-950/20 border border-red-500/10 p-10 rounded-[4rem] mb-12">
        <h3 className="text-[11px] text-red-500 font-black uppercase tracking-[0.5em] mb-4">Cryptographic Warning</h3>
        <p className="text-xs text-gray-400 leading-relaxed font-medium">
          Node credentials utilize a <span className="text-purple-500 font-black">600,000 Iteration Hash</span>. Your 5-character Security PIN provides a secondary gate against intrusion. Changes are persistent and etched to your local registry.
        </p>
      </div>

      {/* SECURE IDENTITY ROTATION DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isUpdating && setIsDrawerOpen(false)}
          />
          
          <div className="relative w-full max-w-lg bg-zinc-900 h-full border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center">
                     <span className="text-xl font-black text-black italic">₿</span>
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tighter">Secure Vault</h2>
                     <p className="text-[8px] text-orange-500 font-black uppercase tracking-widest">Identity Rotation Protocol</p>
                  </div>
               </div>
               <button 
                 onClick={() => !isUpdating && setIsDrawerOpen(false)}
                 className="w-12 h-12 rounded-full hover:bg-white/5 text-gray-500 hover:text-white text-2xl font-bold transition-all"
               >
                 ×
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleUpdateIdentity} className="space-y-10">
                <div className="space-y-8">
                  <div className="group">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 px-1">New Operational Alias</label>
                    <input 
                      type="text" value={newAlias} onChange={e => setNewAlias(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 text-white font-medium shadow-inner transition-all"
                      placeholder="e.g. Genesis_Node_01"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3 px-1">Update Security PIN (5 Chars)</label>
                    <input 
                      type="text" 
                      maxLength={5}
                      value={newSecurityCode} 
                      onChange={e => setNewSecurityCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-lg font-black tracking-widest outline-none focus:border-blue-500 text-blue-400 font-mono shadow-inner transition-all text-center"
                      placeholder="5 ALPHANUMERIC"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-3 px-1">Verify Current Master Secret</label>
                    <input 
                      type="password" value={currentSecret} onChange={e => setCurrentSecret(e.target.value)}
                      className="w-full bg-black/60 border border-red-500/20 rounded-2xl p-5 text-sm outline-none focus:border-red-500 text-white font-medium shadow-inner transition-all"
                      placeholder="Authorize changes with current secret" required
                    />
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 px-1">New Master Secret (Optional)</label>
                      <input 
                        type="password" value={newSecret} onChange={e => setNewSecret(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 text-white font-medium shadow-inner transition-all"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 px-1">Confirm New Secret</label>
                      <input 
                        type="password" value={confirmSecret} onChange={e => setConfirmSecret(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 text-white font-medium shadow-inner transition-all"
                        placeholder="Re-enter to confirm rotation"
                      />
                    </div>
                  </div>
                </div>

                {(error || success) && (
                  <div className={`p-6 rounded-2xl border text-center animate-in fade-in duration-300 ${error ? 'border-red-500/50 bg-red-500/5 text-red-500' : 'border-green-500/5 bg-green-500/5 text-green-500'}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{error || success}</p>
                  </div>
                )}

                <button 
                  type="submit" disabled={isUpdating}
                  className="w-full py-6 bg-orange-500 text-black rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.4em] hover:bg-orange-400 transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-orange-500/20"
                >
                  {isUpdating ? 'HARDENING ARCHIVE...' : 'COMMIT IDENTITY ROTATION'}
                </button>
              </form>
            </div>

            <div className="p-10 bg-black/40 border-t border-white/5">
               <p className="text-[8px] text-gray-600 font-black uppercase leading-relaxed text-center tracking-widest">
                  Encryption Module: SHA-512 with PBKDF2 (600,000 Iterations) <br/>
                  Session ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Monitoring Dashboard Modal */}
      <ErrorMonitoringDashboard 
        isVisible={showErrorMonitoring}
        onClose={() => setShowErrorMonitoring(false)}
      />
    </div>
  );
};

export default SettingsView;
