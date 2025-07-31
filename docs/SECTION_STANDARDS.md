# Section Standards & Structure Guide

## Overview
This document defines the### Background Variations

### Standard Backgrounds
```css
/* Default Section Background */
bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90

/* Alternative: Reversed Direction */
bg-gradient-to-tl from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90

/* Alternative: Subtle Variation */
bg-gradient-to-br from-gray-100/85 via-gray-50/90 to-gray-200/85 dark:from-slate-800/85 dark:via-gray-900/90 dark:to-gray-800/85
```

### Standard Parallax Elements
```astro
<!-- Parallax Background Elements (Required for all sections) -->
<div class="absolute inset-0 z-0">
	<div class="absolute top-20 left-10 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
	<div class="absolute bottom-20 right-10 w-96 h-96 bg-primary-pink/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
	<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-full blur-3xl animate-spin-slow"></div>
</div>
``` structure, styling, and patterns for all website sections to ensure consistency, maintainability, and professional appearance across the MannyKnows platform.

## Standard Section Template

### Basic Section Structure
```astro
<section id="section-name" class="relative py-16 bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90 border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300 overflow-hidden">
	<!-- Parallax Background Elements -->
	<div class="absolute inset-0 z-0">
		<div class="absolute top-20 left-10 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
		<div class="absolute bottom-20 right-10 w-96 h-96 bg-primary-pink/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-full blur-3xl animate-spin-slow"></div>
	</div>

	<!-- Optional: Additional Background Effects -->
	<div class="absolute inset-0 opacity-5 dark:opacity-10">
		<div class="absolute inset-0 bg-gradient-to-r from-primary-blue/20 via-primary-pink/20 to-primary-blue/20 animate-gradient-shift"></div>
	</div>

	<div class="max-w-[1440px] mx-auto px-8 relative z-10">
		<!-- Section Header -->
		<div class="text-center mb-16">
			<h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6">
				<span class="apple-gradient-text" data-colorful-title>Section Title</span>
			</h2>
			<p class="sf-medium apple-body-text text-xl text-text-light-secondary dark:text-text-dark-secondary">
				Section description or tagline
			</p>
		</div>
		
		<!-- Section Content -->
		<!-- Add your section-specific content here -->
	</div>
</section>
```

## Required CSS Classes & Patterns

### Section Container
- **Base Classes**: `relative py-16 overflow-hidden`
- **Background**: `bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90`
- **Border**: `border-t border-gray-300/30 dark:border-white/10`
- **Transitions**: `transition-colors duration-300`

### Content Container
- **Layout**: `max-w-[1440px] mx-auto px-8 relative z-10`
- **Purpose**: Centers content with consistent max-width, padding, and proper z-index above parallax elements

### Section Header Standards
- **Container**: `text-center mb-16`
- **Main Title**: `sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6`
- **Gradient Text**: `apple-gradient-text` with `data-colorful-title` attribute
- **Subtitle**: `sf-medium apple-body-text text-xl text-text-light-secondary dark:text-text-dark-secondary`

## Typography Hierarchy

### Heading Levels
1. **Section Title (H2)**: `text-4xl md:text-6xl lg:text-7xl` + `sf-bold apple-headline`
2. **Subsection Title (H3)**: `text-3xl md:text-4xl` + `font-bold`
3. **Card/Component Title (H4)**: `text-xl md:text-2xl` + `font-semibold`
4. **Small Title (H5)**: `text-lg md:text-xl` + `font-medium`

### Text Elements
- **Body Text**: `text-base md:text-lg` + `sf-regular`
- **Large Body**: `text-xl` + `sf-medium`
- **Small Text**: `text-sm` + `sf-regular`
- **Caption**: `text-xs` + `sf-regular`

### Color Patterns
- **Primary Text**: `text-text-light-primary dark:text-text-dark-primary`
- **Secondary Text**: `text-text-light-secondary dark:text-text-dark-secondary`
- **Tertiary Text**: `text-text-light-tertiary dark:text-text-dark-tertiary`

## Background Variations

