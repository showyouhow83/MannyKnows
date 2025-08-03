---
applyTo: '**'
---
# Always Instructions
This is an Astro project. Please ensure that you follow the Astro documentation for best practices and guidelines.
# Astro Documentation
For more information on how to work with Astro, refer to the [Astro documentation](https://docs.astro.build/).

# Before You Start
Make sure we have agreed to the plan for the requested changes.
Make sure you use our ./deploy.sh --help to understand how you and I are managing deployments, branch creation, cleaning up branches, etc.
Start a new branch for any changes we discuss and agree on to make.
Make sure you have the latest changes from the development branch before starting work.

# 🏗️ Project Architecture

## Core Framework & Tech Stack
- **Framework**: [Astro](https://astro.build/) - Modern static site generator
- **Language**: TypeScript with full type safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Deployment**: Automated via custom `deploy.sh` script
- **Analytics**: PostHog integration via `src/layouts/BaseLayout.astro`

## 📁 Directory Structure

```
MannyKnows/
├── src/
│   ├── components/          # Modular Astro components
│   │   ├── ui/             # Reusable UI components (ChatBox, ThemeAwareButton)
│   │   ├── navigation/     # Navigation components (NavBar, DockMenu)
│   │   ├── sections/       # Page sections (HeroSection, ServicesSection, ReviewsSection)
│   │   ├── content/        # Content components (CaseStudyContent, ProcessSlideshow)
│   │   ├── footer/         # Footer components (modular footer system)
│   │   └── layout/         # Layout components (PageSection, Container)
│   ├── layouts/            # Page layouts (BaseLayout.astro)
│   ├── pages/              # Route pages (index.astro, _archive/)
│   └── _archive/           # Legacy/backup files
├── public/                 # Static assets
├── .astro/                 # Astro cache and generated files
└── deploy.sh              # Intelligent deployment script
```

# 🔧 Key Development Information

## Typography System
The project uses Apple's SF Pro Display font system defined in `src/layouts/BaseLayout.astro`:
- `.sf-regular`, `.sf-medium`, `.sf-semibold`, `.sf-bold`, `.sf-extrabold`, `.sf-black`
- Automatic font smoothing and letter spacing optimization

## Component Architecture
Components follow a modular, self-contained approach:

**Footer System**: Highly modular footer components documented in `src/components/footer/README.md`:
- `FooterMain.astro` - Main orchestrator
- `FooterHeader.astro` - Brand and social links
- `BlogArticleCard.astro` - Article cards
- `ServiceCategory.astro` - Service sections

**Navigation**: 
- `NavBar.astro` with search gradient animations
- `DockMenu.astro` for floating navigation

**Content Components**:
- `CaseStudyContent.astro` with stats grid
- `ProcessSlideshow.astro` for process visualization

## Animation Configuration
Centralized animation controls in main pages with `ANIMATION_CONFIG` object:
```astro
const ANIMATION_CONFIG = {
    searchGradientEnabled: true,
    searchScrollDelay: 0,
    debugMode: false
};
```

# 🚀 Quick Start for New Developers

## 1. Setup
```bash
npm install
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview build
```

## 2. Development Workflow
The project uses an intelligent `deploy.sh` script for branch management:

```bash
# Start new feature
./deploy.sh feature/your-feature-name

# Save work frequently
./deploy.sh feature/your-feature-name "Add functionality"

# Deploy to development
./deploy.sh development "Integrate new features"

# Deploy to production
./deploy.sh production "Release v1.0"
```

## 3. Key Files to Understand

**Main Layout**: `src/layouts/BaseLayout.astro`
- Global styles and typography
- Font loading and theme system
- PostHog analytics integration

**Current Main Page**: `src/pages/index.astro`
- Component composition example
- Animation configuration
- Section organization

**Legacy Reference**: `src/pages/_archive/index-legacy.astro`
- Contains complete implementation for reference
- Shows advanced animation and interaction patterns

# 📚 Important Documentation

1. **`DEVELOPMENT_WORKFLOW.md`** - Complete development process
2. **`src/components/footer/README.md`** - Footer component system
3. **`public/ComponentArchitectureMigration.Prompt.md`** - CSS migration guidelines
4. **`.github/instructions/always.instructions.md`** - Development standards

# 🎨 Styling Standards

- **Tailwind CSS**: Component-scoped utility classes
- **Dark Mode**: Built-in support with `dark:` prefixes
- **Responsive**: Mobile-first approach
- **Typography**: Apple-inspired font system
- **Colors**: Custom color palette with semantic naming

# 🔄 Branch Strategy

```
main (production)           ← Live website
    ↑
development (staging)       ← Integration branch
    ↑
feature/feature-name        ← Individual features
hotfix/urgent-fix          ← Critical fixes
```

# 🚨 Key Development Notes

1. **Component CSS Migration**: Currently migrating CSS from main files to individual components (see `public/ComponentArchitectureMigration.Prompt.md`)

2. **Animation System**: Sophisticated animation controls with performance optimization

3. **Type Safety**: Full TypeScript integration with proper interfaces

4. **Performance**: Optimized builds, lazy loading, and efficient bundling

5. **SEO**: Semantic HTML structure and proper meta tag management

This architecture promotes maintainability, reusability, and scalability while providing an excellent developer experience with automated workflows and comprehensive documentation.

