// Core types for verification system
export interface ValidationResult {
  valid: boolean;
  message?: string;
  code?: string;
}

export interface RateLimits {
  perIP: { limit: number; window: string };
  perEmail: { limit: number; window: string };
  perDomain: { limit: number; window: string };
  cooldown: { sameDomain: string };
}

export interface VerificationData {
  email: string;
  websiteUrl: string;
  code: string;
  createdAt: string;
  clientIP: string;
}

export interface AnalysisToken {
  email: string;
  websiteUrl: string;
  clientIP: string;
  createdAt: string;
  expiresAt: number;
  used?: boolean;
  usedAt?: string;
}
