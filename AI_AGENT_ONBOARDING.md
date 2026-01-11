# AI Agent Onboarding Guide - MannyKnows Project

## 🎯 Project Overview

**MannyKnows** is a comprehensive AI-powered business automation platform built with Astro.js and deployed on Cloudflare Workers. The platform offers AI agents, workflow automation, and intelligent business solutions.

### Core Business Services
- **AI Sales Agents** - Lead generation, follow-up, appointment booking, phone agents
- **AI Customer Support** - 24/7 service, voice assistants, multilingual support, AI concierge
- **eCommerce Solutions** - Web scraping, smart forms, personalized recommendations, dynamic pricing
- **Workflow Automation** - Data entry, invoice processing, CRM automation, smart scheduling
- **Creative Services** - Photography (wedding, portrait, product, real estate), 360° services
- **Business Analytics** - AI web intelligence, competitor analysis, data visualization, operational analytics
- **AI Content Generation** - Product descriptions, videos, photography
- **Training & Consulting** - AI training, consulting, office hours

## 🏗️ Technical Architecture

### Framework Stack
- **Frontend**: Astro.js 5.13.0 (Server-side rendering)
- **Styling**: Tailwind CSS 3.4.17 + Custom Apple-inspired design system
- **Runtime**: Cloudflare Workers (Node.js compatibility enabled)
- **Database**: Cloudflare KV (multiple namespaces)
- **Storage**: Cloudflare R2 Buckets
- **Email**: Resend API
- **Analytics**: Google Analytics + Custom minimal analytics

### Key Technologies
```bash
astro: 5.13.0                    # Main framework
@astrojs/cloudflare: ^12.6.3     # Cloudflare adapter
@astrojs/tailwind: ^6.0.2        # Tailwind integration
tailwindcss: ^3.4.17             # CSS framework
typescript: ^5.9.2               # Type safety
wrangler: ^4.30.0                # Cloudflare deployment
```

### Project Statistics
- **41 Astro Components**: Modular, reusable UI components
- **42 TypeScript Files**: Type-safe business logic and services
- **Version**: 6.0.0 (currently on main-v7 branch)
- **Last Updated**: August 29, 2025

### Repository Structure
```
MannyKnows/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── analytics/       # GA and tracking components
│   │   ├── content/         # Content-specific components
│   │   ├── footer/          # Footer sections
│   │   ├── layout/          # Layout components
│   │   ├── navigation/      # Navigation components
│   │   ├── sections/        # Page sections
│   │   └── ui/              # Base UI components
│   ├── config/              # Configuration files
│   │   └── chatbot/         # Chatbot environment configs
│   ├── layouts/             # Page layouts
│   │   └── BaseLayout.astro # Main layout template
│   ├── lib/                 # Core libraries
│   │   ├── chatbot/         # Chatbot logic
│   │   ├── security/        # Security utilities
│   │   ├── services/        # Business logic services
│   │   └── user/            # User management
│   ├── pages/               # Routes and API endpoints
│   │   ├── api/             # API routes
│   │   ├── admin.astro      # Admin dashboard
│   │   ├── index.astro      # Homepage
│   │   └── 404.astro        # Error page
│   ├── templates/           # Email templates
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── scripts/                 # Build and utility scripts
├── astro.config.mjs         # Astro configuration
├── wrangler.jsonc           # Cloudflare Workers config
├── package.json             # Dependencies and scripts
├── tailwind.config.mjs      # Tailwind configuration
└── deploy.sh                # Deployment script
```

## 🔐 Security & Authentication

### Admin Authentication System
- **Primary Auth**: `ADMIN_KEY` + `ADMIN_EMAIL` combination
- **Session Management**: JWT-like session tokens stored in KV
- **Multi-layer Protection**: AdminAuthenticator, AdminRateLimiter, CSRF protection
- **Rate Limiting**: Environment-aware (stricter in production)

### Key Security Components
```typescript
// Located in src/lib/security/
AdminAuthenticator.ts     // Handles admin login/session management
AdminRateLimiter.ts      // Environment-aware rate limiting
csrfProtection.ts        // CSRF token validation
domainValidator.ts       // Domain whitelist validation
inputValidator.ts        // Input sanitization
kvEncryption.ts         // KV data encryption
rateLimiter.ts          // General rate limiting
```

