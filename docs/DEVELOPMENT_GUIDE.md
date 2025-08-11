# Development Guide

Complete guide for local development and code contribution.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd MannyKnows

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`

---

## 🛠️ Development Workflow

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to Cloudflare Workers |

### Environment Configuration

Create a `.env` file for local development:
```env
# Local development only - use secrets in production
OPENAI_API_KEY=your-openai-api-key
ADMIN_PASSWORD=your-admin-password
```

**⚠️ Never commit `.env` to version control**

---

## 🔧 Core Development Areas

### 1. Chatbot Development

**Primary Files:**
- `src/pages/api/chat.ts` - Main API logic
- `src/lib/chatbot/promptBuilder.ts` - AI prompt system
- `src/config/chatbot/environments.json` - Behavior configuration

**Making Changes:**
```typescript
// Modify AI behavior in promptBuilder.ts
const CONFIG_DATA = {
  personas: {
    sales_agent: {
      // Customize personality and responses
    }
  }
}

// Update environment settings
// src/config/chatbot/environments.json
{
  "development": {
    "persona": "sales_agent",
    "model": "gpt-4o-mini",
    "chatbot_enabled": true
  }
}
```

### 2. Frontend Components

**Primary Files:**
- `src/components/ui/ProjectConsultationModal.astro` - Chat interface
- `src/components/ui/ChatBox.astro` - Chat UI components
- `src/components/sections/` - Page sections

**Component Structure:**
```astro
---
// Component logic (TypeScript)
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<!-- Component template (HTML) -->
<div class="component">
  <h2>{title}</h2>
</div>

<style>
/* Component styles (CSS/SCSS) */
.component {
  @apply bg-white rounded-lg shadow-md;
}
</style>
```

### 3. Website Analysis

**Primary Files:**
- `src/pages/api/analyze-website.ts` - Analysis logic
- `src/pages/api/files/[...path].ts` - File serving

**Adding Analysis Features:**
```typescript
// In analyze-website.ts
async function performAnalysis(html: string, url: string) {
  return {
    performanceScore: calculatePerformanceScore(html),
    seoScore: calculateSEOScore(html),
    accessibilityScore: calculateAccessibilityScore(html),
    // Add new analysis types here
  };
}
```

---

## 🗄️ Database Development

### Local Storage (Development)
- Uses in-memory arrays
- Data resets on server restart
- Good for testing

### Production Storage (KV)
- Persistent Cloudflare KV storage
- Requires deployment to test
- Use Wrangler for local KV testing

**Working with KV Locally:**
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Start dev server with KV bindings
wrangler pages dev -- npm run dev
```

---

## 🎨 Styling & UI

### Tailwind CSS Classes
The project uses Tailwind for all styling:

```html
<!-- Responsive design -->
<div class="w-full md:w-1/2 lg:w-1/3">

<!-- Custom components -->
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

<!-- Dark mode support -->
<div class="bg-white dark:bg-gray-800 text-black dark:text-white">
```

### Component Guidelines
- Use Astro components for reusability
- Keep styles scoped to components when possible
- Follow Tailwind utility-first approach
- Use TypeScript interfaces for props

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Chatbot Testing:**
- [ ] Chat modal opens and closes
- [ ] Messages send and receive responses
- [ ] Lead extraction works
- [ ] Message limits enforced
- [ ] Website analysis via chat works

**Admin Testing:**
- [ ] Admin login works
- [ ] Leads display correctly
- [ ] Lead deletion works
- [ ] Export functionality works

**API Testing:**
```bash
# Test chat API
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Test website analysis
curl -X POST http://localhost:4321/api/analyze-website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## 🔍 Debugging

### Debug Logging
Enable verbose logging in development:

```typescript
// src/utils/debug.ts
export function devLog(message: string, data?: any): void {
  if (isDev) {
    console.log(message, data);
  }
}

// Usage in code
devLog('Chat API request:', { message, session_id });
```

### Common Issues

**Chat Not Working:**
1. Check `OPENAI_API_KEY` is set
2. Verify `chatbot_enabled: true` in environments.json
3. Check browser console for errors
4. Verify API endpoint is accessible

**Leads Not Saving:**
1. Check storage adapter initialization
2. Verify KV bindings in production
3. Check admin panel for captured data

**Build Errors:**
1. Run `npm run build` locally first
2. Check TypeScript errors
3. Verify all imports exist

---

## 📁 File Organization

### Adding New Features

**New API Endpoint:**
1. Create file in `src/pages/api/`
2. Export `POST`, `GET`, etc. functions
3. Add to API documentation

**New UI Component:**
1. Create `.astro` file in appropriate `src/components/` subfolder
2. Define TypeScript interface for props
3. Use Tailwind for styling
4. Export for use in other components

**New Configuration:**
1. Add to `src/config/` directory
2. Update type definitions if needed
3. Import in relevant files

### Code Style Guidelines

```typescript
// Use TypeScript interfaces
interface ComponentProps {
  title: string;
  isVisible?: boolean;
}

// Use async/await for promises  
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    errorLog('Fetch failed:', error);
    throw error;
  }
}

// Use descriptive variable names
const userMessage = request.body.message;
const aiResponse = await generateResponse(userMessage);
```

---

## 🚀 Deployment Testing

### Local Production Build
```bash
# Build and preview production version
npm run build
npm run preview
```

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] API endpoints work in preview
- [ ] UI renders correctly

### Deployment Process
1. Test locally with production build
2. Commit changes to git
3. Run `npm run deploy`
4. Test live deployment
5. Monitor Cloudflare Workers logs

---

## 🔧 Development Tools

### Recommended VS Code Extensions
- Astro (astro-build.astro-vscode)
- Tailwind CSS IntelliSense
- TypeScript Importer
- GitLens

### Useful Commands
```bash
# Check build size
npm run build && du -sh dist/

# Clean build
rm -rf dist .astro && npm run build

# Check for TypeScript errors
npx astro check

# Format code (if Prettier configured)
npm run format
```

This development environment is optimized for rapid iteration while maintaining production quality.
