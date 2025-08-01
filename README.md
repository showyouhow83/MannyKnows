# 🚀 MannyKnows - AI-Powered E-commerce Solutions

Modern, component-based website built with Astro, TypeScript, and Tailwind CSS.

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/showyouhow83/MannyKnows.git
cd MannyKnows

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌿 Development Workflow

This project uses feature branch workflow for clean, professional development.

### Start New Feature

```bash
# Create and switch to new feature branch
./deploy.sh feature/your-feature-name
```

### Work on Feature

```bash
# Make code changes, then save progress
./deploy.sh feature/your-feature-name "Add new functionality"
./deploy.sh feature/your-feature-name "Fix styling issues"
```

### Deploy to Production

```bash
# After PR approval and merge
./deploy.sh production "Release v1.0.0"
```

## 🎯 Project Structure

```
src/
├── components/          # Modular Astro components
│   ├── ui/             # Reusable UI components
│   ├── navigation/     # Navigation components
│   ├── sections/       # Page sections
│   └── content/        # Content components
├── layouts/            # Page layouts
└── pages/              # Route pages
```

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type safety
- **Deployment**: GitHub Pages / Cloudflare Pages
- **Workflow**: Feature branch development with automated deployment

## 📋 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
./deploy.sh        # Intelligent deployment script
```

## 🚀 Features

- ✅ **Component Architecture**: Modular, reusable components
- ✅ **TypeScript**: Full type safety
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Performance**: Optimized builds and assets
- ✅ **SEO Friendly**: Semantic HTML and meta tags
- ✅ **Dark Mode**: Automatic theme switching
- ✅ **Accessibility**: ARIA labels and keyboard navigation

## 🤝 Contributing

1. **Create feature branch**: `./deploy.sh feature/your-feature`
2. **Make changes**: Edit code in VS Code
3. **Save progress**: `./deploy.sh feature/your-feature "Description"`
4. **Create PR**: From your feature branch to `development`
5. **Review & merge**: Code review process
6. **Deploy**: `./deploy.sh production "Release notes"`

## 📚 Documentation

- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Detailed development process
- [Component Guide](src/components/README.md) - Component documentation
- [Deployment Guide](#deployment) - Production deployment

## 🔧 Development

### Component Development

All components are in `src/components/` with TypeScript interfaces:

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<div class="component">
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</div>
```

### Styling

Uses Tailwind CSS with component-scoped styles:

```astro
<style>
  .component {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg;
  }
</style>
```

## 🚦 Branch Strategy

- **`main`**: Production-ready code
- **`development`**: Integration branch for features
- **`feature/*`**: Individual feature development
- **`hotfix/*`**: Critical production fixes

## 📈 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized with tree shaking
- **Loading**: Lazy loading and code splitting
- **Caching**: Proper cache headers and strategies

## 🔒 Security

- **Dependencies**: Regular security audits
- **Headers**: Security headers configured
- **Validation**: Input validation and sanitization
- **HTTPS**: SSL/TLS encryption enforced

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Progressive Enhancement**: Graceful degradation

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/showyouhow83/MannyKnows/issues)
- **Documentation**: [Development Workflow](DEVELOPMENT_WORKFLOW.md)
- **Contact**: [Website Contact Form](https://mannyknows.com/contact)

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ using modern web technologies.