### Admin Credentials (Production)
```bash
ADMIN_KEY: "mk_admin_merh3t5d_c37019aff77f4677_637b7da191124a68"
ADMIN_EMAIL: "mk@mannyknows.com"
```

### Recent Security Updates
- **Chat API Fix**: Added `chat_reference` field to input validation schema (Dec 2025)
- **Admin Dashboard**: Enhanced timestamp conversion and display formatting
- **Input Validation**: Comprehensive field validation including optional chat reference

## 💾 Data Storage Architecture

### Cloudflare KV Namespaces
```javascript
// From wrangler.jsonc
CHATBOT_KV     // Chat sessions, admin sessions, newsletter data
PROFILES       // User profiles and preferences  
SESSIONS       // User session data
KV_SERVICES    // Service configurations
KV_PRODUCTS    // Product data
SCHEDULER_KV   // Discovery call scheduling data
```

### Data Patterns
```typescript
// Newsletter subscribers (CHATBOT_KV)
Key: "newsletter:{email}"
Value: { email, status, subscribedAt, unsubscribeToken }

// Discovery calls (SCHEDULER_KV) 
Key: "meetreq:{id}"
Value: { 
  id, name, email, phone, project_details, 
  preferred_times, proposed_time, status, 
  createdAt, adminNotes, meeting_link 
}

// Admin sessions (CHATBOT_KV)
Key: "admin_session:{sessionToken}"
Value: { email, createdAt, expiresAt }
```

### R2 Storage
```javascript
MANNYKNOWS_R2  // Website analysis results and file storage
Bucket: "mannyknows-website-analysis"
```

## 🛠️ Development Workflow

### Local Development
```bash
# Start development server
npm run dev                    # Runs on http://localhost:4321

# Build for production
npm run build                  # Compiles to dist/

# Deploy to production
./deploy.sh                    # Builds + deploys to Cloudflare
# OR manual steps:
npm run build && npx wrangler deploy
```

### Environment Files
```bash
.dev.vars                     # Local environment variables (not in git)
wrangler.jsonc               # Production environment variables
```

### Important: Build Before Deploy
⚠️ **CRITICAL**: Always run `npm run build` before `npx wrangler deploy`
- Astro needs to compile .astro files to JavaScript
- Without building, old compiled versions will be deployed
- The deploy.sh script handles this automatically

### Git Workflow
```bash
# Current branch: main-v7 (latest production)
# Version: 6.0.0
git add .
git commit -m "feat: description of changes"
git push origin main-v7

# Recent commits:
# 14e1411 - fix: Improve timestamp conversion logic in admin dashboard
# bbc9963 - fix: Add chat_reference field to input validation schema
# 53ff763 - Remove unauthorized deployment checklist that caused issues
```

## 🌐 API Endpoints

### Core APIs
```typescript
// Main chat/scheduling API
/api/chat.ts
- GET:  Initialize chat session, get CSRF token
- POST: Process chat messages, handle discovery call scheduling

// Admin APIs
/api/admin-login.ts          // Admin authentication
/api/newsletter-admin.ts     // Newsletter management
/api/meetings-admin.ts       // Discovery calls management

// Utility APIs
/api/contact.ts              // Contact form processing
/api/newsletter.ts           // Newsletter subscription
/api/calendar-health.ts      // System health checks
/api/security-status.ts      // Security monitoring
/api/services-analysis.ts    // Service analytics
/api/verify-meeting-action.ts // Meeting verification
```

### API Authentication Patterns
```typescript
// Chat API - CSRF protection
headers: { 'X-CSRF-Token': csrfToken }

// Admin APIs - Session token authentication  
URL: `/api/meetings-admin?session=${sessionToken}`
Body: { action, ...params }

// Input validation for all APIs
- chat_reference field now supported in chat API
- Comprehensive security validation via InputValidator
```

## 📧 Email System

