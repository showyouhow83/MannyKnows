# MannyKnows - Marketing & Web Development Studio

A professional business website with AI-powered chat functionality and protected website analysis services.

## 🚀 Quick Start

```bash
# Development
npm install
npm run dev

# Production deployment
npm run build
npm run deploy
```

## 🎯 **Features**

### ✅ **AI Chat System**
- OpenAI GPT-4o powered business consultation
- Lead capture and management
- Environment-based configuration

### ✅ **Website Analysis** (Protected Service)
- Comprehensive website performance analysis
- SEO and accessibility scoring
- Professional report generation
- **🔐 Requires email verification** (professional users only)

### ✅ **Admin Dashboard**
- Lead management and export
- Analysis tracking
- Password-protected access

## 📚 **Documentation Overview**

### **📁 Organized Documentation Structure**
All documentation is organized in the [`docs/`](docs/) folder:

```
docs/
├── 📖 README.md                     # Complete documentation guide
├── 📊 current/                      # What's working right now
│   └── CURRENT_STATUS.md            # System status & features
├── 🔥 implementation/               # Active development
│   └── VERIFICATION_SYSTEM_PLAN.md  # USER VERIFICATION (current priority)
├── 📋 plans/                        # Future implementation
│   ├── EMAIL_INTEGRATION_PLAN.md    # Phase 2: Professional reports
│   ├── MODULAR_ANALYSIS_PLAN.md     # Phase 3: Plugin architecture
│   └── WEBSITE_ANALYSIS_ROADMAP.md  # Long-term: Advanced features
└── 📁 archive/                      # Historical reference
    ├── CHATBOT_CLEANUP_REPORT.md    # System cleanup process
    ├── QUICK_DEPLOY.md              # Deployment instructions
    └── [historical docs...]
```

### **🎯 Quick Navigation**
- **See what's working**: [`docs/current/CURRENT_STATUS.md`](docs/current/CURRENT_STATUS.md)
- **Current development**: [`docs/implementation/VERIFICATION_SYSTEM_PLAN.md`](docs/implementation/VERIFICATION_SYSTEM_PLAN.md) ⭐
- **All documentation**: [`docs/README.md`](docs/README.md)

### **🔥 Current Priority**
**IMPLEMENTING**: User verification & anti-abuse system for website analysis service
- Professional gatekeeping (email-domain validation)
- Rate limiting (IP, email, domain)
- Prevents free abuse while serving legitimate customers

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/
│   │   └── ProjectConsultationModal.astro  # Chat modal interface
## 📁 Project Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── ChatBox.astro                  # Chat interface
│   │   └── ProjectConsultationModal.astro # Chat modal
│   └── [other components...]
├── config/
│   └── chatbot/
│       └── environments.json               # Chat configuration
├── lib/
│   └── chatbot/
│       └── promptBuilder.ts                # AI prompt system
├── pages/
│   ├── index.astro                        # Main website
│   └── api/
│       ├── chat.ts                        # Chat API endpoint
│       ├── analyze-website.ts             # Website analysis API
│       ├── files/[...path].ts             # R2 file serving
│       └── admin/
│           └── leads.ts                   # Lead management
└── utils/
    └── debug.ts                           # Logging utilities
```

## ⚙️ Configuration

### Environment Variables
Set via Cloudflare Workers secrets:
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ADMIN_PASSWORD     # For admin access
npx wrangler secret put RESEND_API_KEY     # For email verification (coming soon)
```

### Chat Configuration
Edit `src/config/chatbot/environments.json` for behavior settings.

## 🛠️ Development

```bash
npm run dev                # Start development server
npm run build             # Build for production  
npm run deploy            # Deploy to Cloudflare Workers
```

## 📊 Admin Access

- **Lead Management**: Visit `/admin/leads` (password protected)
- **Analysis Tracking**: Coming with verification system
- **Usage Analytics**: Planned feature

## 🚀 Current Development

**Active Implementation**: User verification system for website analysis service

**Why First**: Establish professional gatekeeping before expanding features to protect service value and ensure legitimate customer usage.

**See**: [`docs/implementation/VERIFICATION_SYSTEM_PLAN.md`](docs/implementation/VERIFICATION_SYSTEM_PLAN.md) for complete implementation details.

## 📈 **Development Roadmap**

1. **🔐 User Verification** (CURRENT) - Professional access control
2. **📧 Email Integration** (NEXT) - Professional report delivery  
3. **🧩 Modular Analysis** (FUTURE) - Enhanced plugin capabilities
4. **🖼️ Advanced Features** (ROADMAP) - Screenshots, Lighthouse, enterprise

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
