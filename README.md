# MannyKnows - Marketing & Web Development Studio

Modern business consultation website with AI-powered chatbot for lead generation and website analysis services.

## 🚀 Quick Start

```bash
# Development
npm install
npm run dev

# Production deployment
npm run build
npm run deploy
```

## 🎯 **Current Features**

### ✅ **AI Chat System**
- OpenAI GPT-4o powered business consultation
- Automatic lead capture and storage
- Environment-based model selection (gpt-4o-mini dev, gpt-4o prod)
- Message limits and conversation management

### ✅ **Website Analysis Service**
- Comprehensive website performance analysis
- SEO, accessibility, and performance scoring
- Automated report generation and R2 storage
- Integration with chat system for analysis requests

### ✅ **Admin Dashboard**
- Lead management with viewing, deletion, and export
- HTTP Basic Authentication security
- Both development (memory) and production (KV) storage support

## 📚 **Documentation**

Complete and up-to-date documentation is available in the [`docs/`](docs/) directory:

- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Architecture and system overview
- **[API Reference](docs/API_REFERENCE.md)** - Complete API endpoint documentation  
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Local development setup and workflow
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## 📁 Project Structure

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Core UI elements
│   ├── sections/        # Page sections  
│   └── navigation/      # Navigation components
├── config/
│   └── chatbot/
│       └── environments.json    # AI behavior configuration
├── lib/
│   └── chatbot/
│       └── promptBuilder.ts     # AI prompt generation
├── pages/
│   ├── index.astro              # Homepage
│   ├── admin/
│   │   └── leads.astro          # Admin interface
│   └── api/
│       ├── chat.ts              # Chatbot API
│       ├── analyze-website.ts   # Website analysis
│       ├── files/[...path].ts   # File serving
│       └── admin/leads.ts       # Lead management API
└── utils/
    └── debug.ts                 # Logging utilities
```

## ⚙️ Configuration

### Environment Variables
Set via Cloudflare Workers secrets:
```bash
npx wrangler secret put OPENAI_API_KEY    # Required for chatbot
npx wrangler secret put ADMIN_PASSWORD    # Required for admin access
```

### Chat Configuration
Edit `src/config/chatbot/environments.json`:
```json
{
  "development": {
    "model": "gpt-4o-mini",
    "chatbot_enabled": true,
    "debug_logging": true
  },
  "production": {
    "model": "gpt-4o", 
    "chatbot_enabled": false,
    "debug_logging": false
  }
}
```

## 🛠️ Development Commands

```bash
npm run dev               # Start development server (localhost:4321)
npm run build            # Build for production  
npm run deploy           # Deploy to Cloudflare Workers
npm run perf:analyze     # Performance analysis
```

## 📊 Admin Features

- **Lead Management**: `/admin/leads` (HTTP Basic Auth)
- **Export Options**: CSV, JSON, Google Sheets integration
- **Analysis Reports**: Accessible via R2 file serving
- **Real-time Logs**: Available via `wrangler tail`

## 🎯 System Status

### ✅ **Production Ready**
- AI chatbot with lead capture
- Website analysis service
- Admin panel with authentication
- Cloudflare Workers deployment
- KV and R2 storage integration

### ⚠️ **Not Implemented**
- User verification system (planned)
- Rate limiting controls
- Email notifications
- Advanced analysis features

## � Troubleshooting

**Chatbot Issues:**
- Check `chatbot_enabled: true` in environments.json
- Verify `OPENAI_API_KEY` secret is set
- Monitor browser console for errors

**Admin Access:**
- Ensure `ADMIN_PASSWORD` secret is configured
- Use HTTP Basic Auth credentials
- Check Cloudflare Workers logs

**Analysis Service:**
- Verify R2 bucket exists and is accessible
- Check `MANNYKNOWS_R2` binding in wrangler.jsonc
- Monitor API response for error details

**Full roadmap**: [`docs/plans/`](docs/plans/) folder

### Prompt Strategy
The AI is configured as "Sally," a sales agent focused on:
- Identifying business problems
- Creating urgency without giving free solutions
- Gathering project intel for sales conversations
- Qualifying leads (budget, timeline, authority)
- Scheduling consultations with Manny

## 🔧 Troubleshooting

### Chat Issues
- **Offline message**: Check `chatbot_enabled` in environments.json
- **API errors**: Verify `OPENAI_API_KEY` is set via `wrangler secret`
- **No response**: Check browser console for error details

### Deployment Issues
- **Build fails**: Run `npm run build` locally first
- **Deploy fails**: Ensure `wrangler login` is completed
- **Runtime errors**: Check Cloudflare Workers logs

## 📈 Next Steps

### Short Term
- Monitor chat performance and lead quality
- Adjust prompts based on conversation outcomes
- Add analytics tracking if needed

### Long Term
- Consider persistent database (Cloudflare D1) for leads
- Add streaming responses for better UX
- Implement proper authentication for admin area

---

**Note**: This is a simplified, working system focused on reliability over complexity. All removed components are backed up in `.cleanup-backup/` if needed.
