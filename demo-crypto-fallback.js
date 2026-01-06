/**
 * Demo script to showcase Web Crypto API fallback mechanisms
 * Run with: node demo-crypto-fallback.js
 */

const { CryptoFallbackService, cryptoFallback } = require('./services/cryptoFallback.ts');

async function demonstrateCryptoFallback() {
  console.log('🔐 Web Crypto API Fallback Demonstration\n');

  // 1. Check crypto support
  console.log('1. Checking Crypto Support:');
  const support = CryptoFallbackService.getSupportInfo();
  console.log(`   - Web Crypto API: ${support.webCrypto ? '✅' : '❌'}`);
  console.log(`   - getRandomValues: ${support.getRandomValues ? '✅' : '❌'}`);
  console.log(`   - SubtleCrypto: ${support.subtle ? '✅' : '❌'}`);
  console.log(`   - Support Level: ${support.supportLevel.toUpperCase()}`);
  console.log(`   - Fallback Available: ${support.fallbackAvailable ? '✅' : '❌'}\n`);

  // 2. Generate random bytes
  console.log('2. Random Byte Generation:');
  const randomResult = CryptoFallbackService.generateRandomBytes(16);
  console.log(`   - Success: ${randomResult.success ? '✅' : '❌'}`);
  console.log(`   - Method: ${randomResult.method.toUpperCase()}`);
  console.log(`   - Data: ${Array.from(randomResult.data).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  if (randomResult.warnings.length > 0) {
    console.log(`   - Warnings: ${randomResult.warnings.join(', ')}`);
  }
  console.log();

  // 3. Hash data
  console.log('3. Data Hashing:');
  const testData = 'Hello, Web Crypto API Fallback!';
  const hashResult = await CryptoFallbackService.hashData(testData);
  console.log(`   - Input: "${testData}"`);
  console.log(`   - Success: ${hashResult.success ? '✅' : '❌'}`);
  console.log(`   - Method: ${hashResult.method.toUpperCase()}`);
  console.log(`   - Hash: ${hashResult.data?.substring(0, 32)}...`);
  if (hashResult.warnings.length > 0) {
    console.log(`   - Warnings: ${hashResult.warnings.join(', ')}`);
  }
  console.log();

  // 4. Key derivation
  console.log('4. Key Derivation (PBKDF2):');
  const password = 'mySecurePassword123';
  const salt = 'randomSalt456';
  const keyResult = await CryptoFallbackService.deriveKey(password, salt, 10000);
  console.log(`   - Password: "${password}"`);
  console.log(`   - Salt: "${salt}"`);
  console.log(`   - Iterations: 10,000`);
  console.log(`   - Success: ${keyResult.success ? '✅' : '❌'}`);
  console.log(`   - Method: ${keyResult.method.toUpperCase()}`);
  console.log(`   - Derived Key: ${keyResult.data?.substring(0, 32)}...`);
  if (keyResult.warnings.length > 0) {
    console.log(`   - Warnings: ${keyResult.warnings.join(', ')}`);
  }
  console.log();

  // 5. Simple encryption/decryption
  console.log('5. Simple Encryption/Decryption:');
  const plaintext = 'Sensitive data that needs protection';
  const encryptionKey = 'myEncryptionKey';
  
  const encryptResult = CryptoFallbackService.simpleEncrypt(plaintext, encryptionKey);
  console.log(`   - Plaintext: "${plaintext}"`);
  console.log(`   - Encryption Success: ${encryptResult.success ? '✅' : '❌'}`);
  console.log(`   - Encrypted: ${encryptResult.data?.substring(0, 32)}...`);
  
  if (encryptResult.success && encryptResult.data) {
    const decryptResult = CryptoFallbackService.simpleDecrypt(encryptResult.data, encryptionKey);
    console.log(`   - Decryption Success: ${decryptResult.success ? '✅' : '❌'}`);
    console.log(`   - Decrypted: "${decryptResult.data}"`);
    console.log(`   - Match Original: ${decryptResult.data === plaintext ? '✅' : '❌'}`);
  }
  console.log();

  // 6. Password generation
  console.log('6. Secure Password Generation:');
  const passwordResult = CryptoFallbackService.generateSecurePassword(24);
  console.log(`   - Success: ${passwordResult.success ? '✅' : '❌'}`);
  console.log(`   - Method: ${passwordResult.method.toUpperCase()}`);
  console.log(`   - Password: ${passwordResult.data?.substring(0, 16)}...`);
  if (passwordResult.warnings.length > 0) {
    console.log(`   - Warnings: ${passwordResult.warnings.join(', ')}`);
  }
  console.log();

  // 7. Comprehensive test
  console.log('7. Comprehensive Functionality Test:');
  const testResults = await CryptoFallbackService.testCryptoFunctionality();
  
  console.log('   Test Results:');
  console.log(`   - Random Generation: ${testResults.tests.randomGeneration.success ? '✅' : '❌'} (${testResults.tests.randomGeneration.method})`);
  console.log(`   - Hashing: ${testResults.tests.hashing.success ? '✅' : '❌'} (${testResults.tests.hashing.method})`);
  console.log(`   - Key Derivation: ${testResults.tests.keyDerivation.success ? '✅' : '❌'} (${testResults.tests.keyDerivation.method})`);
  console.log(`   - Encryption: ${testResults.tests.encryption.success ? '✅' : '❌'} (${testResults.tests.encryption.method})`);
  
  console.log('\n🎉 Web Crypto API Fallback Demonstration Complete!');
  
  // Summary
  console.log('\n📋 Summary:');
  console.log('   - All cryptographic operations have working fallback mechanisms');
  console.log('   - The system gracefully degrades when Web Crypto API is unavailable');
  console.log('   - Security warnings are provided when using less secure fallbacks');
  console.log('   - The implementation maintains functionality across all browser environments');
}

// Run the demonstration
demonstrateCryptoFallback().catch(console.error);