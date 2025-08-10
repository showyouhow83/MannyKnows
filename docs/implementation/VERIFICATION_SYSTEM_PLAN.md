# 🛡️ User Verification & Anti-Abuse System

## 🎯 **Goal**: Professional gatekeeping for website analysis service

## 🚫 **Anti-Abuse Rules**

### **1. Email-Domain Validation**
```typescript
// Email must match domain being analyzed OR be from approved providers
const approvedProviders = [
  'gmail.com', 'yahoo.com', 'outlook.com', 
  'hotmail.com', 'msn.com', 'icloud.com'
];

function validateEmailDomainMatch(email: string, websiteUrl: string): boolean {
  const emailDomain = email.split('@')[1].toLowerCase();
  const websiteDomain = new URL(websiteUrl).hostname.replace('www.', '');
  
  // Allow exact domain match (domain owner)
  if (emailDomain === websiteDomain) return true;
  
  // Allow approved major providers (professionals)
  if (approvedProviders.includes(emailDomain)) return true;
  
  return false;
}
```

### **2. Rate Limiting Rules**
```typescript
interface RateLimits {
  perIP: { limit: 3, window: '24h' };          // 3 analyses per IP per day
  perEmail: { limit: 5, window: '30d' };       // 5 analyses per email per month  
  perDomain: { limit: 10, window: '30d' };     // 10 analyses per domain per month
  cooldown: { sameDomain: '24h' };             // 24h between same domain analyses
}
```

### **3. Temporary Email Detection**
```typescript
const tempEmailProviders = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'tempmail.org', 'yopmail.com', 'throwaway.email',
  'temp-mail.org', 'getnada.com', 'maildrop.cc'
];

function isTempEmail(email: string): boolean {
  const domain = email.split('@')[1].toLowerCase();
  return tempEmailProviders.includes(domain) || 
         domain.includes('temp') || 
         domain.includes('disposable');
}
```

## 🔐 **Verification Flow**

### **Step 1: Pre-Analysis Verification**
```typescript
// POST /api/verify-access
{
  "email": "user@domain.com",
  "websiteUrl": "https://domain.com"
}

// Validation checks:
// ✅ Email format valid
// ✅ Email-domain relationship valid  
// ✅ Not temporary email
// ✅ Rate limits not exceeded
// ✅ Domain not in cooldown
```

### **Step 2: Email Verification**
```typescript
// Send verification email with OTP
{
  "success": true,
  "message": "Verification email sent",
  "verificationId": "uuid",
  "expiresAt": "2025-08-10T15:30:00Z"
}

// User receives email with verification link:
// https://mannyknows.com/verify?id=uuid&code=123456
```

### **Step 3: Verification Confirmation**
```typescript
// POST /api/confirm-verification
{
  "verificationId": "uuid",
  "code": "123456"
}

// Returns analysis token for single use
{
  "success": true,
  "analysisToken": "secure-token",
  "expiresIn": 3600 // 1 hour
}
```

### **Step 4: Protected Analysis**
```typescript
// POST /api/analyze-website
{
  "analysisToken": "secure-token", // Required
  "url": "https://domain.com",
  "email": "user@domain.com"
}
```

## 🏗️ **Technical Implementation**

### **1. Verification API**
```typescript
// src/pages/api/verify-access.ts
export const POST: APIRoute = async ({ request, locals }) => {
  const { email, websiteUrl } = await request.json();
  const kv = locals.runtime?.env?.CHATBOT_KV;
  const clientIP = request.headers.get('CF-Connecting-IP');
  
  // Validation chain
  const validations = [
    () => validateEmailFormat(email),
    () => validateEmailDomainMatch(email, websiteUrl),
    () => !isTempEmail(email),
    () => checkRateLimit(clientIP, email, websiteUrl, kv),
    () => checkDomainCooldown(websiteUrl, kv)
  ];
  
  for (const validate of validations) {
    const result = await validate();
    if (!result.valid) {
      return new Response(JSON.stringify({
        error: result.message,
        code: result.code
      }), { status: 400 });
    }
  }
  
  // Generate verification
  const verificationId = crypto.randomUUID();
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  await kv.put(`verification:${verificationId}`, JSON.stringify({
    email,
    websiteUrl,
    code,
    createdAt: new Date().toISOString(),
    clientIP
  }), { expirationTtl: 3600 }); // 1 hour
  
  // Send verification email
  await sendVerificationEmail(email, code, verificationId);
  
  return new Response(JSON.stringify({
    success: true,
    verificationId,
    message: 'Verification email sent'
  }));
};
```

