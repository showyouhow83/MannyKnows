# UI Components

## Button Component

The Button component supports multiple variants including a new CTA (Call-to-Action) variant.

### CTA Button Usage

```astro
import Button from '../ui/Button.astro';

<!-- Simple CTA button with arrow -->
<Button 
  href="#contact" 
  text="Join Our Success Stories" 
  variant="cta" 
  size="lg" 
  arrow={true}
  sparkles={false}
/>
```

### Variants

- `primary` - Standard gradient button
- `apple` - Apple-style gradient
- `green` - Green gradient
- `urgent` - Red pulsing button
- `emoji` - Gradient with emoji support
- `theme-aware` - Adapts to light/dark theme
- `cta` - Call-to-action button with special styling and arrow support

### Props

- `href` - Link destination
- `text` - Button text
- `variant` - Button style variant
- `size` - 'sm', 'md', or 'lg'
- `arrow` - Show arrow icon (for CTA variant)
- `sparkles` - Enable pixel canvas effects (disabled for CTA by default)
