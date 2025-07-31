---
mode: agent
---

# MannyKnows Site Standards

## Communication Style
Speak in a spartan tone. Use short, direct sentences. Focus on clarity. Avoid unnecessary words or complex structures.

## Development Approach
- Do not start coding until you have a clear plan
- Write efficient, easy-to-understand code
- Test thoroughly
- Keep it simple
- Use comments sparingly, only when necessary for clarity
- Aim for robustness and maintainability
- Always consider performance
- Be disciplined in approach

## Code Standards

### General
- Use semantic HTML elements
- Maintain clean, organized codebase
- Follow existing project structure
- Prefer TypeScript over JavaScript
- Use Astro components for reusable UI elements

### CSS/Styling
- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Ensure contrast ratios meet WCAG standards
- Use CSS Grid and Flexbox appropriately
- Avoid inline styles

### JavaScript/TypeScript
- Use modern ES6+ syntax
- Prefer const/let over var
- Use async/await over promises when possible
- Handle errors gracefully
- Validate all user inputs

## Accessibility (ADA Compliance)
- Use semantic HTML elements (header, nav, main, section, footer)
- Ensure all interactive elements are keyboard accessible
- Provide alt text for all images
- Use ARIA roles where semantic HTML is insufficient
- Maintain proper heading hierarchy (h1 → h2 → h3)
- Ensure minimum 4.5:1 contrast ratio for text
- Test with screen readers
- Include focus indicators for all interactive elements
- Use descriptive link text (avoid "click here")

## Form Validation
- Client-side validation for UX
- Server-side validation for security
- Clear error messages
- Accessible error announcements
- Progressive enhancement

## Performance Standards
- Optimize images (WebP format preferred)
- Minimize JavaScript bundle size
- Use lazy loading for images
- Implement proper caching strategies
- Monitor Core Web Vitals

## File Organization
```
src/
├── components/          # Reusable Astro components
├── layouts/            # Page layouts
├── pages/              # Route pages
└── styles/             # Global styles (if any)
```

## Component Standards
- Use .astro extension for components
- Props should be typed with TypeScript
- Include proper component documentation
- Follow single responsibility principle
- Make components reusable when possible

## Error Handling
- Graceful degradation for failed API calls
- User-friendly error messages
- Loading states for async operations
- Fallback content for failed media loads

## Testing Requirements
- Test on multiple browsers
- Test keyboard navigation
- Test screen reader compatibility
- Test on mobile devices
- Validate HTML markup
- Check accessibility with automated tools

## Build & Deployment
- Use `npm run build` for production builds
- Ensure no TypeScript errors
- Verify all assets load correctly
- Test in production environment before release

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

## Security
- Sanitize all user inputs
- Use HTTPS for all external requests
- Validate file uploads
- Implement CSP headers where applicable

## Analytics & Tracking
- Use PostHog for analytics
- Respect user privacy preferences
- Implement proper consent management
- Track meaningful user interactions only