### **2. Rate Limiting Logic**
```typescript
// src/lib/verification/rateLimiter.ts
export async function checkRateLimit(
  clientIP: string, 
  email: string, 
  websiteUrl: string, 
  kv: any
): Promise<ValidationResult> {
  const domain = new URL(websiteUrl).hostname;
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().substring(0, 7);
  
  // Check IP limit (3 per day)
  const ipKey = `rate:ip:${clientIP}:${today}`;
  const ipCount = parseInt(await kv.get(ipKey) || '0');
  if (ipCount >= 3) {
    return {
      valid: false,
      message: 'Daily limit exceeded for this IP address',
      code: 'IP_LIMIT_EXCEEDED'
    };
  }
  
  // Check email limit (5 per month)
  const emailKey = `rate:email:${email}:${thisMonth}`;
  const emailCount = parseInt(await kv.get(emailKey) || '0');
  if (emailCount >= 5) {
    return {
      valid: false,
      message: 'Monthly limit exceeded for this email',
      code: 'EMAIL_LIMIT_EXCEEDED'
    };
  }
  
  // Check domain limit (10 per month)
  const domainKey = `rate:domain:${domain}:${thisMonth}`;
  const domainCount = parseInt(await kv.get(domainKey) || '0');
  if (domainCount >= 10) {
    return {
      valid: false,
      message: 'Monthly limit exceeded for this domain',
      code: 'DOMAIN_LIMIT_EXCEEDED'
    };
  }
  
  return { valid: true };
}

export async function incrementRateLimit(
  clientIP: string,
  email: string, 
  websiteUrl: string,
  kv: any
): Promise<void> {
  const domain = new URL(websiteUrl).hostname;
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().substring(0, 7);
  
  // Increment counters
  const ipKey = `rate:ip:${clientIP}:${today}`;
  const emailKey = `rate:email:${email}:${thisMonth}`;
  const domainKey = `rate:domain:${domain}:${thisMonth}`;
  
  await Promise.all([
    kv.put(ipKey, String(parseInt(await kv.get(ipKey) || '0') + 1), { expirationTtl: 86400 }),
    kv.put(emailKey, String(parseInt(await kv.get(emailKey) || '0') + 1), { expirationTtl: 2592000 }),
    kv.put(domainKey, String(parseInt(await kv.get(domainKey) || '0') + 1), { expirationTtl: 2592000 })
  ]);
}
```

### **3. Verification Email**
```typescript
// src/lib/verification/emailSender.ts
export async function sendVerificationEmail(
  email: string, 
  code: string, 
  verificationId: string
): Promise<void> {
  const verifyUrl = `https://mannyknows.com/verify?id=${verificationId}&code=${code}`;
  
  // Using Resend
  await resend.emails.send({
    from: 'verification@mannyknows.com',
    to: email,
    subject: 'Verify Your Website Analysis Request',
    html: `
      <div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
        <h2>🔍 Website Analysis Verification</h2>
        <p>You requested a website analysis from MannyKnows.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3>Verification Code</h3>
          <div style="font-size: 32px; font-weight: bold; color: #0066cc; letter-spacing: 4px;">${code}</div>
        </div>
        
        <p>Or click this link to verify:</p>
        <p><a href="${verifyUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify & Start Analysis</a></p>
        
        <p><small>This verification expires in 1 hour. If you didn't request this analysis, please ignore this email.</small></p>
      </div>
    `
  });
}
```

### **4. Updated Analysis API**
```typescript
// src/pages/api/analyze-website.ts (protected version)
export const POST: APIRoute = async ({ request, locals }) => {
  const { analysisToken, url, email } = await request.json();
  const kv = locals.runtime?.env?.CHATBOT_KV;
  
  // Verify analysis token
  const tokenData = await kv.get(`token:${analysisToken}`, { type: 'json' });
  if (!tokenData || tokenData.used || Date.now() > tokenData.expiresAt) {
    return new Response(JSON.stringify({
      error: 'Invalid or expired analysis token'
    }), { status: 401 });
  }
  
  // Mark token as used
  await kv.put(`token:${analysisToken}`, JSON.stringify({
    ...tokenData,
    used: true,
    usedAt: new Date().toISOString()
  }), { expirationTtl: 86400 });
  
  // Increment rate limits
  await incrementRateLimit(tokenData.clientIP, email, url, kv);
  
  // Proceed with analysis...
  // ... existing analysis logic ...
};
```

## 🎯 **Professional Gatekeeping Benefits**

### **✅ Legitimate Users Only**
- Domain owners with company emails
- Professionals with established email providers
- Verified interest in website improvement

### **🚫 Abuse Prevention**
- No free-for-all analysis farming
- Rate limits prevent bulk usage
- Temp email blocking stops throwaway requests
- IP limits prevent office/shared connection abuse

### **💼 Business Value Protection**
- Analysis service has perceived value
- Users invest effort (email verification) = higher engagement
- Professional positioning attracts quality leads

### **📊 Usage Analytics**
- Track legitimate usage patterns
- Identify high-value domains/users
- Monitor for upgrade opportunities

## 📈 **Implementation Phases**

### **Phase 1: Core Verification (2-3 days)**
- [x] Email-domain validation logic
- [x] Rate limiting system  
- [x] Verification email flow
- [x] Protected analysis API

### **Phase 2: Enhanced Security (1-2 days)**
- [ ] Advanced temp email detection
- [ ] Suspicious pattern detection
- [ ] Admin override system
- [ ] Detailed logging/monitoring

### **Phase 3: User Experience (1-2 days)**
- [ ] Verification status dashboard
- [ ] Usage limit displays
- [ ] Professional email templates
- [ ] Error message improvements

---

**Result**: Professional, protected analysis service that serves legitimate customers while preventing abuse and maintaining business value.**
