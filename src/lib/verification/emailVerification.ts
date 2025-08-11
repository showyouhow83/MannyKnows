// Email verification and domain validation utilities

// Professional email providers whitelist
export const PROFESSIONAL_EMAIL_PROVIDERS = [
  // Major providers
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com',
  'protonmail.com', 'tutanota.com', 'fastmail.com',
  
  // Microsoft ecosystem
  'live.com', 'msn.com', 'outlook.live.com',
  
  // Google workspace common domains
  'googlemail.com',
  
  // Other legitimate providers
  'aol.com', 'mail.com', 'yandex.com', 'zoho.com',
  'rocketmail.com', 'sbcglobal.net', 'att.net', 'verizon.net'
];

// Temporary/disposable email providers blacklist
export const TEMP_EMAIL_PROVIDERS = [
  // Common temp email services
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'mailinator.com', 'maildrop.cc', 'tempmail.org',
  'yopmail.com', 'temp-mail.org', 'throwaway.email',
  'getnada.com', 'temp-mail.io', 'mohmal.com',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'pokemail.net', 'spam4.me', 'bccto.me',
  'dispostable.com', 'fakeinbox.com', 'getairmail.com',
  'harakirimail.com', 'mytrashmail.com', 'no-spam.ws',
  'noclickemail.com', 'trashmail.at', 'trashmail.com',
  'trashmail.net', 'trashmail.org', 'wegwerfmail.de',
  'wegwerfmail.net', 'wegwerfmail.org', '20minutemail.it',
  'emailondeck.com', 'emkei.cz', 'incognitomail.org',
  'mintemail.com', 'mytrashmail.compooket.org',
  'sogetthis.com', 'spamherelots.com', 'spamhereplease.com',
  'tempinbox.com', 'thankyou2010.com', 'trash2009.com',
  'trbvm.com', 'yuurok.com', 'zehnminutenmail.de'
];

export interface EmailAnalysis {
  email: string;
  domain: string;
  websiteDomain: string;
  isMatchingDomain: boolean;
  isProfessionalProvider: boolean;
  isTempProvider: boolean;
  isValid: boolean;
  opportunities: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface UserVerificationData {
  email: string;
  websiteDomain: string;
  verificationToken: string;
  verified: boolean;
  createdAt: string;
  verifiedAt?: string;
  verificationAttempts: number;
  lastAttemptAt?: string;
  whoisData?: WhoisData;
  businessIntel?: BusinessIntelData;
}

export interface WhoisData {
  domain: string;
  technicalContact?: string;
  adminContact?: string;
  registrantContact?: string;
  isPublic: boolean;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
}

export interface BusinessIntelData {
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  device?: {
    type: string;
    os: string;
    browser: string;
  };
  timestamp: string;
}

/**
 * Analyze email domain relationship with website domain
 */
export function analyzeEmailDomain(email: string, websiteUrl: string): EmailAnalysis {
  const emailDomain = email.toLowerCase().split('@')[1];
  const websiteDomain = extractDomainFromUrl(websiteUrl);
  
  const opportunities: string[] = [];
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check if email matches website domain
  const isMatchingDomain = emailDomain === websiteDomain;
  
  // Check if email is from professional provider
  const isProfessionalProvider = PROFESSIONAL_EMAIL_PROVIDERS.includes(emailDomain);
  
  // Check if email is from temp provider
  const isTempProvider = TEMP_EMAIL_PROVIDERS.includes(emailDomain);
  
  // Risk and opportunity assessment
  if (isTempProvider) {
    warnings.push('Disposable email provider detected');
    riskLevel = 'high';
    return {
      email,
      domain: emailDomain,
      websiteDomain,
      isMatchingDomain: false,
      isProfessionalProvider: false,
      isTempProvider: true,
      isValid: false,
      opportunities: [],
      warnings,
      riskLevel
    };
  }

  if (!isMatchingDomain && !isProfessionalProvider) {
    warnings.push('Email domain not recognized as professional provider');
    opportunities.push('🔧 **Domain Email Setup** - Professional email with your domain builds trust and brand credibility');
    riskLevel = 'medium';
  }

  if (!isMatchingDomain && isProfessionalProvider) {
    opportunities.push('📧 **Professional Email Migration** - Consider setting up email with your domain for enhanced branding');
    riskLevel = 'low';
  }

  const isValid = !isTempProvider && (isMatchingDomain || isProfessionalProvider);

  return {
    email,
    domain: emailDomain,
    websiteDomain,
    isMatchingDomain,
    isProfessionalProvider,
    isTempProvider,
    isValid,
    opportunities,
    warnings,
    riskLevel
  };
}

/**
 * Extract domain from URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    // If URL parsing fails, try to extract domain manually
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0];
  }
}

/**
 * Generate secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract device and browser information from User-Agent
 */
export function parseUserAgent(userAgent: string): BusinessIntelData['device'] {
  const ua = userAgent.toLowerCase();
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // Detect device type
  let type = 'Desktop';
  if (ua.includes('mobile')) type = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) type = 'Tablet';

  return { type, os, browser };
}
