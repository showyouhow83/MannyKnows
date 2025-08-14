# Google Calendar Integration Setup

## Overview
The MannyKnows website now includes full Google Calendar integration for Manny's scheduling functionality. This allows Manny to check real availability and create calendar events with Google Meet links.

## Required Environment Variables

Add these to your environment configuration (`.env` file or deployment platform):

```bash
# Google Calendar API Configuration
GOOGLE_CALENDAR_ACCESS_TOKEN=your_oauth2_access_token_here
OWNER_EMAIL=your-calendar-email@example.com
```

## Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. OAuth2 Credentials
1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if needed
4. Set application type to "Web application"
5. Add authorized redirect URIs (for your domain)
6. Download the client configuration JSON

### 3. Generate Access Token
You'll need to generate an OAuth2 access token with calendar permissions. Options:

#### Option A: Using Google OAuth2 Playground
1. Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon, check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In Step 1, select "Google Calendar API v3" > "https://www.googleapis.com/auth/calendar"
5. Click "Authorize APIs" and complete the OAuth flow
6. In Step 2, click "Exchange authorization code for tokens"
7. Copy the access_token value

#### Option B: Programmatic Token Generation
Create a script to handle the OAuth2 flow programmatically (recommended for production).

### 4. Calendar Permissions
The access token must have these scopes:
- `https://www.googleapis.com/auth/calendar` (full calendar access)
- `https://www.googleapis.com/auth/calendar.events` (event management)

### 5. Test Configuration
Once configured, Manny can:
- Check your real calendar availability
- Schedule discovery calls with Google Meet links
- Handle scheduling conflicts intelligently
- Suggest alternative times when busy

## Features Included

### Availability Checking
- Real-time calendar conflict detection
- Business hours filtering (9 AM - 6 PM)
- Weekend handling
- Timezone support

### Event Creation
- Automatic Google Meet link generation
- Professional event descriptions
- Email notifications to participants
- Calendar invitations

### Conflict Resolution
- Suggests alternative times when conflicts exist
- Shows next available slots
- Graceful error handling

## Usage Examples

Users can now say:
- "I'd like to schedule a discovery call"
- "When are you available next week?"
- "Can we meet tomorrow at 2 PM?"
- "Schedule a consultation for Friday"

Manny will check your real calendar and either:
1. Confirm availability and create the event
2. Show available alternative times
3. Suggest the best available slots

## Security Notes

- Store tokens securely (use environment variables)
- Consider implementing token refresh for long-term use
- Regularly rotate access tokens
- Monitor API usage in Google Cloud Console

## Troubleshooting

### Common Issues
1. **"Calendar not accessible"** - Check token permissions and scopes
2. **"API quota exceeded"** - Monitor usage in Google Cloud Console
3. **"Invalid credentials"** - Verify environment variables are set correctly
4. **"Timezone errors"** - Ensure OWNER_EMAIL calendar has timezone configured

### Debug Mode
The service includes detailed error logging. Check server logs for specific error messages.

## Cost Considerations

Google Calendar API has generous free quotas:
- 1 billion requests per day (free tier)
- Rate limit: 100 requests per 100 seconds per user

Normal usage should stay well within free limits.
