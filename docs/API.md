# API Reference

## Public APIs

### Chat API
`/api/chat`

**GET** - Initialize session, get CSRF token
```typescript
GET /api/chat?session_id={uuid}

Response: {
  csrf_token: string,
  session_id: string,
  timestamp: string
}
```

**POST** - Process chat messages
```typescript
POST /api/chat
Headers: { 'X-CSRF-Token': token }
Body: {
  message: string,
  session_id: string,
  conversation_history?: array,
  chat_reference?: string
}
```

### Contact Form
`/api/contact`

**GET** - Get CSRF token
**POST** - Submit contact form
```typescript
Body: {
  name: string,
  email: string,
  subject: string,
  message: string,
  csrf_token: string,
  session_id: string
}
```

### Newsletter
`/api/newsletter`

**GET** - Get CSRF token
**POST** - Subscribe to newsletter
```typescript
Body: {
  email: string,
  csrf_token: string,
  session_id: string
}
```

## Admin APIs

All admin APIs require authentication via session token or admin key.

### Admin Login
`/api/admin-login`

**GET** - Get CSRF token
**POST** - Authenticate admin
```typescript
Body: {
  email: string,
  adminKey: string,
  csrf_token: string,
  session_id: string
}

Response: {
  success: boolean,
  sessionToken: string,
  apiToken: string,
  expiresAt: number
}
```

### Newsletter Admin
`/api/newsletter-admin`

**GET** - List subscribers
```typescript
GET /api/newsletter-admin?session={token}&status={all|active|unsubscribed}&export={csv|json}
```

### Meetings Admin
`/api/meetings-admin`

**GET** - List discovery calls
```typescript
GET /api/meetings-admin?session={token}&status={all|pending|confirmed}&sortBy={newest|date_asc}
```

**POST** - Update meeting
```typescript
Body: {
  action: 'update_status' | 'add_notes' | 'delete',
  meetingId: string,
  status?: string,
  notes?: string
}
```

### Meeting Verification
`/api/verify-meeting-action`

**GET** - Process meeting action verification
```typescript
GET /api/verify-meeting-action?token={token}&action={cancel|reschedule}
```

## Debug APIs (Admin only)

### KV Analysis
`/api/kv-analysis`

**GET** - Analyze KV data patterns
```typescript
Headers: { 'Authorization': 'Bearer {ADMIN_API_KEY}' }
```

### Services Analysis
`/api/services-analysis`

**GET** - Analyze services data
```typescript
Headers: { 'Authorization': 'Bearer {ADMIN_API_KEY}' }
```

### Security Status
`/api/security-status`

**GET** - Get security status
**POST** - Run security actions
```typescript
Headers: { 'Authorization': 'Bearer {ADMIN_API_KEY}' }
```

## Authentication Methods

### 1. Session Token (Preferred)
```typescript
/api/endpoint?session={sessionToken}
// OR
Headers: { 'Authorization': 'Bearer {sessionToken}' }
// OR
Cookie: admin_session={sessionToken}
```

### 2. One-Time Token
```typescript
/api/endpoint?token={oneTimeToken}
```

### 3. Legacy Admin Key
```typescript
/api/endpoint?key={ADMIN_KEY}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Chat API | 30 req/min (anonymous) |
| Admin APIs | 100 req/min |
| Export APIs | 10 req/hour |
