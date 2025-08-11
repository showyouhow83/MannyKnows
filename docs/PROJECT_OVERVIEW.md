# MannyKnows Project Overview

## 🎯 What This Is

**MannyKnows** is a business consultation website with an AI-powered chatbot for lead generation and website analysis services. Built with Astro and deployed on Cloudflare Workers.

## 🏗️ Architecture

### **Tech Stack**
- **Framework**: Astro v5.12.3 (SSR)
- **Runtime**: Cloudflare Workers  
- **Styling**: Tailwind CSS v3.4.17
- **Language**: TypeScript
- **AI**: OpenAI GPT-4o integration
- **Storage**: Cloudflare KV + R2

### **Core Features**
1. **AI Chatbot** - Lead generation through conversational AI
2. **Website Analysis** - Technical analysis service with scoring
3. **Admin Panel** - Lead management interface
4. **File Storage** - R2 bucket for analysis reports

## 📁 Project Structure

```
MannyKnows/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Core UI (Button, Modal, ChatBox)
│   │   ├── sections/       # Page sections (Hero, Services)
│   │   └── navigation/     # NavBar, DockMenu
│   │
│   ├── config/             # Configuration files
│   │   └── chatbot/
│   │       └── environments.json  # AI behavior settings
│   │
│   ├── lib/                # Core business logic
│   │   └── chatbot/
│   │       └── promptBuilder.ts    # AI prompt generation
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro        # Page template
│   │
│   ├── pages/              # Routes and API endpoints
│   │   ├── index.astro             # Homepage
│   │   ├── admin/
│   │   │   └── leads.astro         # Admin interface
│   │   └── api/
│   │       ├── chat.ts             # Chatbot API
│   │       ├── analyze-website.ts  # Website analysis
│   │       ├── files/[...path].ts  # File serving
│   │       └── admin/leads.ts      # Lead management API
│   │
│   └── utils/
│       └── debug.ts                # Logging utilities
│
├── scripts/                # Build and optimization scripts
├── public/                 # Static assets
└── docs/                   # This documentation
```

## 🔄 Data Flow

### **Chatbot Interaction**
1. User opens chat modal on website
2. Frontend sends message to `/api/chat`
3. API loads environment config and builds AI prompt
4. OpenAI processes conversation with business context
5. Lead information extracted and stored in KV
6. Response returned to user

### **Website Analysis**
1. User requests analysis via chat or direct API call
2. System fetches target website content
3. Analysis performed (performance, SEO, accessibility)
4. Report generated and stored in R2 bucket
5. Scored results returned with recommendations

### **Admin Management**
1. Admin accesses `/admin/leads` with authentication
2. System retrieves leads from KV storage
3. Interface displays leads with export options
4. Admin can view, delete, or export lead data

## 🌍 Environments

### **Development**
- Model: `gpt-4o-mini`
- Storage: In-memory (temporary)
- Chatbot: Enabled
- Lead capture: Disabled
- Debug logging: Enabled

### **Production**
- Model: `gpt-4o`
- Storage: Cloudflare KV (persistent)
- Chatbot: Disabled (configurable)
- Lead capture: Enabled
- Debug logging: Disabled

## 🔧 Key Configuration

### **Cloudflare Bindings**
- `CHATBOT_KV` - Lead and session storage
- `SESSION` - Session management
- `MANNYKNOWS_R2` - Analysis report storage

### **Environment Variables**
- `OPENAI_API_KEY` - OpenAI API access (secret)
- `ADMIN_PASSWORD` - Admin panel authentication (secret)
- `GA_MEASUREMENT_ID` - Google Analytics tracking

## 🚀 What Actually Works

✅ **AI Chatbot** - Fully functional with OpenAI integration  
✅ **Lead Capture** - Automatic extraction and storage  
✅ **Website Analysis** - Complete technical analysis service  
✅ **Admin Panel** - Lead management with authentication  
✅ **File Storage** - R2 integration for reports  
✅ **Deployment** - Automated Cloudflare Workers deployment  

## ⚠️ What's Missing

❌ **User Verification System** - Planned anti-abuse protection  
❌ **Rate Limiting** - API usage controls  
❌ **Email Notifications** - Automated lead alerts  

## 📊 Current Status

- **Primary Function**: Lead generation through AI chat
- **Secondary Function**: Website analysis service  
- **Deployment**: Live on Cloudflare Workers
- **Admin Access**: HTTP Basic Auth protected
- **Data Persistence**: Cloudflare KV + R2 storage

This is a **working, production-ready system** focused on core business value over complexity.
