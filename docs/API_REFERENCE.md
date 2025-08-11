# API Reference

Complete documentation for all MannyKnows API endpoints.

## 🤖 Chat API

### `POST /api/chat`

Primary chatbot endpoint for AI-powered conversations.

**Request:**
```json
{
  "message": "I need help with my website",
  "session_id": "optional-session-uuid", 
  "conversation_history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

**Response:**
```json
{
  "reply": "AI assistant response",
  "session_id": "session-uuid",
  "message_limit_reached": false,
  "chatbot_offline": false,
  "analysis_data": {} // Only if website analysis was performed
}
```

**Features:**
- ✅ Lead extraction and storage
- ✅ Website analysis integration
- ✅ Message limits (15 per session)
- ✅ Environment-based AI model selection
- ✅ Session management

**Error Responses:**
- `400` - Invalid JSON or missing message
- `500` - OpenAI API error or system failure

---

## 🔍 Website Analysis API

### `POST /api/analyze-website`

Comprehensive website analysis with scoring and recommendations.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "uuid",
  "analysis": {
    "overallScore": 85,
    "performanceScore": 92,
    "seoScore": 78,
    "accessibilityScore": 88,
    "responseTime": 245,
    "issues": [
      "Missing meta description",
      "Images without alt text"
    ],
    "recommendations": [
      "Add meta descriptions to all pages",
      "Optimize image loading with lazy loading"
    ]
  },
  "reportUrl": "https://domain.com/api/files/reports/uuid.json",
  "htmlUrl": "https://domain.com/api/files/html/uuid.html"
}
```

**Features:**
- ✅ Performance analysis (response time, loading speed)
- ✅ SEO scoring (meta tags, headings, structure)
- ✅ Basic accessibility checks
- ✅ Issue identification and recommendations
- ✅ Report storage in R2 bucket
- ✅ Original HTML preservation

**Error Responses:**
- `400` - Invalid or missing URL
- `503` - R2 storage unavailable
- `500` - Analysis processing error

---

## 📂 File Serving API

### `GET /api/files/[...path]`

Serves analysis reports and HTML files from R2 storage.

**Examples:**
- `/api/files/reports/analysis-uuid.json` - Analysis report
- `/api/files/html/analysis-uuid.html` - Original website HTML

**Response:**
- Returns file content with appropriate MIME type
- `404` if file not found
- `500` if R2 storage error

---

## 👨‍💼 Admin API

### `GET /api/admin/leads`

Retrieve all captured leads (requires authentication).

**Authentication:**
HTTP Basic Auth with admin credentials.

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com", 
      "phone": "+1234567890",
      "message": "Interested in website development",
      "timestamp": "2025-08-10T15:30:00Z",
      "sessionId": "session-uuid",
      "created_at": "2025-08-10T15:30:00Z"
    }
  ],
  "count": 1
}
```

**Features:**
- ✅ HTTP Basic Authentication
- ✅ Lead sorting by date (newest first)
- ✅ Both KV (production) and memory (development) storage
- ✅ Full lead data including extracted contact info

### `DELETE /api/admin/leads`

Delete leads (individual or bulk).

**Authentication:**
HTTP Basic Auth required.

**Request:**
```json
{
  "action": "delete_lead",
  "leadId": "uuid"
}
```

Or for bulk deletion:
```json
{
  "action": "clear_all"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

---

## 🔧 Configuration

### Environment Detection
APIs automatically detect environment:
- `development` - Local dev server
- `production` - Deployed on Cloudflare Workers

### Model Selection
| Environment | Model | Purpose |
|-------------|--------|---------|
| Development | `gpt-4o-mini` | Cost-effective testing |
| Production | `gpt-4o` | Full capabilities |

### Storage Adapters
| Environment | Storage | Persistence |
|-------------|---------|-------------|
| Development | Memory | Session-only |
| Production | Cloudflare KV | Permanent |

---

## 📊 Lead Extraction

The chat API automatically extracts lead information from conversations:

**Extraction Triggers:**
- Conversation length >= 5 messages
- Contact information patterns detected
- Explicit interest in services

**Extracted Fields:**
- `name` - Full name extraction
- `email` - Email address validation
- `phone` - Phone number formatting
- `message` - Original user message
- `sessionId` - Session tracking
- `timestamp` - Capture time

**Storage:**
- Development: In-memory array
- Production: Cloudflare KV with UUID keys

---

## 🚨 Error Handling

All APIs follow consistent error response format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional additional info
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Malformed request data
- `AUTHENTICATION_REQUIRED` - Missing or invalid auth
- `SERVICE_UNAVAILABLE` - External service down
- `RATE_LIMITED` - Too many requests (future)

---

## 🔗 Integration Examples

### Chat Integration
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I need a new website",
    conversation_history: []
  })
});

const data = await response.json();
console.log(data.reply);
```

### Website Analysis
```javascript
const analysis = await fetch('/api/analyze-website', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: "https://example.com"
  })
});

const result = await analysis.json();
console.log(`Score: ${result.analysis.overallScore}/100`);
```

### Admin Access
```javascript
const leads = await fetch('/api/admin/leads', {
  headers: {
    'Authorization': 'Basic ' + btoa('admin:your-password')
  }
});

const data = await leads.json();
console.log(`Total leads: ${data.count}`);
```
