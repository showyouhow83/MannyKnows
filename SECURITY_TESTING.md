# Security Implementation Testing Plan

## 🧪 **Phase 1: Basic Security Tests**

### Test 1: Security Status Endpoint (Admin)
```bash
# Test admin security dashboard
curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     http://localhost:8787/api/security-status
```

### Test 2: CSRF Token Generation
```bash
# Test CSRF token endpoint
curl "http://localhost:8787/api/chat?session_id=test-session-123"
```

### Test 3: Rate Limiting
```bash
# Test rate limiting (send multiple requests quickly)
for i in {1..35}; do
  curl -X POST http://localhost:8787/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test","session_id":"rate-test"}' &
done
```

### Test 4: Domain Validation
```bash
# Test invalid origin (should be blocked)
curl -X POST http://localhost:8787/api/chat \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","session_id":"test"}'
```

### Test 5: Input Validation
```bash
# Test XSS injection (should be blocked)
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(\"xss\")</script>","session_id":"test"}'
```

## 🔐 **Phase 2: Integration Tests**

### Test 6: Full Security Flow
1. Get CSRF token
2. Send valid chat request with token
3. Verify rate limiting headers
4. Check KV encryption

### Test 7: Client-Side Integration
```javascript
// Test from browser console
const sessionId = 'test-' + Date.now();

// Step 1: Get CSRF token
const tokenResponse = await fetch(`/api/chat?session_id=${sessionId}`);
const { csrf_token, client_script } = await tokenResponse.json();

// Step 2: Use token for chat
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
  },
  body: JSON.stringify({
    message: 'Hello secure MannyKnows!',
    session_id: sessionId,
    csrf_token: csrf_token
  })
});

console.log(await chatResponse.json());
```

## 📊 **Phase 3: Performance Tests**

### Test 8: Security Overhead
```bash
# Measure response times with security
time curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"performance test","session_id":"perf-test"}'
```

### Test 9: Concurrent Load
```bash
# Test concurrent security validation
siege -c 10 -t 30s http://localhost:8787/
```

## 🛡️ **Phase 4: Security Validation**

### Test 10: Encryption Verification
```bash
# Check encryption status
curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     http://localhost:8787/api/security-status | jq '.security.encryption'
```

### Test 11: Security Score
```bash
# Get overall security score
curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     http://localhost:8787/api/security-status | jq '.summary.securityScore'
```

## ✅ **Expected Results**

| Test | Expected Result |
|------|----------------|
| Admin Status | 200 with security metrics |
| CSRF Token | 200 with valid token |
| Rate Limiting | 429 after limit exceeded |
| Invalid Origin | 403 domain validation error |
| XSS Injection | 400 input validation error |
| Valid Chat | 200 with AI response |
| Encryption Stats | 100% coverage for new data |
| Security Score | 85-100 depending on setup |

## 🚨 **Failure Scenarios to Test**

1. **Missing CSRF token** → 403 Forbidden
2. **Invalid session ID** → 400 Bad Request  
3. **Malicious input** → 400 Validation Error
4. **Rate limit exceeded** → 429 Too Many Requests
5. **Wrong admin key** → 401 Unauthorized
6. **Invalid origin** → 403 Domain Error

---

**Next Steps After Testing:**
1. ✅ Verify all tests pass
2. ✅ Check security dashboard shows green status
3. ✅ Deploy to production with same security config
4. ✅ Monitor security logs and metrics
