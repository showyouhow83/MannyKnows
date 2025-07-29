# MannyKnows - Business Solutions Website

A professional business website built with Astro for offering web development, digital marketing, and business consulting services.

## 🚀 Project Structure

```
/
├── public/          # Static assets
├── src/
│   ├── layouts/     # Page layouts
│   ├── pages/       # Routes and pages
│   └── components/  # Reusable components
├── astro.config.mjs # Astro configuration
└── package.json
```

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`     |
| `npm run build`           | Build your production site to `./dist/`         |
| `npm run preview`         | Preview your build locally, before deploying    |

## 📦 Deployment Options

### Cloudflare Pages (Recommended)

1. Push code to GitHub repository
2. Connect repository to Cloudflare Pages
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** 18 or higher

### Netlify

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### Vercel

1. Push code to GitHub repository
2. Import project in Vercel
3. Deploy with default Astro settings

## 🌟 Features

- ✅ Modern, responsive design
- ✅ SEO optimized
- ✅ Fast loading performance
- ✅ Professional service pages
- ✅ Contact forms ready for integration
- ✅ Mobile-first approach
- ✅ Accessible design

## �️ Customization

### Updating Content

- **Services:** Edit `/src/pages/services/web-development.astro`
- **About page:** Edit `/src/pages/about.astro`
- **Homepage:** Edit `/src/pages/index.astro`
- **Contact info:** Update email/phone in layout and pages

### Adding New Services

Create new files in `/src/pages/services/` following the pattern of `web-development.astro`.

### Styling

- Global styles are in `/src/layouts/Layout.astro`
- Page-specific styles are in individual `.astro` files

## 📧 Contact Integration

To make the contact forms functional:

1. Add form handling service (Netlify Forms, Formspree, etc.)
2. Update form action attributes
3. Add any required hidden fields

## 🔧 Next Steps

1. Replace placeholder images with real photos
2. Update contact information
3. Customize colors and branding
4. Add real testimonials and case studies
5. Set up analytics (Google Analytics, etc.)
6. Configure domain and SSL

## 📄 License

Private business website for MannyKnows.