### Resend API Integration
```javascript
// Environment variables
RESEND_API_KEY               // API key (secret)
RESEND_FROM: "Manny <mk@mannyknows.com>"

// Email types
- Discovery call confirmations
- Status change notifications (confirmed, cancelled, joined)
- Newsletter confirmations
```

### Email Templates
```typescript
// Located in src/pages/api/chat.ts
- discoveryCallConfirmation() // Sent when call is scheduled
- sendMeetingStatusEmail()    // Sent on status changes
```

## 🎨 UI/UX Patterns

### Design System
- **Apple-inspired** typography and spacing
- **Dark/Light mode** support with system preference detection
- **Gradient themes** for branding
- **Mobile-first** responsive design
- **Accessibility** considerations

### Key UI Components
```astro
// Navigation
NavBar.astro                 // Main navigation with animations
DockMenu.astro              // Floating action menu

// Sections  
HeroSection.astro           // Landing hero
ServicesSection.astro       // Services grid
ReviewsSection.astro        // Customer testimonials
ProcessSectionAlt.astro     // Process steps

// Interactive
ChatBox.astro               // AI chat interface
SettingsModal.astro         // Theme and settings
```

### CSS Architecture
```css
/* Base styles in BaseLayout.astro */
- Apple-style typography (SF Pro, system fonts)
- Gradient utilities and animations  
- Dark mode CSS variables
- Mobile-responsive utilities

/* Component-specific styles */
- Scoped <style> blocks in .astro files
- Tailwind utility classes
- Custom gradient and animation classes
```

## 🚀 Deployment & Production

### Cloudflare Workers Deployment
```bash
# Production URL
https://mannyknows.com
https://www.mannyknows.com

# Deployment process
./deploy.sh                  # Recommended (handles build + deploy)
npm run build && npx wrangler deploy  # Manual steps

# Environment
Runtime: Cloudflare Workers
Node.js compatibility: enabled
Observability: enabled
```

### Production Configuration
```javascript
// wrangler.jsonc key settings
compatibility_date: "2025-08-08"
compatibility_flags: ["nodejs_compat"]
routes: [
  { "pattern": "mannyknows.com/*", "zone_name": "mannyknows.com" },
  { "pattern": "www.mannyknows.com/*", "zone_name": "mannyknows.com" }
]
```

### Monitoring
- **Cloudflare Analytics**: Built-in performance monitoring
- **Google Analytics**: User behavior tracking
- **Error Logging**: Console errors tracked in production

## 🔧 Common Tasks for AI Agents

### 1. Admin Dashboard Management
```typescript
// File: src/pages/admin.astro
// Features: 
- Unified tabbed interface (Newsletter + Discovery Calls)
- Meeting status management (pending → confirmed → joined → completed)
- Call summary collection with adminNotes field
- Email notifications on status changes
- CSV export functionality
- Mobile-responsive design with professional modals
- Enhanced timestamp formatting ([MM/DD] format)
- Real-time data refresh and filtering
```

### 2. Adding New Services
```astro
// File: src/components/sections/ServicesSection.astro
// Current services include:
{
  title: "AI-Powered E-commerce Websites",
  title: "AI Web Intelligence & Analytics", 
  title: "Smart Business Automation",
  title: "AI Training & Business Consulting",
  title: "E-commerce Photography & Creative"
  // ... more services
}

// Pattern for new services:
{
  title: "Service Name",
  description: "Detailed description with benefits and metrics",
  icon: `<svg>...</svg>`,
  tags: "Feature • Feature • Feature",
  variant: "color" as const,
  pixelColors: "#hex, #hex, #hex"
}
```

### 3. Core AI Services Available
```typescript
// File: src/lib/services/components/userServices.ts
- AI Web Intelligence Scan (analyze_website)
- Competitive Intelligence Service (upcoming)
- Digital Marketing Audit Service (upcoming)  
- Business Growth Optimizer Service (upcoming)

// Key capabilities:
- SEO analysis and recommendations
- Performance optimization suggestions
- AI readiness assessment
- Automation opportunity identification
- Business impact calculations
```

