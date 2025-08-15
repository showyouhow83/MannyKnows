# MannyKnows 

AI-powered business solutions platform with intelligent chat assistance and automated meeting scheduling.

## 🚀 Quick Start

### Deployment

```bash
# Normal deployment (recommended)
./deploy.sh

# Deploy with API key updates (only when needed)
./deploy.sh --update-secrets
```

**Live Site**: https://mannyknows.showyouhow83.workers.dev

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Documentation

- **[Deployment & Meeting Management Guide](./DEPLOYMENT_AND_MEETING_MANAGEMENT.md)** - Complete documentation for deployment, meeting system, and code examples
- **[Email Templates Guide](./EMAIL_TEMPLATES.md)** - Email template documentation and customization

## 🎯 Key Features

### AI Chat Assistant
- Intelligent business consultation
- Service recommendations
- Lead qualification and capture
- Website analysis and optimization tips

### Meeting Management System
- **Schedule Discovery Calls** - Automated booking with email notifications
- **Lookup Existing Meetings** - Find appointments by email
- **Meeting Management** - Cancel and reschedule functionality
- **Duplicate Prevention** - One meeting per email address
- **Professional Email Templates** - Site-matching design with clean aesthetics

### Business Services
- Website analysis and optimization
- SEO audit and recommendations
- Industry insights and market intelligence
- AI automation consultation

## 🏗️ Architecture

### Frontend
- **Astro SSR** - Server-side rendering on Cloudflare Workers
- **Tailwind CSS** - Utility-first styling
- **Apple-Inspired Design** - Clean, professional aesthetic

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare KV** - Key-value storage for meetings and user data
- **Cloudflare R2** - Object storage for file analysis

### Integrations
- **OpenAI GPT** - AI chat functionality
- **Resend API** - Professional email delivery
- **Jitsi Meet** - Video meeting platform
- **Google Analytics** - Traffic and behavior tracking

## 📊 Environment Variables

```env
# Required
OWNER_EMAIL=showyouhow83@gmail.com
OWNER_TIMEZONE=America/New_York
RESEND_FROM=MannyKnows <noreply@mannyknows.com>

# API Keys (stored as secrets)
RESEND_API_KEY=
OPENAI_API_KEY=
ADMIN_PASSWORD=

# Analytics
GA_MEASUREMENT_ID=G-J0V35RZNZB
```

## 🔧 Meeting System Usage

### User Interactions

**Schedule a call:**
```
"I'd like to schedule a discovery call for tomorrow at 3 PM"
```

**Check existing meetings:**
```
"Do I have any meetings coming up with you?"
```

**Cancel a meeting:**
```
"I need to cancel my meeting"
```

**Reschedule a meeting:**
```
"Can we move my call to next Friday at 2 PM?"
```

### Technical Implementation

The system uses three main functions:

1. `schedule_discovery_call` - Creates new meetings with duplicate prevention
2. `lookup_existing_meetings` - Finds meetings by email address  
3. `manage_meeting` - Handles cancellation and rescheduling

See [DEPLOYMENT_AND_MEETING_MANAGEMENT.md](./DEPLOYMENT_AND_MEETING_MANAGEMENT.md) for complete code examples.

## 📁 Project Structure

```
├── src/
│   ├── pages/
│   │   ├── index.astro          # Main landing page
│   │   └── api/
│   │       └── chat.ts          # AI chat API with meeting management
│   ├── components/              # Reusable UI components
│   ├── lib/
│   │   ├── services/           # Business logic and service architecture
│   │   ├── chatbot/            # AI prompt building and configuration
│   │   └── user/               # User profile management
│   └── templates/
│       └── DiscoveryCallEmail.astro  # Email template component
├── public/                      # Static assets
├── scripts/                     # Build and utility scripts
├── email-template-preview.html  # Standalone email preview
├── deploy.sh                    # Deployment script
└── wrangler.jsonc              # Cloudflare Workers configuration
```

## 🧪 Testing

### Meeting System Testing

1. **New Meeting**: Schedule a call and verify email notification
2. **Duplicate Prevention**: Try booking another call with same email
3. **Lookup**: Ask about existing meetings
4. **Cancellation**: Cancel a meeting and check notification
5. **Rescheduling**: Request reschedule with new times

### Debug Commands

```bash
# View deployment logs
npx wrangler tail

# Check KV storage
npx wrangler kv:key list --namespace-id YOUR_KV_ID

# Test locally
npx wrangler dev --local
```

## 🔄 Deployment Process

1. **Build**: Compiles Astro project to `/dist`
2. **Upload**: Deploys assets to Cloudflare
3. **Worker**: Updates serverless functions
4. **Verify**: Checks bindings and environment variables

**Deployment Time**: ~10-15 seconds
**No Downtime**: Rolling deployment

## 📈 Monitoring

- **Analytics**: Google Analytics dashboard
- **Performance**: Cloudflare Analytics
- **Emails**: Resend delivery dashboard
- **Errors**: Cloudflare Workers logs

## 🛠️ Maintenance

### Regular Tasks
- Monitor meeting requests via email
- Respond to reschedule requests
- Check email deliverability rates
- Review performance metrics

### Troubleshooting
- KV storage connectivity issues
- Email delivery failures
- API rate limiting
- Timezone handling problems

See [DEPLOYMENT_AND_MEETING_MANAGEMENT.md](./DEPLOYMENT_AND_MEETING_MANAGEMENT.md) for detailed troubleshooting steps.

## 📄 License

© 2025 MannyKnows. All rights reserved.
