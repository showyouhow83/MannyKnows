# MannyKnows AI Coding Instructions

## 🏗️ Project Architecture

This is an **Astro + TypeScript + Tailwind CSS** project with modular component architecture and automated deployment workflows.

### Key Technologies
- **Astro**: Static site generator with component-based architecture
- **TypeScript**: Full type safety across all components  
- **Tailwind CSS**: Utility-first styling with custom theme system
- **PostHog**: Analytics integration via `src/components/analytics/PostHogAdvanced.astro`

## 🚀 Critical Development Workflow

### Branch Management with `./deploy.sh`
**ALWAYS use the deployment script** - never use raw git commands:

```bash
# Start new feature
./deploy.sh feature/your-feature-name

# Save progress frequently  
./deploy.sh feature/your-feature-name "Add functionality"

# Deploy to staging
./deploy.sh development "Integrate features"

# Deploy to production
./deploy.sh production "Release v1.0"
```

The script automatically handles: builds, commits, branch creation, and GitHub pushes.

### Before Any Development
1. Check current branch: `./deploy.sh --status`
2. Start from development: `./deploy.sh feature/descriptive-name`
3. Work in small commits: `./deploy.sh feature/name "Small change"`

## 📁 Component Architecture Patterns

### Component Organization
```
src/components/
├── ui/              # Reusable UI components (Button, ChatBox, Cards)
├── navigation/      # NavBar, DockMenu with animation configs
├── sections/        # Page sections (HeroSection, ServicesSection)
├── content/         # Content-specific (CaseStudyContent, ProcessSlideshow) 
├── footer/          # Modular footer system (see footer/README.md)
└── layout/          # Layout utilities (PageSection, Container)
```

### TypeScript Interface Pattern
Every component uses props interfaces:

```astro
---
interface Props {
  title: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const { title, className = "", variant = 'primary' } = Astro.props;
---
```

### Animation Configuration Pattern
Main pages use centralized `ANIMATION_CONFIG` objects:

```astro
const ANIMATION_CONFIG = {
  searchGradientEnabled: true,
  searchScrollDelay: 0,
  debugMode: false
};

// Pass to components
<NavBar animationConfig={{
  searchGradientEnabled: ANIMATION_CONFIG.searchGradientEnabled,
  debugMode: ANIMATION_CONFIG.debugMode
}} />
```

## 🎨 Styling System

### Typography Classes (Apple-inspired)
- `.sf-regular`, `.sf-medium`, `.sf-semibold`, `.sf-bold`, `.sf-extrabold`, `.sf-black`
- Defined in `src/layouts/BaseLayout.astro` with Apple font stack

### Theme System
Custom Tailwind theme with semantic color naming:
- **Light**: `bg-light-primary`, `text-text-light-primary`
- **Dark**: `bg-dark-primary`, `text-text-dark-primary`  
- **Interactive**: `border-light-hover`, `border-dark-hover`

### Component-Scoped Styles
Prefer component-scoped `<style>` blocks over global CSS. Currently migrating from ID-based selectors to component encapsulation (see `public/ComponentArchitectureMigration.Prompt.md`).

## 🔧 Build and Development

### Essential Commands
```bash
npm run dev          # Development server
npm run build        # Production build (runs automatically in deploy.sh)
npm run preview      # Preview build locally
```

### Component Development Workflow
1. Create component in appropriate `src/components/` subdirectory
2. Add TypeScript interface for props
3. Use semantic Tailwind classes with theme-aware variants
4. Add component-scoped styles if needed
5. Update parent pages to import and use component

## 📚 Key Files to Understand

- **`src/layouts/BaseLayout.astro`**: Global layout, font system, analytics integration
- **`src/pages/index.astro`**: Main page composition with animation configs
- **`deploy.sh`**: Intelligent deployment script (never use raw git)
- **`tailwind.config.mjs`**: Custom theme definitions
- **`src/components/footer/README.md`**: Example of modular component documentation

## 🚨 Important Development Rules

1. **Use `./deploy.sh` for ALL git operations** - handles builds and branch management
2. **Follow component-scoped styling** - avoid global CSS additions
3. **TypeScript interfaces required** for all component props  
4. **Theme-aware styling** using custom Tailwind classes
5. **Animation configs** should be centralized in page files, not components
6. **Read component READMEs** before modifying existing component systems

## 🔍 Common Patterns

### Footer Component System
Highly modular footer documented in `src/components/footer/README.md`. Use as reference for component decomposition patterns.

### Button Variants
Multiple button variants in `src/components/ui/Button.astro`: `primary`, `apple`, `green`, `urgent`, `cta`. See `src/components/ui/README.md`.

### Navigation Animation
Complex animation system in `NavBar.astro` with configurable timing and debug modes passed from parent pages.

When in doubt, examine existing components for patterns before creating new approaches.
