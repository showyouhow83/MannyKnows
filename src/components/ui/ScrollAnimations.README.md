# Scroll Animations System

A lightweight, performant scroll animation system built with Intersection Observer API and CSS transitions. Designed to integrate seamlessly with the existing animation architecture.

## Features

- ✅ **Native Performance** - Uses Intersection Observer API (no external dependencies)
- ✅ **TypeScript Support** - Full type safety and IntelliSense
- ✅ **Accessibility Compliant** - Respects `prefers-reduced-motion`
- ✅ **Configurable** - Easy to customize timing, delays, and thresholds
- ✅ **Debug Mode** - Built-in logging for development
- ✅ **Astro Integration** - Works perfectly with SSG and component architecture

## Quick Start

### Basic Usage

Wrap any component with `ScrollAnimations` to add scroll-triggered animations:

```astro
---
import ScrollAnimations from '../components/ui/ScrollAnimations.astro';
import YourComponent from '../components/YourComponent.astro';
---

<ScrollAnimations animation="fadeIn" delay={200}>
  <YourComponent />
</ScrollAnimations>
```

### Available Animations

- `fadeIn` - Fades in from transparent
- `slideInLeft` - Slides in from the left
- `slideInRight` - Slides in from the right  
- `slideInUp` - Slides in from below
- `slideInDown` - Slides in from above
- `scaleIn` - Scales up from smaller size
- `none` - No animation (useful for conditional animations)

## Configuration

### Component Props

```astro
<ScrollAnimations
  animation="slideInUp"     // Animation type
  delay={300}              // Delay before animation starts (ms)
  duration={600}           // Animation duration (ms)
  threshold={0.1}          // Intersection threshold (0-1)
  once={true}              // Animate only once or every time
  className="custom-class" // Additional CSS classes
  debug={false}            // Enable debug logging
>
  <YourContent />
</ScrollAnimations>
```

### Global Configuration

In your main page, configure scroll animations via `ANIMATION_CONFIG`:

```astro
const ANIMATION_CONFIG = {
  scrollAnimationsEnabled: true,        // Enable/disable globally
  scrollAnimationThreshold: 0.1,       // Default threshold
  scrollAnimationDebug: false,         // Debug mode
};
```

## Advanced Usage

### Manual Animation Control

For advanced use cases, you can use the utility functions directly:

```typescript
import { animateElement, getScrollProgress } from '../utils/scrollAnimations.ts';

// Manually animate an element
const element = document.querySelector('.my-element');
animateElement(element, 'fadeIn', 600, 200);

// Get scroll progress of an element (0-1)
const progress = getScrollProgress(element);
```

### Custom Animations

Add custom animations by extending the CSS in `ScrollAnimations.astro`:

```css
.scroll-animation-wrapper.customSlide {
  opacity: 0;
  transform: translateX(-100px) rotate(-10deg);
}

.scroll-animation-wrapper.customSlide.animate {
  opacity: 1;
  transform: translateX(0) rotate(0deg);
}
```

## Performance Notes

- Uses `IntersectionObserver` for optimal performance
- CSS transforms are hardware-accelerated
- Automatically handles cleanup and memory management
- Respects user's motion preferences
- Minimal JavaScript footprint

## Accessibility

The system automatically:
- Respects `prefers-reduced-motion: reduce`
- Uses semantic markup
- Maintains focus management
- Provides fallbacks for older browsers

## Examples

### Staggered List Animation

```astro
{items.map((item, index) => (
  <ScrollAnimations 
    animation="slideInLeft" 
    delay={index * 100}
  >
    <ListItem data={item} />
  </ScrollAnimations>
))}
```

### Conditional Animations

```astro
<ScrollAnimations 
  animation={isMobile ? 'fadeIn' : 'slideInUp'}
  duration={600}
>
  <ResponsiveComponent />
</ScrollAnimations>
```

### Complex Timing

```astro
<!-- Main content animates first -->
<ScrollAnimations animation="fadeIn" delay={0}>
  <MainContent />
</ScrollAnimations>

<!-- Sidebar animates 200ms later -->
<ScrollAnimations animation="slideInRight" delay={200}>
  <Sidebar />
</ScrollAnimations>

<!-- Footer animates last -->
<ScrollAnimations animation="slideInUp" delay={400}>
  <Footer />
</ScrollAnimations>
```

## Debugging

Enable debug mode to see animation triggers in the console:

```astro
const ANIMATION_CONFIG = {
  scrollAnimationDebug: true,
  debugMode: true, // Also enables general debug logging
};
```

Or per-component:

```astro
<ScrollAnimations animation="fadeIn" debug={true}>
  <YourComponent />
</ScrollAnimations>
```

## Browser Support

- Modern browsers with IntersectionObserver support
- Graceful fallback for older browsers (elements appear immediately)
- IE11+ with polyfill (optional)

## Migration from Other Libraries

### From AOS (Animate On Scroll)

```astro
<!-- Before: AOS -->
<div data-aos="fade-up" data-aos-delay="200">

<!-- After: ScrollAnimations -->
<ScrollAnimations animation="slideInUp" delay={200}>
```

### From GSAP ScrollTrigger

```astro
<!-- Before: GSAP -->
<div class="gsap-trigger" data-animation="slideIn">

<!-- After: ScrollAnimations -->
<ScrollAnimations animation="slideInLeft">
```

## Contributing

When adding new animations:
1. Add CSS classes to `ScrollAnimations.astro`
2. Update the `animation` prop type
3. Add examples to this documentation
4. Test with reduced motion preferences