### 4. Email Template Updates
```typescript
// File: src/pages/api/chat.ts
// Functions:
- discoveryCallConfirmation(): Email when call scheduled
- sendMeetingStatusEmail(): Email on status changes

// Email capabilities:
- HTML + text versions
- Professional tone with chat buttons
- Clear call-to-action
- Meeting link integration
- Status change notifications (confirmed, cancelled, joined, completed)
```

### 5. Chat System Management
```typescript
// File: src/components/ui/ChatBox.astro
// Recent fixes:
- Added chat_reference field support
- Session management improvements
- Error handling for 400 responses
- localStorage integration for session persistence

// Key features:
- AI-powered conversation handling
- Discovery call booking integration
- Session reference tracking
- Mobile-responsive design
```

### 6. Security Management
```typescript
// Security utilities in src/lib/security/:
adminAuthenticator.ts     // Admin login/session management
adminRateLimiter.ts      // Environment-aware rate limiting
csrfProtection.ts        // CSRF token validation
domainValidator.ts       // Domain whitelist validation
inputValidator.ts        // Input sanitization (recently updated)
kvEncryption.ts         // KV data encryption
rateLimiter.ts          // General rate limiting

// Pattern for new API endpoints:
1. Import security classes from src/lib/security/
2. Implement rate limiting
3. Validate inputs (including chat_reference field)
4. Use proper CORS headers
5. Handle authentication
6. Log security events
```

### 7. UI Component Development
```astro
// Component architecture (41 total Astro components):
src/components/
├── analytics/           # GA and tracking components
├── content/            # Content-specific components
├── footer/             # Modular footer sections
├── layout/             # Layout components (Container, Section, PageSection)
├── navigation/         # NavBar, DockMenu
├── sections/           # HeroSection, ServicesSection, ReviewsSection
└── ui/                 # Base UI components (Button, ChatBox, Tag, etc.)

// Pattern for new components:
---
// TypeScript props interface
export interface Props {
  title: string;
  variant?: 'primary' | 'secondary';
}
const { title, variant = 'primary' } = Astro.props;
---

<!-- HTML with Tailwind classes -->
<div class="responsive-classes dark:dark-classes">
  <h2 class="apple-typography">{title}</h2>
</div>

<style>
  /* Scoped component styles */
  .custom-style {
    /* Component-specific CSS */
  }
</style>
```

## 🐛 Troubleshooting Guide

### Common Issues

#### 1. Chat API Errors (Recently Fixed)
```bash
Problem: "Missing session_id parameter" or "Unexpected field: chat_reference"
Solution: ✅ FIXED - Added chat_reference to input validation schema
File: src/lib/security/inputValidator.ts
Status: Deployed to production (August 29, 2025)
```

#### 2. Admin Notes Not Displaying
```bash
Problem: Admin notes saved but not visible
Solution: Check if Admin Notes column added to both table header AND data rows
File: src/pages/admin.astro
Recent: Enhanced timestamp formatting and display logic
```

#### 3. Deployment Issues
```bash
Problem: Changes not appearing in production
Solution: Build before deploy
Commands: npm run build && npx wrangler deploy
Auto: ./deploy.sh (recommended - handles build + deploy)
```

#### 4. Authentication Failures
```bash
Problem: Admin login failing
Check: wrangler.jsonc ADMIN_KEY and ADMIN_EMAIL values
Check: Browser localStorage for stale sessions
Clear: localStorage.removeItem('admin_session')
```

#### 5. KV Namespace Issues
```bash
Problem: Data not loading
Check: Correct KV namespace in API calls
SCHEDULER_KV: Discovery calls
CHATBOT_KV: Newsletter, admin sessions
PROFILES: User profiles
SESSIONS: User session data
KV_SERVICES: Service configurations
KV_PRODUCTS: Product data
```

#### 5. Email Not Sending
```bash
Problem: Email notifications not working
Check: RESEND_API_KEY in secrets (not in wrangler.jsonc)
Deploy with: ./deploy.sh --update-secrets
```

### Debugging Tools
```typescript
// Development logging
import { devLog, errorLog } from '../../utils/debug';
devLog('Debug message'); // Only shows in development
errorLog('Error message'); // Shows in all environments

// Console inspection
// Check browser dev tools for API errors
// Check Cloudflare Workers logs for server errors
```

