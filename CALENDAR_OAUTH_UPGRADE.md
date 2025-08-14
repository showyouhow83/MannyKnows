# OAuth Flow Upgrade (Future Enhancement)

If you want to implement full OAuth flow later, you would need:

## 1. OAuth Redirect URI
```
https://mannyknows.com/api/auth/google/callback
```

## 2. New API Endpoints
```typescript
// src/pages/api/auth/google/initiate.ts
export const GET: APIRoute = async ({ redirect }) => {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/calendar&response_type=code`;
  return redirect(authUrl);
};

// src/pages/api/auth/google/callback.ts  
export const GET: APIRoute = async ({ url, request }) => {
  const code = url.searchParams.get('code');
  // Exchange code for access token
  // Store token securely
  // Redirect back to chat
};
```

## 3. Token Storage
- Store tokens in your KV database
- Implement token refresh logic
- Handle multiple user calendars

## 4. Updated GoogleCalendarService
- Accept user-specific tokens
- Handle token refresh
- Support multiple calendar owners
