# MannyKnows Deployment & Meeting Management Guide

## 🚀 Deployment Information

### Quick Deploy Commands

```bash
# Normal deployment (recommended - faster)
./deploy.sh

# Deploy with secret updates (only when API keys change)
./deploy.sh --update-secrets
```

### What Happens During Deployment

1. **Build Phase**: `npm run build` - Compiles Astro project
2. **Asset Upload**: Uploads static files to Cloudflare
3. **Worker Deploy**: Deploys serverless functions
4. **Binding Check**: Verifies KV storage and environment variables

### Environment Variables

The following variables are configured in production:

```bash
# Owner Configuration
OWNER_EMAIL=showyouhow83@gmail.com
OWNER_TIMEZONE=America/New_York
RESEND_FROM=MannyKnows <noreply@mannyknows.com>

# Cloudflare Settings
CLOUDFLARE_ACCOUNT_ID=f2cb7f9c07dd4587efbd7772ff8e324f
CLOUDFLARE_R2_BUCKET_NAME=mannyknows-website-analysis

# Analytics
GA_MEASUREMENT_ID=G-J0V35RZNZB
```

### Secrets (Stored Securely)

- `RESEND_API_KEY` - Email sending API
- `OPENAI_API_KEY` - AI chat functionality
- `ADMIN_PASSWORD` - Admin panel access
- `GOOGLE_CALENDAR_REFRESH_TOKEN` - Calendar integration
- `GOOGLE_CLIENT_SECRET` - Google OAuth

### Production URL
**Live Site**: https://mannyknows.showyouhow83.workers.dev

---

## 📅 Meeting Management System

### Overview

The chat system now supports comprehensive meeting management:

1. **Schedule Discovery Calls** - With duplicate prevention
2. **Lookup Existing Meetings** - Find meetings by email
3. **Manage Meetings** - Cancel or reschedule appointments
4. **Email Notifications** - Professional branded emails

### Features Added

- ✅ **Timezone Fix**: Now uses America/New_York by default
- ✅ **Duplicate Prevention**: One meeting per email address
- ✅ **Meeting Lookup**: Find existing appointments
- ✅ **Meeting Management**: Cancel/reschedule functionality
- ✅ **Site-Matching Email Design**: Clean, Apple-inspired templates

---

## 💬 Chat Commands & Examples

### 1. Schedule a Discovery Call

**User Input Examples:**
```
"I'd like to schedule a discovery call for tomorrow at 3 PM"
"Can we book a meeting to discuss my e-commerce project?"
"I need help with AI automation, let's schedule a call"
```

**Complete Code Example:**
```typescript
// Function call made by AI
{
  "name": "schedule_discovery_call",
  "arguments": {
    "name": "John Smith",
    "email": "john@example.com", 
    "phone": "+1 (555) 123-4567",
    "preferred_times": "tomorrow at 3 PM EST",
    "timezone": "America/New_York",
    "project_details": "Need help optimizing e-commerce conversion funnel"
  }
}
```

**Expected Response:**
```
Got it — I've sent your request to our team and we'll confirm the meeting time by email.

• Name: John Smith
• Email: john@example.com  
• Preferred: tomorrow at 3 PM EST
• Reference: abc123-def456-ghi789
• Proposed: Fri Aug 16 2025 03:00 PM (America/New_York)
• Meeting: https://meet.jit.si/mk-abc123-def456-ghi789
```

### 2. Lookup Existing Meetings

**User Input Examples:**
```
"Do I have any meetings coming up with you?"
"What's my scheduled appointment?"
"Can you check if I have a call booked?"
```

**Complete Code Example:**
```typescript
// Function call made by AI
{
  "name": "lookup_existing_meetings",
  "arguments": {
    "email": "john@example.com"
  }
}
```

**Expected Response:**
```
Yes, you have 1 meeting scheduled:

📅 **Discovery Call**
• Time: Fri Aug 16 2025 03:00 PM (America/New_York)
• Status: Pending confirmation
• Meeting Link: https://meet.jit.si/mk-abc123-def456-ghi789
• Reference: abc123-def456-ghi789

Would you like to make any changes to this meeting?
```

