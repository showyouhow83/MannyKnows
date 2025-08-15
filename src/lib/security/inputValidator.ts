/**
 * Comprehensive Input Validation System
 * Protects against XSS, SQL injection, command injection, and other security threats
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  sanitize?: boolean;
  custom?: (value: any) => { valid: boolean; message?: string };
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class InputValidator {
  private static readonly HTML_ENTITY_MAP: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*>/gi,
    /<meta\b[^<]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /onerror\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
    /(\s|^)(or|and)\s+\d+\s*=\s*\d+/gi,
    /(\s|^)(or|and)\s+['"]\w+['"]?\s*=\s*['"]\w+['"]?/gi,
    /(\s|^)\d+\s*(=|>|<|>=|<=)\s*\d+(\s|$)/gi,
    /['"](\s|;|--|\*|\|)/gi,
    /\b(xp_|sp_)\w+/gi
  ];

  private static readonly COMMAND_INJECTION_PATTERNS = [
    /[;&|`$(){}[\]]/gi,
    /\b(cat|ls|pwd|rm|mkdir|rmdir|cp|mv|chmod|chown|ps|kill|wget|curl|nc|netcat)\b/gi,
    /\.\.\//gi,
    /\/etc\/passwd/gi,
    /\/proc\/self\/environ/gi
  ];

  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const [key, rule] of Object.entries(schema)) {
      const value = data[key];
      const fieldResult = this.validateField(key, value, rule);
      
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors);
      } else if (fieldResult.sanitizedValue !== undefined) {
        sanitizedData[key] = fieldResult.sanitizedValue;
      }
    }

    // Check for unexpected fields
    for (const key of Object.keys(data)) {
      if (!schema[key]) {
        errors.push(`Unexpected field: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Validate a single field
   */
  private static validateField(
    fieldName: string, 
    value: any, 
    rule: ValidationRule
  ): { valid: boolean; errors: string[]; sanitizedValue?: any } {
    const errors: string[] = [];
    let sanitizedValue = value;

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    // Skip further validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { valid: true, errors: [], sanitizedValue: value };
    }

    // Type validation
    if (rule.type) {
      const typeResult = this.validateType(fieldName, value, rule.type);
      if (!typeResult.valid) {
        errors.push(...typeResult.errors);
      } else {
        sanitizedValue = typeResult.sanitizedValue;
      }
    }

    // String-specific validations
    if (typeof sanitizedValue === 'string') {
      // Length validation
      if (rule.minLength !== undefined && sanitizedValue.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength !== undefined && sanitizedValue.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
        errors.push(`${fieldName} format is invalid`);
      }

      // Security validation
      const securityResult = this.validateSecurity(fieldName, sanitizedValue);
      if (!securityResult.valid) {
        errors.push(...securityResult.errors);
      }

      // Sanitization
      if (rule.sanitize) {
        sanitizedValue = this.sanitizeString(sanitizedValue);
      }
    }

    // Number-specific validations
    if (typeof sanitizedValue === 'number') {
      if (rule.min !== undefined && sanitizedValue < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && sanitizedValue > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`);
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
      errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(sanitizedValue);
      if (!customResult.valid) {
        errors.push(customResult.message || `${fieldName} failed custom validation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }

  /**
   * Validate data type and convert if necessary
   */
  private static validateType(
    fieldName: string, 
    value: any, 
    expectedType: string
  ): { valid: boolean; errors: string[]; sanitizedValue?: any } {
    const errors: string[] = [];

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: String(value) };

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${fieldName} must be a valid number`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: num };

      case 'boolean':
        if (typeof value === 'boolean') {
          return { valid: true, errors: [], sanitizedValue: value };
        }
        if (value === 'true' || value === '1' || value === 1) {
          return { valid: true, errors: [], sanitizedValue: true };
        }
        if (value === 'false' || value === '0' || value === 0) {
          return { valid: true, errors: [], sanitizedValue: false };
        }
        errors.push(`${fieldName} must be a boolean`);
        return { valid: false, errors };

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: value };

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`${fieldName} must be an object`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: value };

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailPattern.test(value)) {
          errors.push(`${fieldName} must be a valid email address`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: value };

      case 'url':
        try {
          new URL(value);
          return { valid: true, errors: [], sanitizedValue: value };
        } catch {
          errors.push(`${fieldName} must be a valid URL`);
          return { valid: false, errors };
        }

      case 'uuid':
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidPattern.test(value)) {
          errors.push(`${fieldName} must be a valid UUID`);
        }
        return { valid: errors.length === 0, errors, sanitizedValue: value };

      default:
        return { valid: true, errors: [], sanitizedValue: value };
    }
  }

  /**
   * Validate for security threats
   */
  private static validateSecurity(fieldName: string, value: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // XSS detection
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${fieldName} contains potentially malicious content (XSS)`);
        break;
      }
    }

    // SQL injection detection
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${fieldName} contains potentially malicious content (SQL injection)`);
        break;
      }
    }

    // Command injection detection
    for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${fieldName} contains potentially malicious content (Command injection)`);
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(value: string): string {
    // HTML entity encoding
    let sanitized = value.replace(/[&<>"'`=\/]/g, (s) => this.HTML_ENTITY_MAP[s]);
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Create validation middleware for API routes
   */
  static createMiddleware(schema: ValidationSchema) {
    return async (request: Request): Promise<{ valid: boolean; data?: any; response?: Response }> => {
      try {
        const contentType = request.headers.get('content-type') || '';
        let data: any;

        if (contentType.includes('application/json')) {
          data = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          data = Object.fromEntries(formData.entries());
        } else {
          return {
            valid: false,
            response: new Response(JSON.stringify({
              error: 'Unsupported content type',
              supportedTypes: ['application/json', 'application/x-www-form-urlencoded']
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          };
        }

        const validation = this.validate(data, schema);

        if (!validation.valid) {
          return {
            valid: false,
            response: new Response(JSON.stringify({
              error: 'Validation failed',
              details: validation.errors,
              timestamp: new Date().toISOString()
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          };
        }

        return {
          valid: true,
          data: validation.sanitizedData
        };

      } catch (error) {
        return {
          valid: false,
          response: new Response(JSON.stringify({
            error: 'Invalid request data',
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        };
      }
    };
  }

  /**
   * Predefined validation schemas for common use cases
   */
  static schemas = {
    chatMessage: {
      message: {
        required: true,
        type: 'string' as const,
        minLength: 1,
        maxLength: 4000,
        sanitize: true
      },
      session_id: {
        required: false,
        type: 'uuid' as const
      },
      conversation_history: {
        required: false,
        type: 'array' as const,
        custom: (value: any[]) => {
          if (value.length > 50) {
            return { valid: false, message: 'Conversation history too long' };
          }
          return { valid: true };
        }
      },
      csrf_token: {
        required: true,
        type: 'string' as const,
        minLength: 32,
        maxLength: 64
      }
    },

    userProfile: {
      email: {
        required: false,
        type: 'email' as const,
        sanitize: true
      },
      name: {
        required: false,
        type: 'string' as const,
        maxLength: 100,
        sanitize: true
      },
      preferences: {
        required: false,
        type: 'object' as const
      }
    },

    emailVerification: {
      email: {
        required: true,
        type: 'email' as const,
        sanitize: true
      },
      token: {
        required: true,
        type: 'string' as const,
        minLength: 32,
        maxLength: 128
      }
    }
  };
}

export default InputValidator;
