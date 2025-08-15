/**
 * KV Data Encryption System
 * Provides encryption/decryption for sensitive data stored in Cloudflare KV
 */

export interface EncryptionConfig {
  algorithm: string;
  keyDerivationRounds: number;
  saltLength: number;
  ivLength: number;
}

export interface EncryptedData {
  data: string;
  salt: string;
  iv: string;
  algorithm: string;
  timestamp: number;
}

export class KVEncryption {
  private config: EncryptionConfig;
  private encryptionKey: string;

  constructor(encryptionKey: string, config?: Partial<EncryptionConfig>) {
    this.encryptionKey = encryptionKey;
    this.config = {
      algorithm: 'AES-GCM',
      keyDerivationRounds: 100000,
      saltLength: 16,
      ivLength: 12,
      ...config
    };
  }

  /**
   * Encrypt data for KV storage
   */
  async encrypt(data: any): Promise<string> {
    try {
      // Convert data to string
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);

      // Generate salt and IV
      const salt = new Uint8Array(this.config.saltLength);
      const iv = new Uint8Array(this.config.ivLength);
      crypto.getRandomValues(salt);
      crypto.getRandomValues(iv);

      // Derive key from password and salt
      const keyMaterial = await this.deriveKey(this.encryptionKey, salt);

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv as BufferSource
        },
        keyMaterial,
        plaintextBuffer
      );

      // Create encrypted data object
      const encryptedData: EncryptedData = {
        data: this.arrayBufferToBase64(encryptedBuffer),
        salt: this.uint8ArrayToBase64(salt),
        iv: this.uint8ArrayToBase64(iv),
        algorithm: this.config.algorithm,
        timestamp: Date.now()
      };

      return JSON.stringify(encryptedData);

    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data from KV storage
   */
  async decrypt(encryptedString: string): Promise<any> {
    try {
      // Parse encrypted data
      const encryptedData: EncryptedData = JSON.parse(encryptedString);

      // Convert base64 back to binary
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data);
      const salt = this.base64ToUint8Array(encryptedData.salt);
      const iv = this.base64ToUint8Array(encryptedData.iv);

      // Derive the same key
      const keyMaterial = await this.deriveKey(this.encryptionKey, salt);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: encryptedData.algorithm,
          iv: iv as BufferSource
        },
        keyMaterial,
        encryptedBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }

    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derive encryption key from password and salt
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.config.keyDerivationRounds,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.config.algorithm,
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Helper methods for base64 encoding/decoding
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private uint8ArrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Encrypted KV Wrapper
 * Provides transparent encryption/decryption for KV operations
 */
export class EncryptedKV {
  private kv: any;
  private encryption: KVEncryption;
  private sensitiveKeyPatterns: RegExp[];

  constructor(kv: any, encryptionKey: string, sensitivePatterns?: string[]) {
    this.kv = kv;
    this.encryption = new KVEncryption(encryptionKey);
    
    // Default patterns for sensitive data
    const defaultPatterns = [
      'session:.*',
      'user:.*:profile',
      'user:.*:email',
      'auth:.*',
      'token:.*',
      'verification:.*',
      'payment:.*',
      'personal:.*'
    ];
    
    const patterns = sensitivePatterns || defaultPatterns;
    this.sensitiveKeyPatterns = patterns.map(pattern => new RegExp(pattern));
  }

  /**
   * Check if a key contains sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    return this.sensitiveKeyPatterns.some(pattern => pattern.test(key));
  }

  /**
   * Put data with automatic encryption for sensitive keys
   */
  async put(key: string, value: any, options?: any): Promise<void> {
    try {
      let finalValue = value;
      
      if (this.isSensitiveKey(key)) {
        // Encrypt sensitive data
        finalValue = await this.encryption.encrypt(value);
        
        // Add encryption marker to options
        options = {
          ...options,
          metadata: {
            ...(options?.metadata || {}),
            encrypted: true,
            encryptionVersion: '1.0'
          }
        };
      }
      
      return await this.kv.put(key, finalValue, options);
    } catch (error) {
      console.error('EncryptedKV put error:', error);
      throw error;
    }
  }

