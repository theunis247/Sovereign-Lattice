/**
 * Enhanced Authentication Service
 * Integrates comprehensive error handling, user feedback, and automatic recovery
 * with the existing authentication system
 */

import { User } from '../types';
import { authErrorHandler, AuthError } from './authErrorHandler';
import { safeRegistry } from './safeRegistryService';
import { CryptoFallbackService } from './cryptoFallback';
import { 
  generateKeys, 
  saveUser, 
  getUserByIdentifier, 
  getUserByMnemonic, 
  hashSecret, 
  generateSalt, 
  sanitizeInput, 
  generateMnemonic, 
  generateRandomCode, 
  generateProfileId 
} from './db';

export interface AuthenticationRequest {
  username?: string;
  password: string;
  mnemonic?: string[];
  securityCode?: string;
  operation: 'login' | 'register' | 'recover' | 'verify_security_code';
  deviceFingerprint?: string;
}

export interface AuthenticationResponse {
  success: boolean;
  user?: User;
  error?: AuthError;
  userMessage?: string;
  nextStep?: 'security_code' | 'complete';
  sessionId: string;
  warnings?: string[];
  recoveryActions?: string[];
}

export interface AuthenticationState {
  sessionId: string;
  operation: string;
  step: 'credentials' | 'security_code' | 'complete';
  tempUser?: User;
  newUser?: User;
  attempts: number;
  lockoutUntil?: number;
  warnings: string[];
}

/**
 * Enhanced Authentication Service
 * Provides robust authentication with comprehensive error handling
 */
