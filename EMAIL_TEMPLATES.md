# MK Email Templates

This directory contains reusable email templates for the MannyKnows platform.

> 📋 **For complete deployment and meeting management documentation, see [DEPLOYMENT_AND_MEETING_MANAGEMENT.md](./DEPLOYMENT_AND_MEETING_MANAGEMENT.md)**

## Files

### `email-template-preview.html`
- **Purpose**: Standalone HTML preview of the discovery call email
- **Usage**: Open directly in browser to see how emails will look
- **Features**: Sample data pre-filled for visual testing
- **Design**: Clean, site-matching aesthetic with Apple-inspired styling

### `src/templates/DiscoveryCallEmail.astro`
- **Purpose**: Astro component version for potential future integration
- **Usage**: Import and use as a component with props
- **Features**: Type-safe props interface

## Email Design Features (Updated)

- **Site-Consistent Design**: Matches MannyKnows website aesthetic exactly
- **Clean Apple-Inspired Layout**: Subtle gradients and refined typography
- **Color Scheme**: #fafafa backgrounds, #10d1ff/#ff4faa gradients, #18181b text
- **Typography**: Apple system fonts (-apple-system, BlinkMacSystemFont)
- **Responsive Design**: Mobile-first approach with CSS Grid
- **Professional Branding**: MK gradient header with clean information display
- **Accessibility**: Proper contrast ratios and semantic structure

## Current Template Design

The email template now features:

```css
/* Key Design Elements */
.header {
  background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%);
  /* Your signature blue-to-pink gradient */
}

.card {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  /* Clean cards with subtle borders */
}

.field {
  background: #fafafa;
  border: 1px solid #f4f4f5;
  /* Light, clean field backgrounds */
}
```

## Template Variables

All templates support these dynamic variables:

- `name` - Contact's full name
- `email` - Contact's email address
- `phone` - Contact's phone (optional)
- `preferred_times` - Preferred meeting times
- `timezone` - Contact's timezone
- `proposedTime` - AI-suggested meeting time
- `meetingLink` - Jitsi meeting room URL
- `project_details` - Business challenge description
- `trackingId` - Unique request identifier

## Usage Examples

### HTML Preview
```bash
# Open in browser to preview
open email-template-preview.html
```

### Astro Component
```astro
---
import DiscoveryCallEmail from '../templates/DiscoveryCallEmail.astro';
---

<DiscoveryCallEmail 
  name="John Doe"
  email="john@example.com"
  phone="+1234567890"
  preferred_times="Tomorrow 2-5 PM"
  timezone="America/New_York"
  proposedTime="Fri Aug 16 2025 02:00 PM (America/New_York)"
  meetingLink="https://meet.jit.si/mk-abc123"
  project_details="Need help with e-commerce optimization"
  trackingId="abc123-def456"
/>
```

## Customization

To modify the email design:

1. Update styles in the `<style>` section
2. Adjust layout in the HTML structure
3. Test changes in the preview file first
4. Update the live email code in `src/pages/api/chat.ts`

## Email Client Compatibility

- Modern email clients (Gmail, Outlook, Apple Mail)
- Mobile email apps
- Includes MSO-specific styles for Outlook
- Graceful degradation for limited CSS support
