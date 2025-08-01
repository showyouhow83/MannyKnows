# Footer Components

This directory contains modular, reusable footer components for the MannyKnows website. The footer has been broken down into logical, maintainable components.

## Component Structure

### 📁 Footer Components

```
src/components/footer/
├── FooterMain.astro          # Main footer container (orchestrates all components)
├── FooterHeader.astro        # Brand, social links, blog articles, newsletter
├── FooterServices.astro      # Services section container
├── ServiceCategory.astro     # Individual service category component
├── BlogArticleCard.astro     # Individual blog article card
├── FooterBottom.astro        # Copyright and legal links
└── README.md                 # This file
```

## Components Overview

### 🏠 FooterMain.astro
The main footer orchestrator that imports and arranges all footer sections. Passes configuration props to child components.

**Props:**
- `brandTitle?: string` - Brand title (default: "MK")
- `brandDescription?: string` - Brand description
- `socialLinks?: object` - Social media links
- `brandName?: string` - Footer brand name
- `brandIdentifier?: string` - Brand identifier
- `links?: object` - Footer navigation links

### 🎯 FooterHeader.astro  
Contains the top section with brand info, social links, blog articles, and newsletter signup.

**Features:**
- Brand title and description
- Social media icons with hover effects
- Blog article cards (configurable)
- Newsletter signup form

### 📝 BlogArticleCard.astro
Reusable component for individual blog article previews.

**Props:**
- `icon: 'chat' | 'document' | 'analytics'` - Icon type
- `category: string` - Article category
- `title: string` - Article title  
- `categoryColor: 'blue' | 'purple' | 'orange'` - Color theme
- `href: string` - Link URL

### 🛠️ ServiceCategory.astro
Flexible component for service categories that supports multiple sections within one category.

**Props:**
- `title: string` - Primary category title
- `icon: string` - SVG icon HTML
- `services: Service[]` - Array of services
- `hasSecondarySection?: boolean` - Enable secondary section
- `hasThirdSection?: boolean` - Enable third section
- Additional props for secondary/third sections

### 🏢 FooterServices.astro
Container that manages all service categories. Contains the service data and renders each category.

### 📜 FooterBottom.astro
Copyright, legal links, and brand identifier section.

**Props:**
- `brandName?: string` - Company name
- `brandIdentifier?: string` - Brand identifier  
- `currentYear?: number` - Copyright year
- `links?: object` - Legal page links

## Usage Examples

### Basic Footer
```astro
---
import FooterMain from '../components/footer/FooterMain.astro';
---

<FooterMain />
```

### Customized Footer
```astro
---
import FooterMain from '../components/footer/FooterMain.astro';
---

<FooterMain 
  brandTitle="CustomBrand"
  brandDescription="Custom description"
  socialLinks={{
    linkedin: "https://linkedin.com/company/custom",
    youtube: "https://youtube.com/@custom",
    tiktok: "https://tiktok.com/@custom"
  }}
  brandName="Custom Company"
  links={{
    sitemap: "/sitemap.xml",
    privacy: "/privacy-policy",
    terms: "/terms-of-service"
  }}
/>
```

### Individual Blog Article Card
```astro
---
import BlogArticleCard from '../components/footer/BlogArticleCard.astro';
---

<BlogArticleCard 
  icon="chat"
  category="AI & Technology"
  title="How AI is Transforming Business"
  categoryColor="blue"
  href="/blog/ai-transforming-business"
/>
```

### Custom Service Category
```astro
---
import ServiceCategory from '../components/footer/ServiceCategory.astro';
---

<ServiceCategory
  title="Web Development"
  icon="<svg>...</svg>"
  iconGradient="from-blue-500 to-cyan-500"
  textColor="text-blue-400"
  services={[
    { href: "/services/web-dev", label: "Website Development" },
    { href: "/services/ecommerce", label: "E-commerce Sites" }
  ]}
  backgroundGradient="from-blue-500/10 to-cyan-500/10"
  borderColor="border-blue-400/20"
  hoverShadow="hover:shadow-blue-500/20"
/>
```

## Benefits of This Structure

### ✅ Maintainability
- Each component has a single responsibility
- Easy to update individual sections without affecting others
- Clear separation of concerns

### ✅ Reusability  
- Components can be reused across different pages
- Blog articles and service categories are easily configurable
- Social links and brand info can be centrally managed

### ✅ Flexibility
- Easy to add/remove sections
- Service categories support multiple subsections
- All styling and content is configurable via props

### ✅ Scalability
- Add new service categories by updating data arrays
- Blog articles can be fetched from CMS/API
- Easy to extend with new functionality

## Styling Notes

- Uses Tailwind CSS for styling
- Maintains consistent design patterns from original footer
- Supports dark/light mode transitions
- Responsive design with mobile-first approach
- Gradient effects and hover animations preserved

## Data Management

Service categories and blog articles are currently defined as data arrays within components. For dynamic content, consider:

- Moving data to separate configuration files
- Fetching from a CMS or API
- Using Astro's content collections for blog articles
- Environment-based configuration for different deployments