### Standard Backgrounds
```css
/* Default Section Background */
bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90

/* Alternative: Reversed Direction */
bg-gradient-to-tl from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90

/* Alternative: Subtle Variation */
bg-gradient-to-br from-gray-100/85 via-gray-50/90 to-gray-200/85 dark:from-slate-800/85 dark:via-gray-900/90 dark:to-gray-800/85
```

### Special Section Types

#### Hero Section (Exception)
- Uses special Apple-style: `apple-gradient-container`
- Different sizing: `py-6 text-center min-h-[calc(45vh+50px)] flex items-center`

#### Interactive Sections (Standard)
- All sections now include: `overflow-hidden` for parallax effects
- Parallax elements are now standard across all sections

## Optional Enhancements

### Background Effects
```astro
<!-- Animated Background Pattern -->
<div class="absolute inset-0 opacity-5 dark:opacity-10">
	<div class="absolute inset-0 bg-gradient-to-r from-primary-blue/20 via-primary-pink/20 to-primary-blue/20 animate-gradient-shift"></div>
</div>

<!-- Parallax Elements -->
<div class="absolute inset-0 z-0">
	<div class="absolute top-20 left-10 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
	<div class="absolute bottom-20 right-10 w-96 h-96 bg-primary-pink/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
</div>

<!-- Top Border Accent -->
<div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-blue to-transparent"></div>
```

### Navigation Integration
- Use consistent section IDs for navigation: `#services`, `#reviews`, `#process`, etc.
- Ensure section headers include proper ARIA labels if needed

## Implementation Checklist

When creating a new section:

### ✅ Structure
- [ ] Use standard section container with required classes
- [ ] Include proper max-width container
- [ ] Add consistent padding (`py-16`)
- [ ] Include theme-aware background gradient

### ✅ Typography
- [ ] Use `sf-bold apple-headline` for main titles
- [ ] Apply `text-4xl md:text-6xl lg:text-7xl` sizing
- [ ] Include `apple-gradient-text` with `data-colorful-title`
- [ ] Use theme-aware text colors throughout

### ✅ Accessibility
- [ ] Proper heading hierarchy (H2 for section titles)
- [ ] Semantic HTML structure
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support

### ✅ Responsive Design
- [ ] Mobile-first approach
- [ ] Consistent breakpoints (sm, md, lg, xl)
- [ ] Proper text scaling across devices
- [ ] Touch-friendly interactive elements

### ✅ Theme Support
- [ ] Light/dark mode compatibility
- [ ] Consistent color patterns
- [ ] Proper contrast ratios
- [ ] Theme transition animations

## Examples

### Standard Content Section
```astro
<section id="features" class="relative py-16 bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90 border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300">
	<div class="max-w-[1440px] mx-auto px-8 relative">
		<div class="text-center mb-16">
			<h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6">
				<span class="apple-gradient-text" data-colorful-title>Amazing Features</span>
			</h2>
			<p class="sf-medium apple-body-text text-xl text-text-light-secondary dark:text-text-dark-secondary">
				Discover what makes our platform unique
			</p>
		</div>
		
		<!-- Feature grid or content here -->
	</div>
</section>
```

### Interactive Section with Effects
```astro
<section id="interactive" class="relative py-16 bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90 border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300 overflow-hidden">
	<!-- Parallax Background -->
	<div class="absolute inset-0 z-0">
		<div class="absolute top-20 left-10 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
		<div class="absolute bottom-20 right-10 w-96 h-96 bg-primary-pink/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
	</div>

	<div class="max-w-[1440px] mx-auto px-8 relative z-10">
		<!-- Standard header structure -->
		<!-- Interactive content here -->
	</div>
</section>
```

## File Updates Required

When adding new sections:

1. **Update Navigation**: Add new section links to main navigation
2. **Update Analytics**: Include tracking for new section interactions
3. **Update Sitemap**: Ensure new sections are crawlable
4. **Update Tests**: Add automated tests for new section functionality

## Maintenance Notes

- Review this document when design patterns evolve
- Update examples with actual implemented sections
- Maintain consistency across all existing sections
- Document any exceptions or special cases

---

**Last Updated**: July 30, 2025  
**Version**: 1.0  
**Status**: Active Standard
