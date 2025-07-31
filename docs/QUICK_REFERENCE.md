# Quick Reference: Section Template

## Copy-Paste Template

```astro
<section id="NEW_SECTION_ID" class="relative py-16 bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90 border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300 overflow-hidden">
	<!-- Parallax Background Elements -->
	<div class="absolute inset-0 z-0">
		<div class="absolute top-20 left-10 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
		<div class="absolute bottom-20 right-10 w-96 h-96 bg-primary-pink/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-pink-500/5 rounded-full blur-3xl animate-spin-slow"></div>
	</div>

	<div class="max-w-[1440px] mx-auto px-8 relative z-10">
		<!-- Section Header -->
		<div class="text-center mb-16">
			<h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6">
				<span class="apple-gradient-text" data-colorful-title>SECTION_TITLE</span>
			</h2>
			<p class="sf-medium apple-body-text text-xl text-text-light-secondary dark:text-text-dark-secondary">
				SECTION_DESCRIPTION
			</p>
		</div>
		
		<!-- YOUR CONTENT HERE -->
		
	</div>
</section>
```

## Replacement Checklist

1. Replace `NEW_SECTION_ID` with your section ID (e.g., `about`, `pricing`, `contact`)
2. Replace `SECTION_TITLE` with your section title
3. Replace `SECTION_DESCRIPTION` with your section description
4. Add your section content where indicated
5. Update navigation to include new section link
6. **Note**: Parallax elements are included by default for visual consistency

## Common Patterns

### Grid Layout
```astro
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
	<!-- Grid items -->
</div>
```

### Card Component
```astro
<div class="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/30 dark:border-white/10 rounded-2xl p-8">
	<!-- Card content -->
</div>
```

### Button Standard
```astro
<button class="bg-gradient-to-r from-primary-blue to-sky-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
	Button Text
</button>
```

## Text Color Classes
- Primary: `text-text-light-primary dark:text-text-dark-primary`
- Secondary: `text-text-light-secondary dark:text-text-dark-secondary`
- Tertiary: `text-text-light-tertiary dark:text-text-dark-tertiary`
