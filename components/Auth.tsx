
import React, { useState, useEffect } from 'react';
import { generateKeys, saveUser, getUserByIdentifier, getUserByMnemonic, hashSecret, generateSalt, sanitizeInput, generateMnemonic, generateRandomCode, generateProfileId } from '../services/db';
import { User } from '../types';
import LatticeLogo from './LatticeLogo';
import { useStyling } from '../services/useStyling';
import { enhancedAuth, AuthenticationRequest } from '../services/enhancedAuth';
import { authErrorHandler } from '../services/authErrorHandler';

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
  
  // Enhanced authentication state
  const [sessionId, setSessionId] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<string[]>([]);

  // Use styling hook
  const { stylingState, getClasses, shouldUseFallback } = useStyling();

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
    setWarnings([]);
    setRecoveryActions([]);

    if (honeypot) return;

    setIsAuthenticating(true);
    setAuthStatus('Initializing secure authentication...');

    try {
      const request: AuthenticationRequest = {
        username: username.trim(),
        password,
        operation: isRecover ? 'recover' : (isRegister ? 'register' : 'login'),
        mnemonic: isRecover ? mnemonicInput : undefined
      };

      const response = await enhancedAuth.authenticate(request);
      setSessionId(response.sessionId);

      if (response.warnings) {
        setWarnings(response.warnings);
      }

      if (response.recoveryActions) {
        setRecoveryActions(response.recoveryActions);
      }

      if (response.success) {
        if (response.nextStep === 'security_code') {
          setAuthLayer(2);
          setAuthStatus('');
          
          // Get the temp user from auth state
          const authState = enhancedAuth.getAuthState(response.sessionId);
          if (authState?.tempUser) {
            setTempUser(authState.tempUser);
          }
        } else if (response.nextStep === 'complete') {
          if (isRegister && response.user) {
            setNewlyCreatedUser(response.user);
            setAuthLayer(4);
          } else if (response.user) {
            onLogin(response.user);
          }
        }
      } else {
        // Handle authentication error
        if (response.error) {
          setError(response.userMessage || response.error.userMessage);
          
          // Check if this is a lockout error
          if (response.error.code === 'ACCOUNT_LOCKED') {
            const lockoutMatch = response.error.message.match(/(\d+) seconds/);
            if (lockoutMatch) {
              setLockoutUntil(Date.now() + parseInt(lockoutMatch[1]) * 1000);
            }
          }
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (err: any) {
      // Fallback error handling for unexpected errors
      const errorMessage = err.message || 'An unexpected error occurred during authentication.';
      setError('System error: Please try again or contact support if the problem persists.');
      
      // Log the error for diagnostics
      console.error('Authentication system error:', err);
    } finally {
      setIsAuthenticating(false);
      setAuthStatus('');
    }
  };

  const handleSecurityCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    
    setIsAuthenticating(true);
    setError('');
    setWarnings([]);

    try {
      const request: AuthenticationRequest = {
        securityCode: securityCodeInput,
        operation: 'verify_security_code',
        password: '' // Not needed for security code verification
      };

      const response = await enhancedAuth.authenticate(request);

      if (response.warnings) {
        setWarnings(response.warnings);
      }

      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        setError(response.userMessage || 'Invalid security code. Please try again.');
        
        // Check for lockout
        if (response.error?.code === 'ACCOUNT_LOCKED') {
          const lockoutMatch = response.error.message.match(/(\d+) seconds/);
          if (lockoutMatch) {
            setLockoutUntil(Date.now() + parseInt(lockoutMatch[1]) * 1000);
          }
        }
      }
    } catch (err: any) {
      setError('Security verification failed. Please try again.');
      console.error('Security code verification error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 3) setLockoutUntil(Date.now() + 60000);
  };

  return (
    <div className={getClasses(
      "min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden font-sans",
      "fallback-container"
    )}>
      <div className={getClasses(
        "w-full max-w-2xl relative z-10 space-y-8 animate-in fade-in duration-700",
        "fallback-card"
      )}>
        <div className={getClasses("text-center space-y-3", "")}>
          <div className={getClasses(
            "flex justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500",
            "flex justify-center"
          )}>
            <LatticeLogo size="xl" />
          </div>
          <div className={getClasses("pt-4", "")}>
            <h1 className={getClasses(
              "text-4xl font-black tracking-tighter uppercase italic",
              "fallback-title"
            )}>Sovereign Lattice</h1>
            <p className={getClasses(
              "text-[10px] text-orange-500 font-bold tracking-[0.6em] uppercase mt-2",
              "fallback-subtitle"
            )}>
              {authLayer === 2 ? 'SECONDARY SECURITY LAYER' : isRecover ? 'DEEP RECOVERY VAULT' : 'Hardened Cryptographic Node'}
            </p>
          </div>
        </div>

        {/* Styling Status Indicator */}
        {stylingState.fallbackMode && (
          <div className={getClasses(
            "bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl text-center",
            "fallback-error"
          )}>
            <p className={getClasses(
              "text-[8px] text-yellow-500 font-black uppercase tracking-widest",
              "fallback-error-text"
            )}>
              ⚠️ FALLBACK MODE ACTIVE - Enhanced compatibility enabled
            </p>
          </div>
        )}

        <div className={getClasses(
          `bg-zinc-900/60 backdrop-blur-3xl border ${isRecover ? 'border-purple-500/20' : 'border-white/10'} p-10 rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500`,
          "fallback-card"
        )}>
          {authLayer === 1 && (
            <div className={getClasses("space-y-6", "")}>
              <form onSubmit={handleAuth} className={getClasses("space-y-6", "fallback-form")}>
                <input type="text" value={honeypot} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} />
                
                {isRecover ? (
                  <div className={getClasses("space-y-6 animate-in slide-in-from-top-4 duration-500", "")}>
                    <div className={getClasses("bg-black/40 p-6 rounded-3xl border border-purple-500/10", "fallback-input-group")}>
                      <label className={getClasses(
                        "text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-4 px-1",
                        "fallback-label"
                      )}>Input 24 Quantum Shards (Mnemonic)</label>
                      <div className={getClasses("grid grid-cols-2 md:grid-cols-4 gap-2", "fallback-grid-4")}>
                        {mnemonicInput.map((word: string, i: number) => (
                          <input 
                            key={i}
                            type="text"
                            value={word}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const updated = [...mnemonicInput];
                              updated[i] = e.target.value.toLowerCase().trim();
                              setMnemonicInput(updated);
                            }}
                            className={getClasses(
                              "bg-black/60 border border-white/5 rounded-xl p-2 text-[10px] mono text-white outline-none focus:border-purple-500/50 transition-all text-center",
                              "fallback-mnemonic-input"
                            )}
                            placeholder={`${i+1}`}
                            required
                          />
                        ))}
                      </div>
                    </div>
                    <div className={getClasses("group", "fallback-input-group")}>
                      <label className={getClasses(
                        "text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1",
                        "fallback-label"
                      )}>Confirm Master Secret (Verification Gate)</label>
                      <input 
                        type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className={getClasses(
                          "w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-purple-500 transition-all text-white font-mono",
                          "fallback-input"
                        )}
                        placeholder="Master Cipher Verification" required
                      />
                    </div>
                  </div>
                ) : (
                  <div className={getClasses("space-y-4 animate-in slide-in-from-bottom-4 duration-500", "")}>
                    <div className={getClasses("group", "fallback-input-group")}>
                      <label className={getClasses(
                        "text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1",
                        "fallback-label"
                      )}>Operational Alias</label>
                      <input 
                        type="text" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        className={getClasses(
                          "w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all text-white font-medium",
                          "fallback-input"
                        )}
                        placeholder="Enter Node Identity" required
                      />
                    </div>
                    <div className={getClasses("group", "fallback-input-group")}>
                      <label className={getClasses(
                        "text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2 px-1",
                        "fallback-label"
                      )}>Master Access Secret</label>
                      <input 
                        type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className={getClasses(
                          "w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-all text-white font-mono",
                          "fallback-input"
                        )}
                        placeholder="Input Mastery Cipher" required
                      />
                    </div>
                  </div>
                )}

        {/* Enhanced Error Display */}
        {error && (
          <div className={getClasses(
            "bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center animate-shake",
            "fallback-error fallback-shake"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-red-500">⚠️</span>
              <p className={getClasses(
                "text-[10px] text-red-500 font-black uppercase tracking-widest",
                "fallback-error-text"
              )}>Authentication Error</p>
            </div>
            <p className={getClasses(
              "text-[9px] text-red-400 leading-relaxed",
              "fallback-error-text"
            )}>{error}</p>
            
            {/* Recovery Actions */}
            {recoveryActions.length > 0 && (
              <div className="mt-3 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                <p className="text-[8px] text-red-300 font-bold mb-1">Suggested Actions:</p>
                <ul className="text-[7px] text-red-300 space-y-1">
                  {recoveryActions.map((action, index) => (
                    <li key={index}>• {action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* System Warnings */}
        {warnings.length > 0 && (
          <div className={getClasses(
            "bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl",
            "fallback-warning"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-yellow-500">⚠️</span>
              <p className={getClasses(
                "text-[9px] text-yellow-500 font-black uppercase tracking-widest",
                "fallback-warning-text"
              )}>System Notices</p>
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className={getClasses(
                  "text-[8px] text-yellow-400 leading-relaxed",
                  "fallback-warning-text"
                )}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

                {authStatus && (
                   <div className={getClasses(
                     "flex items-center justify-center gap-3",
                     "fallback-loading"
                   )}>
                      <div className={getClasses(
                        "w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin",
                        "fallback-spinner"
                      )}></div>
                      <span className={getClasses(
                        "text-[10px] font-black uppercase tracking-widest text-orange-500",
                        "fallback-loading-text"
                      )}>{authStatus}</span>
                   </div>
                )}
                
                <button 
                  type="submit" disabled={isAuthenticating}
                  className={getClasses(
                    `w-full py-5 ${isRecover ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/20'} text-black border border-white/10 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50`,
                    "fallback-button"
                  )}
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

              <div className={getClasses("flex flex-col gap-3 text-center pt-2", "")}>
                {!isRecover && (
                  <button type="button" onClick={() => { setIsRegister(!isRegister); setIsRecover(false); setError(''); }} className={getClasses(
                    "text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest transition-colors",
                    "fallback-link"
                  )}>
                    {isRegister ? 'Return to Main Portal' : 'Generate New High-Entropy Node'}
                  </button>
                )}
                <button type="button" onClick={() => { setIsRecover(!isRecover); setIsRegister(false); setError(''); }} className={getClasses(
                  `text-[9px] ${isRecover ? 'text-orange-500' : 'text-purple-500'} hover:text-white uppercase font-black tracking-widest transition-colors`,
                  "fallback-link"
                )}>
                  {isRecover ? 'Cancel Recovery' : 'Recover Node Access (Mnemonic)'}
                </button>
              </div>
            </div>
          )}

          {authLayer === 2 && (
            <div className={getClasses("space-y-8 animate-in zoom-in-95 duration-500", "")}>
               <div className={getClasses("text-center", "")}>
                  <div className={getClasses(
                    "w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30",
                    ""
                  )}>
                     <span className={getClasses("text-3xl italic font-black", "")}>?</span>
                  </div>
                  <h2 className={getClasses("text-xl font-black text-white uppercase tracking-widest", "fallback-title")}>Verify Shard PIN</h2>
                  <p className={getClasses("text-[9px] text-gray-500 uppercase font-black mt-2", "fallback-label")}>Enter your 5-character secondary security code.</p>
                  <p className={getClasses("text-[8px] text-orange-500 font-black uppercase mt-1", "fallback-subtitle")}>Genesis Hint: 77777</p>
               </div>

               <form onSubmit={handleSecurityCodeVerify} className={getClasses("space-y-6", "fallback-form")}>
                  <div className={getClasses("group", "fallback-input-group")}>
                    <input 
                      type="text" 
                      maxLength={5}
                      value={securityCodeInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecurityCodeInput(e.target.value.toUpperCase())}
                      className={getClasses(
                        "w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-3xl font-black text-center tracking-[1em] outline-none focus:border-blue-500 transition-all text-blue-400 font-mono shadow-inner transition-all text-center",
                        "fallback-security-input"
                      )}
                      placeholder="*****"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Enhanced Error Display for Security Code */}
                  {error && (
                    <div className={getClasses(
                      "bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center animate-shake",
                      "fallback-error fallback-shake"
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-red-500">🔒</span>
                        <p className={getClasses(
                          "text-[10px] text-red-500 font-black uppercase tracking-widest",
                          "fallback-error-text"
                        )}>Security Verification Failed</p>
                      </div>
                      <p className={getClasses(
                        "text-[9px] text-red-400 leading-relaxed",
                        "fallback-error-text"
                      )}>{error}</p>
                      
                      {lockoutUntil && Date.now() < lockoutUntil && (
                        <div className="mt-2 p-2 bg-red-500/5 rounded-lg">
                          <p className="text-[8px] text-red-300">
                            Account temporarily locked for security. Please wait before trying again.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security Code Warnings */}
                  {warnings.length > 0 && (
                    <div className={getClasses(
                      "bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl",
                      "fallback-info"
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-blue-500">ℹ️</span>
                        <p className={getClasses(
                          "text-[9px] text-blue-500 font-black uppercase tracking-widest",
                          "fallback-info-text"
                        )}>Security Notices</p>
                      </div>
                      <ul className="space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index} className={getClasses(
                            "text-[8px] text-blue-400 leading-relaxed",
                            "fallback-info-text"
                          )}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className={getClasses(
                      "w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-xl shadow-blue-500/20",
                      "fallback-button"
                    )}
                  >
                    AUTHORIZE ACCESS
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => { setAuthLayer(1); setTempUser(null); setSecurityCodeInput(''); setError(''); }}
                    className={getClasses(
                      "w-full text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest transition-colors",
                      "fallback-link"
                    )}
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
                <h2 className="text-md font-black text-white uppercase tracking-widest leading-tight">Account Successfully Created!</h2>
                <p className="text-[8px] text-gray-500 uppercase font-black mt-2">Welcome to Sovereign Lattice Platform</p>
              </div>

              {/* Critical Security Warning */}
              <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-center space-y-2">
                <div className="w-8 h-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg">⚠️</span>
                </div>
                <h3 className="text-[10px] text-red-500 font-black uppercase tracking-widest">CRITICAL SECURITY NOTICE</h3>
                <div className="text-[8px] text-red-400 leading-relaxed space-y-1">
                  <p>• <strong>COPY AND SAVE</strong> all credentials below immediately</p>
                  <p>• <strong>STORE SECURELY</strong> - We cannot recover lost credentials</p>
                  <p>• <strong>NEVER SHARE</strong> your private keys or mnemonic phrase</p>
                  <p>• <strong>BACKUP MULTIPLE LOCATIONS</strong> - Digital and physical copies</p>
                </div>
              </div>

              {/* Account Management Info */}
              <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 text-center space-y-2">
                <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg">⚙️</span>
                </div>
                <h3 className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Account Management</h3>
                <div className="text-[8px] text-blue-400 leading-relaxed space-y-1">
                  <p>• <strong>CHANGE LOGIN DETAILS</strong> anytime in Settings Dashboard</p>
                  <p>• <strong>UPDATE SECURITY</strong> - Modify password and security code</p>
                  <p>• <strong>MANAGE PROFILE</strong> - Edit username and personal information</p>
                  <p>• <strong>BACKUP OPTIONS</strong> - Export and import account data</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 text-center space-y-1">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Universal Profile ID</label>
                    <p className="text-xl font-black text-white tracking-widest">{newlyCreatedUser.profileId}</p>
                    <p className="text-[6px] text-gray-600 uppercase">Use this to find and add peers</p>
                    <div className="mt-2 p-2 bg-blue-500/5 rounded-lg">
                      <p className="text-[7px] text-blue-300">💡 This is your unique identifier on the platform</p>
                    </div>
                 </div>

                 <div className="bg-black/60 p-6 rounded-3xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[7px] text-orange-500 font-black uppercase tracking-widest">Scientific Master Seed (24 Words)</label>
                      <div className="text-[6px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">BACKUP REQUIRED</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       {newlyCreatedUser.mnemonic?.split(' ').map((word, i) => (
                         <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                            <span className="text-[6px] text-gray-600 block leading-none mb-1">{i+1}</span>
                            <span className="text-[9px] text-white font-bold mono">{word}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-3 p-3 bg-orange-500/5 rounded-lg border border-orange-500/10">
                      <p className="text-[7px] text-orange-300 leading-relaxed">
                        🔐 <strong>CRITICAL:</strong> This 24-word phrase is your master backup. Write it down and store it safely. 
                        You can use this to recover your account on any device. Never share it with anyone!
                      </p>
                    </div>
                 </div>

                 <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10 space-y-2 text-center">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Secondary Security PIN</label>
                    <p className="text-2xl font-black text-white mono tracking-[0.5em]">{newlyCreatedUser.securityCode}</p>
                    <p className="text-[6px] text-gray-600 font-black uppercase">REQUIRED FOR EVERY LOGIN</p>
                    <div className="mt-2 p-2 bg-blue-500/5 rounded-lg">
                      <p className="text-[7px] text-blue-300">🔢 Save this PIN - you'll need it every time you log in</p>
                    </div>
                 </div>

                 <div className="bg-black/60 p-5 rounded-3xl border border-white/5 space-y-1">
                    <label className="text-[7px] text-blue-400 font-black uppercase tracking-widest">Blockchain Address</label>
                    <p className="text-[9px] text-blue-300 mono break-all leading-relaxed p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">{newlyCreatedUser.publicKey}</p>
                    <div className="mt-2 p-2 bg-blue-500/5 rounded-lg">
                      <p className="text-[7px] text-blue-300">🌐 Your public address for receiving QBS tokens and transactions</p>
                    </div>
                 </div>

                 <div className="bg-black/60 p-5 rounded-3xl border border-white/5 space-y-1">
                    <label className="text-[7px] text-gray-500 font-black uppercase tracking-widest">Master Access Secret</label>
                    <p className="text-xs font-black text-white mono p-2 bg-white/5 rounded-xl">••••••••••••••••••••</p>
                    <p className="text-[8px] text-gray-400 mt-2">Secret generated and secured. Please save it safely.</p>
                    <div className="mt-2 p-2 bg-gray-500/5 rounded-lg">
                      <p className="text-[7px] text-gray-400">🔒 Your encrypted password is safely stored and can be changed in Settings</p>
                    </div>
                 </div>
              </div>

              {/* Platform Features Info */}
              <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 space-y-3">
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg">🚀</span>
                  </div>
                  <h3 className="text-[10px] text-green-500 font-black uppercase tracking-widest">What's Next?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[7px] text-green-400">
                  <div className="space-y-1">
                    <p><strong>🔬 Start Mining:</strong> Earn QBS tokens through scientific breakthroughs</p>
                    <p><strong>🔗 Connect Wallet:</strong> Link your MetaMask for blockchain transactions</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>⚙️ Visit Settings:</strong> Customize your profile and security</p>
                    <p><strong>🎓 Get API Key:</strong> Add DeepSeek AI key for breakthrough evaluation</p>
                  </div>
                </div>
              </div>

              {/* Settings Dashboard Info */}
              <div className="bg-purple-500/10 p-5 rounded-2xl border border-purple-500/20 text-center space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg">⚙️</span>
                </div>
                <h3 className="text-[10px] text-purple-500 font-black uppercase tracking-widest">Settings Dashboard Access</h3>
                <div className="text-[8px] text-purple-400 leading-relaxed space-y-1">
                  <p>After logging in, click the <strong>Settings</strong> button to:</p>
                  <p>• <strong>Change Username & Password</strong> - Update your login credentials</p>
                  <p>• <strong>Modify Security Code</strong> - Change your PIN for enhanced security</p>
                  <p>• <strong>Update Profile Info</strong> - Edit bio, tagline, and personal details</p>
                  <p>• <strong>Manage API Keys</strong> - Add/remove DeepSeek and other service keys</p>
                  <p>• <strong>Export Account Data</strong> - Backup your profile and transaction history</p>
                </div>
              </div>

              <button 
                onClick={() => onLogin(newlyCreatedUser)}
                className={getClasses(
                  "w-full py-5 bg-orange-500 text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20",
                  "fallback-button"
                )}
              >
                🚀 ENTER SOVEREIGN LATTICE PLATFORM
              </button>

              <div className="text-center space-y-2">
                <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Remember:</p>
                <p className="text-[8px] text-gray-400 leading-relaxed">
                  Save all credentials above • Visit Settings to customize your account • 
                  Start mining to earn QBS tokens • Connect MetaMask for blockchain features
                </p>
              </div>
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
