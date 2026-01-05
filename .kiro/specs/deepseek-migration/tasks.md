# Implementation Plan

- [ ] 1. Create DeepSeek API client service
  - Create new service file for DeepSeek API integration
  - Implement authentication and request handling
  - Add response parsing and validation utilities
  - _Requirements: 3.1, 3.2, 3.3, 4.4_

- [ ] 1.1 Implement DeepSeek client class
  - Write DeepSeekClient class with configuration management
  - Add methods for chat completion API calls
  - Implement structured JSON response parsing
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 1.2 Add error handling and retry logic
  - Implement comprehensive error handling for API failures
  - Add retry logic with exponential backoff
  - Create fallback responses for service unavailability
  - _Requirements: 3.3, 3.4_

- [ ] 1.3 Create response validation utilities
  - Add JSON schema validation for AI responses
  - Implement type-safe response parsing
  - Add validation for required fields and formats
  - _Requirements: 3.5_

- [ ] 2. Update environment configuration
  - Replace Gemini API configuration with DeepSeek settings
  - Update Vite configuration for new environment variables
  - Add API key validation and error messaging
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2.1 Update environment variables
  - Replace GEMINI_API_KEY with DEEPSEEK_API_KEY in .env.local
  - Add DEEPSEEK_BASE_URL and DEEPSEEK_MODEL configuration
  - Update vite.config.ts to expose DeepSeek variables
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 2.2 Add configuration validation
  - Implement API key format validation
  - Add environment variable presence checks
  - Create user-friendly error messages for missing configuration
  - _Requirements: 4.3, 4.4_

- [ ] 3. Migrate mining evaluation system
  - Replace GoogleGenAI usage in handleMiningComplete function
  - Update prompt structure for DeepSeek API format
  - Maintain existing grading rubric and reward calculations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.4_

- [ ] 3.1 Update mining completion handler
  - Replace GoogleGenAI instantiation with DeepSeekClient
  - Convert Gemini prompt format to DeepSeek message format
  - Update response parsing for DeepSeek response structure
  - _Requirements: 1.1, 1.2, 5.1_

- [ ] 3.2 Maintain grading system compatibility
  - Ensure S, A, B, C grading system works with DeepSeek
  - Preserve existing reward multipliers and QBS bonus logic
  - Keep same breakthrough scoring and explanation format
  - _Requirements: 1.5, 5.4_

- [ ] 3.3 Add mining evaluation error handling
  - Implement fallback grading when API fails
  - Add user notifications for API errors
  - Ensure mining can complete even without AI evaluation
  - _Requirements: 1.4_

- [ ] 4. Migrate breakthrough evolution system
  - Replace GoogleGenAI usage in handleEvolveBreakthrough function
  - Update evolution prompt structure for DeepSeek format
  - Maintain existing advancement levels and cost structure
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2, 5.4_

- [ ] 4.1 Update evolution handler
  - Replace GoogleGenAI instantiation with DeepSeekClient
  - Convert evolution prompt to DeepSeek message format
  - Update response parsing for evolved explanations and formulas
  - _Requirements: 2.1, 2.2, 5.2_

- [ ] 4.2 Preserve evolution mechanics
  - Maintain existing evolution cost (25 QRK) and XP rewards
  - Keep advancement level progression system
  - Preserve QBS magnitude bonuses for S and A grades
  - _Requirements: 2.5, 5.4_

- [ ] 4.3 Add evolution error handling
  - Implement error feedback when evolution fails
  - Add retry mechanisms for failed evolution attempts
  - Ensure user funds are not deducted on API failures
  - _Requirements: 2.4_

- [ ] 5. Update package dependencies
  - Remove @google/genai dependency
  - Add any required HTTP client dependencies
  - Update package.json and install new dependencies
  - _Requirements: 3.1_

- [ ] 5.1 Remove Gemini dependencies
  - Remove @google/genai from package.json
  - Clean up unused Gemini imports from App.tsx
  - Remove Gemini-specific type imports
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.2 Add HTTP client if needed
  - Evaluate if additional HTTP client is needed for DeepSeek API
  - Add fetch polyfills or axios if required
  - Update TypeScript types for HTTP requests
  - _Requirements: 3.1_

- [ ] 6. Test and validate migration
  - Test complete mining evaluation workflow
  - Test breakthrough evolution functionality
  - Validate error handling and fallback scenarios
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.1 Test mining evaluation
  - Verify mining completion triggers DeepSeek evaluation
  - Test all grade levels (S, A, B, C) are properly awarded
  - Validate reward calculations and QBS bonuses
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 6.2 Test breakthrough evolution
  - Verify evolution requests work with DeepSeek API
  - Test advancement level progression
  - Validate cost deduction and reward distribution
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 6.3 Test error scenarios
  - Test behavior with invalid API key
  - Test network failure handling
  - Verify fallback mechanisms work correctly
  - _Requirements: 1.4, 2.4, 3.3_