### 3. Cancel a Meeting

**User Input Examples:**
```
"I need to cancel my meeting"
"Can I cancel my scheduled call?"
"Please cancel my appointment with reference abc123-def456-ghi789"
```

**Complete Code Example:**
```typescript
// Function call made by AI
{
  "name": "manage_meeting",
  "arguments": {
    "action": "cancel",
    "tracking_id": "abc123-def456-ghi789",
    "reason": "Schedule conflict"
  }
}
```

**Expected Response:**
```
Your meeting has been cancelled successfully.

• Reference: abc123-def456-ghi789
• Original Time: Fri Aug 16 2025 03:00 PM (America/New_York)
• Reason: Schedule conflict

A cancellation notification has been sent to our team.
```

### 4. Reschedule a Meeting

**User Input Examples:**
```
"I need to reschedule my call to next week"
"Can we move my meeting to Monday at 2 PM?"
"Please reschedule my appointment to sometime next Friday"
```

**Complete Code Example:**
```typescript
// Function call made by AI
{
  "name": "manage_meeting", 
  "arguments": {
    "action": "reschedule",
    "tracking_id": "abc123-def456-ghi789",
    "new_preferred_times": "Monday at 2 PM EST or Tuesday morning",
    "reason": "Schedule conflict with client meeting"
  }
}
```

**Expected Response:**
```
Reschedule request has been sent. You will receive an email confirmation with the new meeting time.

• Reference: abc123-def456-ghi789
• Original Time: Fri Aug 16 2025 03:00 PM (America/New_York) 
• New Preferred Times: Monday at 2 PM EST or Tuesday morning
• Reason: Schedule conflict with client meeting

Our team will confirm the new time within 24 hours.
```

### 5. Duplicate Prevention

**User Input Example:**
```
"I want to schedule another call"
```

**Expected Response (if user already has a meeting):**
```
You already have a discovery call scheduled for Fri Aug 16 2025 03:00 PM (America/New_York). 

If you need to make changes, please let me know and I can help you reschedule or cancel it.

Your existing meeting details:
• Reference: abc123-def456-ghi789  
• Meeting Link: https://meet.jit.si/mk-abc123-def456-ghi789
```

---

## 🔧 Technical Implementation

### Data Storage Structure

**Meeting Record in KV Storage:**
```json
{
  "id": "abc123-def456-ghi789",
  "type": "discovery_call_request", 
  "createdAt": 1724601600000,
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1 (555) 123-4567",
  "preferred_times": "tomorrow at 3 PM EST",
  "timezone": "America/New_York",
  "project_details": "Need help optimizing e-commerce conversion funnel",
  "proposed_time": "Fri Aug 16 2025 03:00 PM (America/New_York)",
  "meeting_link": "https://meet.jit.si/mk-abc123-def456-ghi789",
  "status": "pending"
}
```

**Status Values:**
- `"pending"` - Initial state, waiting for confirmation
- `"cancelled"` - User cancelled the meeting
- `"reschedule_requested"` - User requested reschedule
- `"confirmed"` - Meeting confirmed by admin
- `"completed"` - Meeting finished

### KV Storage Keys

```
meetreq:{tracking_id}  → Meeting record JSON
```

### Email Notifications

All meeting actions trigger email notifications to `OWNER_EMAIL`:

1. **New Meeting Request** - Full details with join link
2. **Cancellation Notice** - Cancellation reason and details  
3. **Reschedule Request** - New preferred times and reason

---

## 🎨 Email Template Features

### Design System
- **Colors**: #fafafa (background), #10d1ff/#ff4faa (gradients), #18181b (text)
- **Typography**: Apple system fonts with proper letter-spacing
- **Layout**: CSS Grid responsive design
- **Effects**: Subtle shadows and hover states