  /**
   * Get data with automatic decryption for sensitive keys
   */
  async get(key: string, options?: any): Promise<any> {
    try {
      const result = await this.kv.get(key, options);
      
      if (result === null || result === undefined) {
        return result;
      }

      // Check if data was encrypted
      if (this.isSensitiveKey(key)) {
        try {
          return await this.encryption.decrypt(result);
        } catch (decryptionError) {
          console.error('Decryption failed for key:', key, decryptionError);
          // Return null instead of throwing to avoid breaking the application
          return null;
        }
      }
      
      return result;
    } catch (error) {
      console.error('EncryptedKV get error:', error);
      throw error;
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    return await this.kv.delete(key);
  }

  /**
   * List keys with optional encryption status
   */
  async list(options?: any): Promise<any> {
    const result = await this.kv.list(options);
    
    // Add encryption status to each key
    if (result.keys) {
      result.keys = result.keys.map((keyInfo: any) => ({
        ...keyInfo,
        encrypted: this.isSensitiveKey(keyInfo.name)
      }));
    }
    
    return result;
  }

  /**
   * Migrate existing unencrypted sensitive data to encrypted format
   */
  async migrateToEncryption(keyPattern?: RegExp): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;
    
    try {
      // List all keys
      const allKeys = await this.kv.list();
      
      for (const keyInfo of allKeys.keys || []) {
        const key = keyInfo.name;
        
        // Check if key should be encrypted
        if (this.isSensitiveKey(key) || (keyPattern && keyPattern.test(key))) {
          try {
            // Get current value
            const currentValue = await this.kv.get(key);
            
            if (currentValue !== null && currentValue !== undefined) {
              // Check if already encrypted by trying to parse as EncryptedData
              try {
                const parsed = JSON.parse(currentValue);
                if (parsed.data && parsed.salt && parsed.iv && parsed.algorithm) {
                  // Already encrypted, skip
                  continue;
                }
              } catch {
                // Not JSON or not encrypted format, proceed with encryption
              }
              
              // Encrypt and re-store
              const encryptedValue = await this.encryption.encrypt(currentValue);
              await this.kv.put(key, encryptedValue, {
                metadata: {
                  encrypted: true,
                  encryptionVersion: '1.0',
                  migrated: true,
                  migratedAt: new Date().toISOString()
                }
              });
              
              migrated++;
            }
          } catch (error) {
            console.error(`Failed to migrate key ${key}:`, error);
            errors++;
          }
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      errors++;
    }
    
    return { migrated, errors };
  }

  /**
   * Backup encrypted data (exports encrypted format)
   */
  async backup(keyPattern?: RegExp): Promise<{ [key: string]: any }> {
    const backup: { [key: string]: any } = {};
    
    try {
      const allKeys = await this.kv.list();
      
      for (const keyInfo of allKeys.keys || []) {
        const key = keyInfo.name;
        
        if (!keyPattern || keyPattern.test(key)) {
          // Get raw value (encrypted if applicable)
          const value = await this.kv.get(key);
          if (value !== null && value !== undefined) {
            backup[key] = {
              value,
              metadata: keyInfo.metadata,
              encrypted: this.isSensitiveKey(key)
            };
          }
        }
      }
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
    
    return backup;
  }

  /**
   * Get encryption statistics
   */
  async getEncryptionStats(): Promise<{
    totalKeys: number;
    encryptedKeys: number;
    unencryptedSensitiveKeys: number;
    encryptionCoverage: number;
  }> {
    let totalKeys = 0;
    let encryptedKeys = 0;
    let unencryptedSensitiveKeys = 0;
    
    try {
      const allKeys = await this.kv.list();
      totalKeys = allKeys.keys?.length || 0;
      
      for (const keyInfo of allKeys.keys || []) {
        const key = keyInfo.name;
        const isSensitive = this.isSensitiveKey(key);
        
        if (isSensitive) {
          // Check if encrypted by trying to get metadata or examining value
          try {
            const value = await this.kv.get(key);
            if (value) {
              try {
                const parsed = JSON.parse(value);
                if (parsed.data && parsed.salt && parsed.iv && parsed.algorithm) {
                  encryptedKeys++;
                } else {
                  unencryptedSensitiveKeys++;
                }
              } catch {
                unencryptedSensitiveKeys++;
              }
            }
          } catch {
            unencryptedSensitiveKeys++;
          }
        }
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
    
    const sensitiveKeys = encryptedKeys + unencryptedSensitiveKeys;
    const encryptionCoverage = sensitiveKeys > 0 ? (encryptedKeys / sensitiveKeys) * 100 : 100;
    
    return {
      totalKeys,
      encryptedKeys,
      unencryptedSensitiveKeys,
      encryptionCoverage
    };
  }
}

export default EncryptedKV;
