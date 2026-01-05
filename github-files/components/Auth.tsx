
import React, { useState, useEffect } from 'react';
import { generateKeys, saveUser, getUserByIdentifier, getUserByMnemonic, hashSecret, generateSalt, sanitizeInput, generateMnemonic, generateRandomCode, generateProfileId } from '../services/db';
import { User } from '../types';
import LatticeLogo from './LatticeLogo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth = ({ onLogin }: AuthProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isRecover, setIsRecover] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mnemonicInput, setMnemonicInput] = useState<string[]>(Array(24).fill(''));
  const [securityCodeInput, setSecurityCodeInput] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('');
  
  const [authLayer, setAuthLayer] = useState<1 | 2 | 4>(1); 
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lockoutUntil && Date.now() > lockoutUntil) {
        setLockoutUntil(null);
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthStatus('');

    if (honeypot) return;

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`CRITICAL LOCK: System cooling... ${remaining}s remain.`);
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus('Synchronizing Shards...');

    try {
      if (isRecover) {
        const mnemonicString = mnemonicInput.join(' ').trim();
        if (mnemonicInput.some(w => !w.trim())) {
          throw new Error('RECOVERY ERROR: All 24 shards must be provided.');
        }

        const recoveredUser = await getUserByMnemonic(mnemonicString);
        if (!recoveredUser) {
          throw new Error('ENTROPIC FAILURE: No node found with these shards.');
        }

        setAuthStatus('Verifying 100k Hashes...');
        const testHash = await hashSecret(password, recoveredUser.salt);
        if (testHash !== recoveredUser.passwordHash) {
          throw new Error('IDENTITY MISMATCH: Shards verified, but Master Secret is incorrect.');
        }

        setTempUser(recoveredUser);
        setAuthLayer(2);
        return;
      }

      const lookupId = username.trim();
      const safeUsername = sanitizeInput(username);

      if (isRegister) {
        setAuthStatus('Generating High-Entropy Primitives...');
        const existing = await getUserByIdentifier(lookupId);
        if (existing) throw new Error('IDENTITY COLLISION: Frequency already occupied.');

        const salt = generateSalt();
        setAuthStatus('Hardening Master Secret...');
        const passwordHash = await hashSecret(password, salt);
        const mnemonic = generateMnemonic(); 
        const securityCode = generateRandomCode(5);
        const { publicKey, privateKey } = generateKeys(); 
        const profileId = generateProfileId(safeUsername);
        
        const newUser: User = {
          address: publicKey,
          publicKey,
          privateKey,
          profileId,
          mnemonic,
          username: safeUsername,
          passwordHash,
          password: password, 
          salt,
          securityCode,
          role: 'user',
          balance: 0.000000000505, 
          usdBalance: 0,
          contacts: [],
          transactions: [],
          incidents: [],
          solvedBlocks: [],
          ownedNfts: [],
          shardsTowardNextQBS: 0,
          messagingActive: false,
          miningActive: false,
          xp: 0,
          level: 1
        };
        
        await saveUser(newUser);
        setNewlyCreatedUser(newUser);
        setAuthLayer(4); 
      } else {
        setAuthStatus('Locating Node Identity...');
        const user = await getUserByIdentifier(lookupId);
        if (user) {
          setAuthStatus('Computing PBKDF2 Chain...');
          const testHash = await hashSecret(password, user.salt);
          if (testHash === user.passwordHash) {
            setTempUser(user);
            setAuthLayer(2);
          } else {
            handleFailedAttempt();
            throw new Error('SIGNATURE MISMATCH: Hash verification failed.');
          }
        } else {
          handleFailedAttempt();
          throw new Error('NODE NOT FOUND: Identity missing from lattice.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'LATTICE ERROR: Access denied.');
    } finally {
      setIsAuthenticating(false);
      setAuthStatus('');
    }
  };

  const handleSecurityCodeVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    if (securityCodeInput.toUpperCase() === (tempUser.securityCode || '').toUpperCase()) {
      onLogin(tempUser);
    } else {
      setError('INVALID SECURITY CODE: Wave-function collapse.');
      handleFailedAttempt();
    }
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 3) setLockoutUntil(Date.now() + 60000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      <div className="w-full max-w-2xl relative z-10 space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-3">
          <div className="flex justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <LatticeLogo size="xl" />
          </div>
          <div className="pt-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Sovereign Lattice</h1>
            <p className="text-[10px] text-orange-500 font-bold tracking-[0.6em] uppercase mt-2">
              {authLayer === 2 ? 'SECONDARY SECURITY LAYER' : isRecover ? 'DEEP RECOVERY VAULT' : 'Hardened Cryptographic Node'}
            </p>
          </div>
        </div>

        <div className={`bg-zinc-900/60 backdrop-blur-3xl border ${isRecover ? 'border-purple-500/20' : 'border-white/10'} p-10 rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500`}>
          {authLayer === 1 && (
            <div className="space-y-6">
              <form onSubmit={handleAuth} className="space-y-6">
                <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} />
                
                {isRecover ? (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-black/40 p-6 rounded-3xl border border-purple-500/10">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-4 px-1">Input 24 Quantum Shards (Mnemonic)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {mnemonicInput.map((word, i) => (
                          <input 
                            key={i}
                            type="text"
                            value={word}
                            onChange={(e) => {
                              const updated = [...mnemonicInput];
                              updated[i] = e.target.value.toLowerCase().trim();
                              setMnemonicInput(updated);
                            }}
                            className="bg-black/60 border border-white/5 rounded-xl p-2 text-[10px] mono text-white outline-none focus:border-purple-500/50 transition-all text-center"
                            placeholder={`${i+1}`}
                            required
                          />
                        ))}
                      </div>
                    </div>
                    <div className="group">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Confirm Master Secret (Verification Gate)</label>
                      <input 
                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all text-white font-mono"
                        placeholder="Master Cipher Verification" required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="group">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Operational Alias</label>
                      <input 
                        type="text" value={username} onChange={e => setUsername(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all text-white font-medium"
                        placeholder="Enter Node Identity" required
                      />
                    </div>
                    <div className="group">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1">Master Access Secret</label>
                      <input 
                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all text-white font-mono"
                        placeholder="Input Mastery Cipher" required
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center animate-shake">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                {authStatus && (
                   <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{authStatus}</span>
                   </div>
                )}
                
                <button 
                  type="submit" disabled={isAuthenticating}
                  className={`w-full py-5 ${isRecover ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/20'} text-black border border-white/10 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50`}
                >
                  {isAuthenticating ? 'SYNCHRONIZING...' : isRecover ? 'RESTORE IDENTITY' : isRegister ? 'RESOLVE IDENTITY' : 'RESTORE CONNECTION'}
                </button>
              </form>

              {!isAuthenticating && !isRegister && !isRecover && (
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                   <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">System Status:</p>
                   <p className="text-[10px] text-green-500 font-black mono mt-1">Quantum Network Online</p>
                </div>
              )}

              <div className="flex flex-col gap-3 text-center pt-2">
                {!isRecover && (
                  <button type="button" onClick={() => { setIsRegister(!isRegister); setIsRecover(false); setError(''); }} className="text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest transition-colors">
                    {isRegister ? 'Return to Main Portal' : 'Generate New High-Entropy Node'}
                  </button>
                )}
                <button type="button" onClick={() => { setIsRecover(!isRecover); setIsRegister(false); setError(''); }} className={`text-[9px] ${isRecover ? 'text-orange-500' : 'text-purple-500'} hover:text-white uppercase font-black tracking-widest transition-colors`}>
                  {isRecover ? 'Cancel Recovery' : 'Recover Node Access (Mnemonic)'}
                </button>
              </div>
            </div>
          )}

          {authLayer === 2 && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                     <span className="text-3xl italic font-black">?</span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Verify Shard PIN</h2>
                  <p className="text-[9px] text-gray-500 uppercase font-black mt-2">Enter your 5-character secondary security code.</p>
                  <p className="text-[8px] text-orange-500 font-black uppercase mt-1">Genesis Hint: 77777</p>
               </div>

               <form onSubmit={handleSecurityCodeVerify} className="space-y-6">
                  <div className="group">
                    <input 
                      type="text" 
                      maxLength={5}
                      value={securityCodeInput}
                      onChange={e => setSecurityCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-3xl font-black text-center tracking-[1em] outline-none focus:border-blue-500 transition-all text-blue-400 font-mono shadow-inner transition-all text-center"
                      placeholder="*****"
                      autoFocus
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center animate-shake">
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{error}</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-xl shadow-blue-500/20"
                  >
                    AUTHORIZE ACCESS
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => { setAuthLayer(1); setTempUser(null); setSecurityCodeInput(''); setError(''); }}
                    className="w-full text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest transition-colors"
                  >
                    Identity Rollback
                  </button>
               </form>
            </div>
          )}

          {authLayer === 4 && newlyCreatedUser && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
                   <span className="text-2xl">✓</span>
                </div>
                <h2 className="text-md font-black text-white uppercase tracking-widest leading-tight">Hardened Shard Provisioned</h2>
                <p className="text-[8px] text-gray-500 uppercase font-black mt-2">THESE CREDENTIALS ARE MATHEMATICALLY UNRECOVERABLE.</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 text-center space-y-1">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Universal Profile ID</label>
                    <p className="text-xl font-black text-white tracking-widest">{newlyCreatedUser.profileId}</p>
                    <p className="text-[6px] text-gray-600 uppercase">Use this to find and add peers</p>
                 </div>

                 <div className="bg-black/60 p-6 rounded-3xl border border-white/5 space-y-3">
                    <label className="text-[7px] text-orange-500 font-black uppercase tracking-widest">Scientific Master Seed (24 Words)</label>
                    <div className="grid grid-cols-3 gap-2">
                       {newlyCreatedUser.mnemonic?.split(' ').map((word, i) => (
                         <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                            <span className="text-[6px] text-gray-600 block leading-none mb-1">{i+1}</span>
                            <span className="text-[9px] text-white font-bold mono">{word}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10 space-y-2 text-center">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Secondary Security PIN</label>
                    <p className="text-2xl font-black text-white mono tracking-[0.5em]">{newlyCreatedUser.securityCode}</p>
                    <p className="text-[6px] text-gray-600 font-black uppercase">REQUIRED FOR EVERY SUBSEQUENT LOGIN</p>
                 </div>

                 <div className="bg-black/60 p-5 rounded-3xl border border-white/5 space-y-1">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Bech32m-Extended Address</label>
                    <p className="text-[9px] text-blue-300 mono break-all leading-relaxed p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">{newlyCreatedUser.publicKey}</p>
                 </div>

                 <div className="bg-black/60 p-5 rounded-3xl border border-white/5 space-y-1">
                    <label className="text-[7px] text-gray-500 font-black uppercase tracking-widest">Master Access Secret</label>
                    <p className="text-xs font-black text-white mono p-2 bg-white/5 rounded-xl">••••••••••••••••••••</p>
                    <p className="text-[8px] text-gray-400 mt-2">Secret generated and secured. Please save it safely.</p>
                 </div>
              </div>

              <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-center">
                <p className="text-[9px] text-red-500 font-black uppercase leading-relaxed tracking-tighter">
                  SECURITY WARNING: System utilizes PBKDF2 iterations. Key loss results in permanent data entropy.
                </p>
              </div>

              <button 
                onClick={() => onLogin(newlyCreatedUser)}
                className="w-full py-5 bg-orange-500 text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] hover:bg-orange-400 transition-all"
              >
                ACTIVATE NODE
              </button>
            </div>
          )}
        </div>
        
        <div className="text-center opacity-40">
           <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.6em]">Sovereign Lattice Protocol v3.1.0-STABLE</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