### Mobile Optimization
```css
@media (max-width:640px) {
  .outer { padding: 20px 16px }
  .content { padding: 24px 24px 20px }
  .grid { grid-template-columns: 1fr; gap: 16px }
  .brand { font-size: 24px }
  .btn { padding: 14px 24px; font-size: 15px }
  .header { padding: 24px 24px }
}
```

### Template Variables in Email
```html
<div class="value">${name}</div>
<div class="value">${email}</div>
<div class="value">${phone || 'Not provided'}</div>
<div class="value">${timezone || ownerTimezone}</div>
<div class="value">${(preferred_times || 'Flexible').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
<div class="value">${proposedTime}</div>
<a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Meeting →</a>
<div class="tracking">Reference: ${trackingId}</div>
```

---

## 🧪 Testing the System

### Test Scenarios

1. **New User Scheduling**
   ```
   User: "I'd like to book a discovery call for Friday at 2 PM"
   Expected: Full booking flow with email notification
   ```

2. **Existing User Lookup** 
   ```
   User: "Do I have any meetings scheduled?"
   Expected: List of existing meetings or "No meetings found"
   ```

3. **Duplicate Prevention**
   ```
   User with existing meeting: "Let me schedule another call"
   Expected: Message about existing meeting with management options
   ```

4. **Meeting Cancellation**
   ```
   User: "Cancel my meeting abc123-def456-ghi789"
   Expected: Cancellation confirmation and email notification
   ```

5. **Meeting Rescheduling**
   ```
   User: "Reschedule my call to next Tuesday at 1 PM"
   Expected: Reschedule request with email notification
   ```

### Debug Commands

```bash
# Check deployment status
npx wrangler dev --local

# View KV storage
npx wrangler kv:namespace list
npx wrangler kv:key list --namespace-id YOUR_KV_ID

# Check secrets
npx wrangler secret list

# View logs
npx wrangler tail
```

---

## 📋 Maintenance Tasks

### Regular Tasks

1. **Monitor Meeting Requests**
   - Check admin email for new discovery calls
   - Respond to reschedule requests within 24 hours
   - Update meeting statuses in KV storage

2. **Email Deliverability**
   - Monitor Resend dashboard for bounce rates
   - Update SPF/DKIM records if needed
   - Test email rendering across clients

3. **Performance Monitoring**
   - Check Cloudflare Analytics for response times
   - Monitor KV storage usage
   - Review error logs for failed operations

### Troubleshooting

**Email Not Sending:**
```bash
# Check Resend API key
npx wrangler secret list | grep RESEND

# Test with curl
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"MannyKnows <noreply@mannyknows.com>","to":["test@example.com"],"subject":"Test","text":"Test email"}'
```

**KV Storage Issues:**
```bash
# List all KV namespaces
npx wrangler kv:namespace list

# Check specific meeting
npx wrangler kv:key get "meetreq:TRACKING_ID" --namespace-id YOUR_KV_ID
```

**Timezone Problems:**
- Verify `OWNER_TIMEZONE=America/New_York` in wrangler.jsonc
- Check that date parsing uses correct timezone
- Test with different timezone inputs

---

## 🔄 Future Enhancements

### Planned Features

1. **Calendar Integration**
   - Two-way Google Calendar sync
   - Automatic calendar invites
   - Conflict detection

2. **Advanced Scheduling**
   - Multiple time zone support
   - Buffer time between meetings
   - Recurring meeting templates

3. **Analytics Dashboard**
   - Meeting conversion rates
   - Popular time slots
   - User engagement metrics

4. **Enhanced Notifications**
   - SMS reminders via Twilio
   - Slack integration for team alerts
   - Meeting preparation templates

### Code Organization

For future development, consider:

```typescript
// src/lib/meetings/
├── MeetingManager.ts      // Core meeting logic
├── EmailService.ts        // Email template and sending
├── CalendarService.ts     // Calendar integration
├── NotificationService.ts // Multi-channel notifications
└── types/
    └── Meeting.ts         // TypeScript interfaces
```

This will help maintain clean separation of concerns as the system grows.
