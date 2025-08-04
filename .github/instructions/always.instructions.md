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
3. **`.github/instructions/always.instructions.md`** - Development standards and performance rules
4. **`.github/instructions/performance.instructions.md`** - Detailed performance optimization patterns and examples
5. **Performance Optimization Examples**: ProcessSectionAlt.astro demonstrates best practices:
   - Hardware acceleration implementation
   - Cross-mode interaction preservation
   - Bundle size optimization
   - Accessibility improvements

# 🎨 Styling Standards

- **Tailwind CSS**: Component-scoped utility classes
- **Dark Mode**: Built-in support with `dark:` prefixes
- **Responsive**: Mobile-first approach
- **Typography**: Apple-inspired font system with SF Pro Display
- **Colors**: Custom color palette with semantic naming
- **Performance**: Hardware-accelerated animations with `will-change` hints
- **Accessibility**: Semantic HTML with proper ARIA attributes

## Performance-First CSS Guidelines
- Add `will-change` to animated elements
- Use `transform3d` for GPU acceleration
- Minimize layout-triggering properties
- Cache dynamic values in CSS custom properties
- Remove unused CSS classes and dead code
- Use efficient selectors and avoid deep nesting

# 🔄 Branch Strategy

```
main (production)           ← Live website
    ↑
development (staging)       ← Integration branch
    ↑
feature/feature-name        ← Individual features
hotfix/urgent-fix          ← Critical fixes
```

# ⚡ Performance Optimization Checklist

Before submitting any component changes, ensure you've followed these optimization rules:

## CSS Performance ✅
- [ ] Added `will-change` properties to animated elements
- [ ] Used `transform3d(0,0,0)` or `translateZ(0)` for GPU acceleration
- [ ] Removed unused CSS classes and dead code
- [ ] Used CSS custom properties for dynamic values
- [ ] Minimized layout-triggering properties (avoid changing `width`, `height`, `top`, `left`)

## JavaScript Performance ✅
- [ ] Cached DOM selectors instead of repeated queries
- [ ] Used `requestAnimationFrame` for smooth animations
- [ ] Added passive event listeners where appropriate
- [ ] Pre-calculated hover values and cached them
- [ ] Preserved intelligent cross-component interaction systems

## Accessibility ✅
- [ ] Added semantic `role` attributes
- [ ] Included proper ARIA labels and descriptions
- [ ] Ensured keyboard navigation support
- [ ] Added unique IDs for screen reader associations

## Bundle Size ✅
- [ ] Removed verbose comments from production CSS
- [ ] Compressed color arrays and data structures
- [ ] Consolidated similar animations and effects
- [ ] Cleaned up redundant code and unused imports

## Testing Requirements ✅
- [ ] Verified visual design remains identical
- [ ] Tested cross-component interactions (numbers ↔ cards)
- [ ] Confirmed touch and mouse events work properly
- [ ] Validated responsive behavior across breakpoints
- [ ] Ensured dark/light mode compatibility

# 🚨 Key Development Notes

## Performance-First Development Rules

### 1. **Hardware Acceleration Standards**
- **ALWAYS** add `will-change` properties to animated elements
- **ALWAYS** use `translateZ(0)` or `transform3d` for GPU acceleration
- **PREFER** `transform` over properties that trigger layout/paint
- **CACHE** DOM selectors in JavaScript - avoid repeated queries

### 2. **JavaScript Performance Rules**
- **USE** `requestAnimationFrame` for smooth animations
- **PRESERVE** intelligent cross-component interaction systems
- **ADD** passive event listeners where possible: `{ passive: true }`
- **CACHE** frequently used values (colors, transforms, etc.)
- **AVOID** inline style manipulation - use CSS classes when possible

### 3. **CSS Optimization Rules**
- **REMOVE** dead CSS code immediately
- **USE** CSS custom properties for dynamic values
- **CONSOLIDATE** similar animations and hover effects
- **ADD** hardware acceleration hints to animated elements
- **AVOID** complex box-shadows without `will-change`

### 4. **Cross-Mode Interaction Systems**
When working with components that have intelligent interactions:
- **PRESERVE** all cross-component awareness logic
- **MAINTAIN** touch/mouse/keyboard support
- **TEST** across different input modes and screen sizes
- **DOCUMENT** interaction patterns in component comments

### 5. **Bundle Size Management**
- **REMOVE** unused CSS classes and properties
- **COMPRESS** color arrays and data structures
- **CLEAN** verbose comments from production CSS
- **OPTIMIZE** gradient and animation definitions

## Component Architecture

Components follow a modular, self-contained approach with performance-first principles:

**ProcessSectionAlt**: Exemplifies optimized component architecture:
- Hardware-accelerated animations
- Cross-mode interaction system (numbers ↔ cards)
- Touch/mouse/keyboard support
- Cached DOM elements and pre-calculated values
- Semantic accessibility attributes

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