export class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private authStates: Map<string, AuthenticationState> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 60000; // 1 minute

  public static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  /**
   * Authenticate user with comprehensive error handling
   */
  public async authenticate(request: AuthenticationRequest): Promise<AuthenticationResponse> {
    const sessionId = authErrorHandler.startDiagnosticSession(request.operation, request.username);
    
    try {
      // Get or create authentication state
      let authState = this.authStates.get(sessionId);
      if (!authState) {
        authState = {
          sessionId,
          operation: request.operation,
          step: 'credentials',
          attempts: 0,
          warnings: []
        };
        this.authStates.set(sessionId, authState);
      }

      // Check for lockout
      if (authState.lockoutUntil && Date.now() < authState.lockoutUntil) {
        const remaining = Math.ceil((authState.lockoutUntil - Date.now()) / 1000);
        const error = await authErrorHandler.handleAuthError(
          `Account locked. ${remaining} seconds remaining.`,
          { operation: request.operation, lockoutRemaining: remaining },
          sessionId
        );
        
        authErrorHandler.endDiagnosticSession(sessionId, false);
        return {
          success: false,
          error,
          userMessage: error.userMessage,
          sessionId
        };
      }

      // Route to appropriate authentication method
      let response: AuthenticationResponse;
      
      switch (request.operation) {
        case 'login':
          response = await this.handleLogin(request, authState);
          break;
        case 'register':
          response = await this.handleRegistration(request, authState);
          break;
        case 'recover':
          response = await this.handleRecovery(request, authState);
          break;
        case 'verify_security_code':
          response = await this.handleSecurityCodeVerification(request, authState);
          break;
        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }

      // Update authentication state
      if (response.success) {
        authState.attempts = 0;
        authState.lockoutUntil = undefined;
        authErrorHandler.endDiagnosticSession(sessionId, true);
      } else {
        authState.attempts++;
        if (authState.attempts >= this.MAX_ATTEMPTS) {
          authState.lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
          authErrorHandler.addWarning(sessionId, `Account locked after ${this.MAX_ATTEMPTS} failed attempts`);
        }
        authErrorHandler.endDiagnosticSession(sessionId, false);
      }

      response.sessionId = sessionId;
      response.warnings = authState.warnings;

      return response;

    } catch (error) {
      const authError = await authErrorHandler.handleAuthError(
        error,
        { operation: request.operation, username: request.username },
        sessionId
      );
      
      authErrorHandler.endDiagnosticSession(sessionId, false);
      
      return {
        success: false,
        error: authError,
        userMessage: authError.userMessage,
        sessionId,
        recoveryActions: authError.recoveryActions
      };
    }
  }

  /**
   * Handle user login with enhanced error handling
   */
  private async handleLogin(request: AuthenticationRequest, authState: AuthenticationState): Promise<AuthenticationResponse> {
    try {
      if (!request.username || !request.password) {
        throw new Error('Username and password are required');
      }

      const lookupId = request.username.trim();
      const safeUsername = sanitizeInput(request.username);

      // Safely get user with error handling
      const userResult = await safeRegistry.getUserSafely(lookupId);
      
      if (!userResult.isValid || !userResult.user) {
        if (userResult.errors.length > 0) {
          throw new Error(`Database error: ${userResult.errors.join(', ')}`);
        }
        throw new Error('User not found');
      }

      const user = userResult.user;

      // Add warnings from registry service
      authState.warnings.push(...userResult.warnings);

      // Verify password with crypto fallback
      let passwordValid = false;
      try {
        const testHash = await hashSecret(request.password, user.salt);
        passwordValid = testHash === user.passwordHash;
      } catch (cryptoError) {
        // Try fallback crypto if main crypto fails
        authErrorHandler.addWarning(authState.sessionId, 'Using fallback cryptography for password verification');
        
        const fallbackResult = CryptoFallbackService.hashPassword(request.password, user.salt);
        if (fallbackResult.success) {
          passwordValid = fallbackResult.hash === user.passwordHash;
        } else {
          throw new Error('Password verification failed: cryptographic system unavailable');
        }
      }

      if (!passwordValid) {
        throw new Error('Invalid credentials');
      }

      // Store temp user for security code verification
      authState.tempUser = user;
      authState.step = 'security_code';

      return {
        success: true,
        nextStep: 'security_code',
        userMessage: 'Password verified. Please enter your security code.',
        sessionId: authState.sessionId
      };

    } catch (error) {
      const authError = await authErrorHandler.handleAuthError(
        error,
        { operation: 'login', username: request.username },
        authState.sessionId
      );

      return {
        success: false,
        error: authError,
        userMessage: authError.userMessage,
        sessionId: authState.sessionId
      };
    }
  }

  /**
   * Handle user registration with enhanced error handling
   */
  private async handleRegistration(request: AuthenticationRequest, authState: AuthenticationState): Promise<AuthenticationResponse> {
    try {
      if (!request.username || !request.password) {
        throw new Error('Username and password are required');
      }

      const lookupId = request.username.trim();
      const safeUsername = sanitizeInput(request.username);

      // Check if user already exists
      const existingUserResult = await safeRegistry.getUserSafely(lookupId);
      if (existingUserResult.user) {
        throw new Error('Username already exists');
      }

      // Generate secure credentials with fallback
      let salt: string;
      let passwordHash: string;
      let mnemonic: string;
      let securityCode: string;
      let keys: { publicKey: string; privateKey: string };
      let profileId: string;

      try {
        salt = generateSalt();
        passwordHash = await hashSecret(request.password, salt);
        mnemonic = generateMnemonic();
        securityCode = generateRandomCode(5);
        keys = generateKeys();
        profileId = generateProfileId(safeUsername);
      } catch (cryptoError) {
        authErrorHandler.addWarning(authState.sessionId, 'Using fallback cryptography for user creation');
        
        // Use crypto fallback service
        const saltResult = CryptoFallbackService.generateSalt();
        const hashResult = CryptoFallbackService.hashPassword(request.password, saltResult.salt);
        const mnemonicResult = CryptoFallbackService.generateMnemonic();
        const codeResult = CryptoFallbackService.generateSecurityCode();
        const keysResult = CryptoFallbackService.generateKeyPair();

        if (!saltResult.success || !hashResult.success || !mnemonicResult.success || 
            !codeResult.success || !keysResult.success) {
          throw new Error('Failed to generate secure credentials');
        }

        salt = saltResult.salt;
        passwordHash = hashResult.hash;
        mnemonic = mnemonicResult.mnemonic;
        securityCode = codeResult.code;
        keys = { publicKey: keysResult.publicKey, privateKey: keysResult.privateKey };
        profileId = `${safeUsername}_${Date.now()}`;
      }

      // Create new user with safe defaults
      const newUser = safeRegistry.initializeUserDataStructures({
        address: keys.publicKey,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        profileId,
        mnemonic,
        username: safeUsername,
        passwordHash,
        password: request.password,
        salt,
        securityCode,
        role: 'user',
        balance: 0.000000000505
      });

      // Save user with error handling
      const saveResult = await safeRegistry.saveUserSafely(newUser);
      if (!saveResult.success) {
        throw new Error(`Failed to save user: ${saveResult.errors.join(', ')}`);
      }

      // Add warnings from save operation
      authState.warnings.push(...saveResult.warnings);

      // Store new user for display
      authState.newUser = newUser;
      authState.step = 'complete';

      return {
        success: true,
        user: newUser,
        nextStep: 'complete',
        userMessage: 'Account created successfully! Please save your credentials securely.',
        sessionId: authState.sessionId
      };

    } catch (error) {
      const authError = await authErrorHandler.handleAuthError(
        error,
        { operation: 'register', username: request.username },
        authState.sessionId
      );

      return {
        success: false,
        error: authError,
        userMessage: authError.userMessage,
        sessionId: authState.sessionId
      };
    }
  }

  /**
   * Handle account recovery with enhanced error handling
   */
  private async handleRecovery(request: AuthenticationRequest, authState: AuthenticationState): Promise<AuthenticationResponse> {
    try {
      if (!request.mnemonic || !request.password) {
        throw new Error('Mnemonic phrase and password are required');
      }

      // Validate mnemonic completeness
      if (request.mnemonic.some(word => !word.trim())) {
        throw new Error('All 24 mnemonic words must be provided');
      }

      const mnemonicString = request.mnemonic.join(' ').trim();

      // Attempt to recover user
      let recoveredUser: User | null = null;
      try {
        recoveredUser = await getUserByMnemonic(mnemonicString);
      } catch (dbError) {
        throw new Error('Recovery database query failed');
      }

      if (!recoveredUser) {
        throw new Error('No account found with the provided mnemonic phrase');
      }

      // Verify password with crypto fallback
      let passwordValid = false;
      try {
        const testHash = await hashSecret(request.password, recoveredUser.salt);
        passwordValid = testHash === recoveredUser.passwordHash;
      } catch (cryptoError) {
        authErrorHandler.addWarning(authState.sessionId, 'Using fallback cryptography for recovery verification');
        
        const fallbackResult = CryptoFallbackService.hashPassword(request.password, recoveredUser.salt);
        if (fallbackResult.success) {
          passwordValid = fallbackResult.hash === recoveredUser.passwordHash;
        } else {
          throw new Error('Password verification failed during recovery');
        }
      }

      if (!passwordValid) {
        throw new Error('Mnemonic phrase verified, but password is incorrect');
      }

      // Validate and fix user structure if needed
      const validationResult = safeRegistry.validateAndFixUserStructure(recoveredUser);
      if (validationResult.fixedFields.length > 0) {
        authState.warnings.push(`Recovered account data was repaired: ${validationResult.fixedFields.join(', ')}`);
        
        // Save the fixed user data
        const saveResult = await safeRegistry.saveUserSafely(recoveredUser);
        if (!saveResult.success) {
          authState.warnings.push('Warning: Could not save repaired account data');
        }
      }

      // Store temp user for security code verification
      authState.tempUser = recoveredUser;
      authState.step = 'security_code';

      return {
        success: true,
        nextStep: 'security_code',
        userMessage: 'Account recovered successfully. Please enter your security code.',
        sessionId: authState.sessionId
      };

    } catch (error) {
      const authError = await authErrorHandler.handleAuthError(
        error,
        { operation: 'recover' },
        authState.sessionId
      );

      return {
        success: false,
        error: authError,
        userMessage: authError.userMessage,
        sessionId: authState.sessionId
      };
    }
  }

  /**
   * Handle security code verification with enhanced error handling
   */
  private async handleSecurityCodeVerification(request: AuthenticationRequest, authState: AuthenticationState): Promise<AuthenticationResponse> {
    try {
      if (!request.securityCode) {
        throw new Error('Security code is required');
      }

      if (!authState.tempUser) {
        throw new Error('No pending authentication session');
      }

      const providedCode = request.securityCode.toUpperCase().trim();
      const expectedCode = (authState.tempUser.securityCode || '').toUpperCase().trim();

      if (providedCode !== expectedCode) {
        throw new Error('Invalid security code');
      }

      // Authentication complete
      authState.step = 'complete';

      return {
        success: true,
        user: authState.tempUser,
        nextStep: 'complete',
        userMessage: 'Authentication successful! Welcome back.',
        sessionId: authState.sessionId
      };

    } catch (error) {
      const authError = await authErrorHandler.handleAuthError(
        error,
        { operation: 'verify_security_code' },
        authState.sessionId
      );

      return {
        success: false,
        error: authError,
        userMessage: authError.userMessage,
        sessionId: authState.sessionId
      };
    }
  }

  /**
   * Get authentication state for a session
   */
  public getAuthState(sessionId: string): AuthenticationState | null {
    return this.authStates.get(sessionId) || null;
  }

  /**
   * Clear authentication state for a session
   */
  public clearAuthState(sessionId: string): void {
    this.authStates.delete(sessionId);
  }

  /**
   * Get diagnostic information for a session
   */
  public getDiagnostics(sessionId: string) {
    return authErrorHandler.getDiagnostics(sessionId);
  }

  /**
   * Clean up old authentication states
   */
  public cleanup(): void {
    const cutoff = Date.now() - (30 * 60 * 1000); // 30 minutes
    
    for (const [sessionId, authState] of this.authStates.entries()) {
      // Remove states older than 30 minutes or completed states older than 5 minutes
      const stateAge = Date.now() - parseInt(sessionId.split('_')[1]);
      const shouldRemove = stateAge > cutoff || 
        (authState.step === 'complete' && stateAge > 5 * 60 * 1000);
      
      if (shouldRemove) {
        this.authStates.delete(sessionId);
      }
    }

    // Clean up old diagnostics
    authErrorHandler.clearOldDiagnostics();
  }

  /**
   * Get error pattern statistics for monitoring
   */
  public getErrorPatterns() {
    return authErrorHandler.getErrorPatterns();
  }
}

// Export singleton instance
export const enhancedAuth = EnhancedAuthService.getInstance();

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    enhancedAuth.cleanup();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}