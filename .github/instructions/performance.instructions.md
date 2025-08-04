# 🔧 Performance Patterns & Best Practices

## Established Performance Patterns

### Hardware-Accelerated Animations
```css
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
  transition: transform 0.3s ease;
}

.animated-element:hover {
  transform: translateY(-8px) translateZ(0);
}
```

### Optimized JavaScript Event Handling
```javascript
// ✅ Good: Cached selectors and pre-calculated values
const elements = document.querySelectorAll('.target');
const hoverShadow = `0 0 80px ${color}40, 0 0 40px ${color}30`;

element.addEventListener('mouseenter', () => {
  requestAnimationFrame(() => {
    element.style.boxShadow = hoverShadow;
  });
});

// ❌ Bad: Repeated queries and calculations
element.addEventListener('mouseenter', () => {
  document.querySelector('.target').style.boxShadow = `0 0 80px ${getColor()}40`;
});
```

### Cross-Component Interaction Preservation
When optimizing components with intelligent interactions:
- Always preserve number-to-card relationship logic
- Maintain touch/mouse/keyboard support
- Keep cross-mode functionality intact
- Document interaction patterns clearly

### Bundle Size Optimization
- Remove dead CSS code immediately after refactoring
- Use compressed color arrays: `["#10d1ff", "#0071e3", "#3b5bd6"]`
- Consolidate similar hover effects into reusable patterns
- Clean up verbose comments in production CSS

## ProcessSectionAlt Reference Implementation

The `ProcessSectionAlt.astro` component exemplifies all these performance patterns:

### Hardware Acceleration Implementation
```css
.step-number-large {
  will-change: transform, opacity;
  transition: all 0.3s ease;
}

.process-card {
  will-change: transform, box-shadow, border-color;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.process-card:hover {
  transform: translateY(-8px) translateZ(0);
}
```

### Cross-Mode Interaction System
```javascript
// Intelligent number-to-card interaction system
numbers.forEach(number => {
  const stepIndex = number.getAttribute('data-target-step');
  const correspondingCard = document.querySelector(`[data-step-index="${stepIndex}"]`);
  
  if (stepIndex && correspondingCard instanceof HTMLElement) {
    // Pre-calculated hover values
    const hoverTransform = 'translateY(-8px) translateZ(0)';
    const hoverShadow = `0 0 80px ${color}40, 0 0 40px ${color}30`;
    
    // Touch and mouse support with requestAnimationFrame
    number.addEventListener('touchstart', () => {
      requestAnimationFrame(() => {
        correspondingCard.style.transform = hoverTransform;
      });
    }, { passive: true });
  }
});
```

### Accessibility Integration
```html
<div role="button" 
     tabindex="0"
     aria-label="Step 1: AI Strategy & Discovery">
  <span class="number-part">1</span>
</div>

<div role="article" 
     aria-labelledby="step-title-1">
  <h3 id="step-title-1">AI Strategy & Discovery</h3>
</div>
```

## Development Workflow for Performance

1. **Before Optimization**: Test all functionality works perfectly
2. **During Optimization**: 
   - Add hardware acceleration hints first
   - Cache DOM elements and values
   - Use `requestAnimationFrame` for animations
   - Preserve all interaction logic
3. **After Optimization**: 
   - Verify visual design is identical
   - Test cross-component interactions
   - Validate responsive behavior
   - Check accessibility improvements

## Performance Measurement

Expected improvements from following these patterns:
- **~20% faster animations** (hardware acceleration)
- **~15% smaller CSS bundle** (dead code removal)
- **~30% smoother interactions** (requestAnimationFrame + caching)
- **Better mobile performance** (passive event listeners)
- **Improved accessibility score** (semantic markup)
