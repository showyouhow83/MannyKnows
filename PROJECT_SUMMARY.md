# MannyKnows Project Summary

## 🏗️ Project Overview

**MannyKnows** is a modern business consultation website built with Astro, deployed on Cloudflare Workers. The site features an AI-powered chatbot for lead generation and project consultations.

### 🎯 Core Purpose
- Business consultation services website
- AI-powered customer engagement through chatbot
- Lead generation and qualification
- Modern, responsive design with premium animations

## 🛠️ Technical Architecture

### Framework & Runtime
- **Frontend**: Astro v5.12.3 with SSR (Server-Side Rendering)
- **Runtime**: Cloudflare Workers
- **Styling**: Tailwind CSS v3.4.17
- **Language**: TypeScript

### Key Dependencies
```json
{
  "astro": "^5.12.3",
  "@astrojs/cloudflare": "^12.6.2", 
  "@astrojs/tailwind": "^6.0.2",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.9.2"
}
```

### Development Tools
- Performance monitoring scripts
- Automated optimization pipeline
- Bundle analysis and size checking
- Mac system file cleanup automation

## 🤖 AI Chatbot System

### Architecture
- **API**: `/src/pages/api/chat.ts` - Main chatbot endpoint
- **Models**: OpenAI GPT-4.1-nano integration
- **Configuration**: Environment-based persona and behavior management
- **Storage**: Cloudflare KV for conversation history (production)

### Key Features
- ✅ Intelligent conversation management
- ✅ Lead scoring and qualification
- ✅ Message limits for cost control
- ✅ Environment-based configuration (dev/staging/production)
- ✅ Online/Offline mode toggle
- ✅ Response validation and guardrails
- ✅ Session management

### Configuration Files
```
src/config/chatbot/
├── environments.json    # Environment-specific settings
├── personas.json        # AI personality configurations
├── goals.json          # Business objectives
├── guardrails.json     # Response validation rules
└── tools.json          # Available chatbot tools
```

### Offline Mode
- Configurable via `chatbot_enabled` flag in environments.json
- When disabled, shows contact information instead of AI chat
- Graceful fallback for maintenance or API issues

## 📁 Project Structure

```
MannyKnows/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── analytics/       # Google Analytics integration
│   │   ├── content/         # Content-specific components
│   │   ├── footer/          # Footer sections and elements
│   │   ├── layout/          # Layout components
│   │   ├── navigation/      # Navigation and menu components
│   │   ├── sections/        # Page sections (Hero, Process, Reviews)
│   │   └── ui/              # Core UI elements (Button, Modal, etc.)
│   │
│   ├── config/              # Configuration files
│   │   └── chatbot/         # Chatbot-specific configuration
│   │
│   ├── layouts/             # Page layout templates
│   │   └── BaseLayout.astro # Main layout template
│   │
│   ├── lib/                 # Core libraries and utilities
│   │   ├── chatbot/         # Chatbot core functionality
│   │   └── database/        # Database adapters and schema
│   │
│   ├── pages/               # Route pages
│   │   ├── api/             # API endpoints
│   │   ├── admin/           # Admin interface
│   │   ├── demo/            # Demo pages
│   │   └── index.astro      # Homepage
│   │
│   └── utils/               # Utility functions
│
├── scripts/                 # Build and optimization scripts
│   ├── cleanup-mac-files.js      # Remove Mac system files
│   ├── critical-css-extract.js   # CSS optimization
│   ├── optimization-summary.js   # Performance reporting
│   ├── performance-budget.js     # Size budget enforcement
│   ├── performance-dashboard.js  # Performance metrics
│   ├── production-build.js       # Full build pipeline
│   └── safe-html-optimize.js     # HTML optimization
│
├── public/                  # Static assets
├── astro.config.mjs        # Astro configuration
├── tailwind.config.mjs     # Tailwind configuration
├── wrangler.jsonc          # Cloudflare Workers configuration
└── package.json            # Project dependencies and scripts
```

## 🎨 Key Components

### Core UI Components
- **ProjectConsultationModal.astro**: Main chatbot interface
- **NavBar.astro**: Responsive navigation with animations
- **HeroSection.astro**: Landing page hero
- **ProcessSection.astro**: Service process visualization
- **ReviewsSection.astro**: Customer testimonials
- **ServicesSection.astro**: Service offerings

