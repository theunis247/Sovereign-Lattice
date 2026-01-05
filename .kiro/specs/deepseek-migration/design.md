# Design Document

## Overview

This design outlines the migration from Google Gemini API to DeepSeek API for the Quantum Simulator. The migration will replace the existing AI service integration while maintaining identical functionality and user experience. The design focuses on creating a new DeepSeek API client service and updating the existing AI-dependent features.

## Architecture

### Current Architecture
```
App.tsx -> GoogleGenAI -> Gemini API
```

### New Architecture
```
App.tsx -> DeepSeekClient -> DeepSeek API
```

### Service Layer Design
- **DeepSeekClient**: New service class handling all DeepSeek API interactions
- **AIService**: Abstract interface for AI operations (future-proofing for other providers)
- **ResponseParser**: Utility for parsing and validating AI responses

## Components and Interfaces

### DeepSeek API Client Service

```typescript
interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

class DeepSeekClient {
  constructor(config: DeepSeekConfig);
  async generateContent(prompt: string, schema?: object): Promise<DeepSeekResponse>;
  async generateStructuredContent<T>(prompt: string, schema: object): Promise<T>;
}
```

### Mining Evaluation Integration

The mining evaluation system will be updated to use DeepSeek's chat completion API instead of Gemini's generateContent method. The prompt structure and response parsing will be adapted for DeepSeek's response format.

### Evolution Synthesis Integration

The breakthrough evolution system will be migrated to use DeepSeek's API while maintaining the same scientific advancement logic and reward calculations.

## Data Models

### Request Format (DeepSeek)
```typescript
interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object';
  };
}
```

### Response Parsing
The existing JSON schema validation will be adapted to work with DeepSeek's response format. The same structured outputs (grades, explanations, formulas) will be maintained.

## Error Handling

### API Error Types
1. **Authentication Errors**: Invalid API key or expired credentials
2. **Rate Limiting**: API quota exceeded or rate limits hit
3. **Network Errors**: Connection timeouts or network failures
4. **Parsing Errors**: Invalid JSON or schema validation failures
5. **Service Errors**: DeepSeek API service unavailable

### Fallback Strategy
- **Mining Evaluation**: Provide default C-grade with generic explanation
- **Evolution Synthesis**: Return error message with retry option
- **Graceful Degradation**: Disable AI features but maintain core functionality

## Testing Strategy

### Unit Tests
- DeepSeek API client methods
- Response parsing and validation
- Error handling scenarios
- Configuration validation

### Integration Tests
- End-to-end mining evaluation flow
- Breakthrough evolution workflow
- API authentication and error responses

### Manual Testing
- Complete mining cycle with DeepSeek evaluation
- Breakthrough evolution with various advancement levels
- Error scenarios and fallback behavior

## Migration Strategy

### Phase 1: Service Layer
1. Create DeepSeek API client service
2. Implement response parsing utilities
3. Add configuration management

### Phase 2: Feature Integration
1. Update mining evaluation to use DeepSeek
2. Update breakthrough evolution to use DeepSeek
3. Update environment configuration

### Phase 3: Testing and Validation
1. Test all AI-dependent features
2. Validate response formats and error handling
3. Performance testing and optimization

## Configuration Changes

### Environment Variables
```bash
# Replace Gemini configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

### Vite Configuration
Update `vite.config.ts` to expose DeepSeek environment variables instead of Gemini variables.

## Security Considerations

- API key stored in environment variables only
- No API key logging or exposure in client-side code
- Request/response validation to prevent injection attacks
- Rate limiting implementation to prevent abuse

## Performance Considerations

- Connection pooling for API requests
- Response caching for repeated evaluations
- Timeout configuration for responsive UI
- Retry logic with exponential backoff

## Backward Compatibility

The migration will maintain complete backward compatibility:
- Same response structures for UI components
- Identical reward calculations and game mechanics
- Same error handling patterns
- No changes to user-facing interfaces