### Performance Optimization
```bash
# Check bundle size
npm run size:check

# Analyze build
npm run build:analyze

# Clean build
npm run build:clean
```

## 📝 Code Standards

### TypeScript Best Practices
```typescript
// Use proper typing
interface MeetingData {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'confirmed' | 'joined' | 'completed' | 'cancelled';
}

// Error handling
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  errorLog('API call failed:', error);
  return { success: false, error: error.message };
}
```

### Astro Component Patterns
```astro
---
// Props interface
export interface Props {
  required: string;
  optional?: boolean;
}

// Destructure with defaults
const { required, optional = false } = Astro.props;
---

<!-- Use semantic HTML -->
<section class="responsive-container">
  <h2 class="typography-heading">{required}</h2>
  {optional && <p>Optional content</p>}
</section>

<style>
  /* Scoped styles only */
  .typography-heading {
    @apply text-2xl font-bold;
  }
</style>
```

### Security Patterns
```typescript
// Always validate inputs
const validator = new InputValidator();
const cleanInput = validator.sanitize(userInput);

// Use rate limiting
const rateLimiter = new AdminRateLimiter(kvNamespace);
await rateLimiter.checkLimit(clientIP, 'admin_action');

// Implement CSRF protection
const csrf = new CSRFProtection(kvNamespace);
const isValid = await csrf.validateToken(token, sessionId);
```

## 🎯 Next Steps for New Agents

### Quick Start Checklist
1. ✅ Clone repository and review this documentation
2. ✅ Run `npm install` to install dependencies
3. ✅ Set up `.dev.vars` file with environment variables
4. ✅ Start development server with `npm run dev`
5. ✅ Test admin login at `http://localhost:4321/admin`
6. ✅ Make a small change and deploy to understand workflow
7. ✅ Review key files: admin.astro, chat.ts, meetings-admin.ts
8. ✅ Understand KV data patterns and API authentication

### Advanced Understanding
1. 📚 Study the service architecture in `src/lib/services/`
2. 🔐 Review security implementations in `src/lib/security/`
3. 🎨 Understand the UI component patterns and design system
4. 📧 Test email functionality with different status changes
5. 📊 Explore analytics and monitoring setup
6. 🚀 Practice deployment workflow and troubleshooting

### Key Files to Master
```bash
# Core application logic
src/pages/admin.astro           # Admin dashboard (recently enhanced)
src/pages/api/chat.ts           # Main chat/scheduling API (chat_reference support)
src/pages/api/meetings-admin.ts # Meeting management
src/pages/api/admin-login.ts    # Admin authentication
src/pages/index.astro           # Homepage

# Security (Critical)
src/lib/security/inputValidator.ts  # Input validation (recently updated)
src/lib/security/               # All security utilities

# AI Services
src/lib/services/ServiceArchitecture.ts    # Service definitions
src/lib/services/components/userServices.ts # User-facing AI services
src/lib/services/components/websiteComponents.ts # Core analysis components

# Configuration
wrangler.jsonc                  # Production config (6 KV namespaces, R2 bucket)
astro.config.mjs               # Build config (server mode, Cloudflare adapter)
package.json                   # Dependencies (v6.0.0)
tailwind.config.mjs            # UI styling (Apple-inspired design)

# UI Components (41 files)
src/components/sections/       # Main page sections
src/layouts/BaseLayout.astro   # Main layout
src/components/ui/ChatBox.astro # AI chat interface (recently fixed)
```

## 🔗 External Dependencies

### Critical Third-Party Services
- **Cloudflare Workers**: Runtime environment
- **Cloudflare KV**: Database storage
- **Cloudflare R2**: File storage
- **Resend API**: Email delivery
- **Google Analytics**: User tracking

### Development Dependencies
- **Astro.js**: Framework
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety
- **Wrangler CLI**: Deployment tool

---

*This documentation is generated from current codebase analysis and updated on August 29, 2025. Current version: 6.0.0 on main-v7 branch. Keep it updated as the project evolves.*