### Layout System
- **BaseLayout.astro**: Main page wrapper with theme management
- **Container.astro**: Responsive content containers
- **Section.astro**: Consistent section styling

### Specialized Components
- **ChatBox.astro**: Alternative chat interface
- **DockMenu.astro**: macOS-style navigation dock
- **SettingsModal.astro**: User preferences
- **ThemeAwareButton.astro**: Theme-responsive buttons

## 🚀 Deployment & Environment

### Cloudflare Workers Configuration
```json
// wrangler.jsonc
{
  "name": "mannyknows",
  "main": "./dist/_worker.js", 
  "compatibility_date": "2024-11-18",
  "account_id": "f2cb7f9c07dd4587efbd7772ff8e324f"
}
```

### Environment Variables
- **OPENAI_API_KEY**: Stored as Cloudflare secret
- **GA_MEASUREMENT_ID**: Google Analytics tracking
- **NODE_ENV**: Environment detection

### Storage Configuration
- **Production**: Cloudflare KV storage for conversations
- **Development**: In-memory storage
- **R2 Storage**: Configured for file storage needs

## 📊 Performance Optimization

### Build Pipeline
1. **Cleanup**: Remove Mac system files
2. **Build**: Astro SSG/SSR compilation  
3. **Optimize**: HTML/CSS/JS optimization
4. **Report**: Performance metrics generation
5. **Validate**: Budget enforcement

### Performance Budgets
- **Total Bundle**: <500KB
- **CSS**: <30KB  
- **JavaScript**: <50KB
- **HTML**: <100KB per page

### Optimization Features
- Automatic dead code elimination
- CSS purging and optimization
- Image optimization with Astro's built-in service
- Cloudflare edge caching
- Bundle analysis and size monitoring

## 🔧 Development Workflow

### Available Scripts
```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview               # Preview production build

# Performance & Optimization  
npm run perf:budget           # Check performance budgets
npm run perf:optimize         # Full optimization pipeline
npm run size:check            # Bundle size analysis

# Deployment (using Wrangler CLI)
wrangler dev                  # Local development with Workers
wrangler deploy               # Deploy to production
wrangler secret put OPENAI_API_KEY  # Set environment secrets
```

### Quality Assurance
- ✅ TypeScript type checking
- ✅ Automated performance budgets
- ✅ Bundle size monitoring
- ✅ Console log cleanup for production
- ✅ Mac system file cleanup
- ✅ HTML/CSS/JS optimization

## 🚦 Current Status

### ✅ Completed Features
- [x] Full Astro SSR setup with Cloudflare adapter
- [x] AI chatbot with OpenAI integration
- [x] Environment-based configuration system
- [x] Online/offline chatbot toggle
- [x] Production-ready optimization pipeline
- [x] Automated deployment via Wrangler CLI
- [x] Performance monitoring and budgets
- [x] Responsive design with Tailwind CSS
- [x] Console log cleanup (production-ready)
- [x] Mac system file cleanup automation

### 🎯 Architecture Highlights
- **Modular Design**: Components are well-organized and reusable
- **Performance-First**: Built-in optimization and monitoring
- **Environment Flexibility**: Easy dev/staging/production management
- **Cost Control**: Message limits and validation for AI usage
- **Graceful Degradation**: Offline mode for maintenance
- **Modern Tooling**: TypeScript, Astro, Cloudflare edge deployment

### 🔒 Security & Best Practices
- Environment variables properly secured
- API keys stored as Cloudflare secrets
- Input validation and response guardrails
- Production logging disabled
- Rate limiting via message counts

## 📈 Future Considerations

### Potential Enhancements
- User authentication for personalized experiences
- Analytics dashboard for lead tracking
- CRM integration for lead management
- A/B testing for chatbot responses
- Multi-language support
- Advanced caching strategies

### Monitoring & Maintenance
- Regular performance budget reviews
- Chatbot conversation quality monitoring
- API usage and cost tracking
- Security vulnerability scanning
- Dependency updates and compatibility checks

---

**Last Updated**: December 2024  
**Deployment**: https://mannyknows.showyouhow83.workers.dev  
**Status**: Production Ready ✅
