# AI Service Management Interface

## Runtime Service Management for AI

The AI can use the management API to intelligently manage services during conversations:

### Available Management Actions

```bash
# Get current service status
GET http://localhost:4321/api/manage-services

# Enable/disable components based on conversation needs
POST http://localhost:4321/api/manage-services
{
  "action": "enable|disable|remove|reorder|status",
  "componentName": "Component Name",
  "newPriority": 1 // for reorder action
}
```

### AI Integration Examples

1. **Context-Aware Component Management**
   - If user asks about SEO: Enable SEO Analysis component
   - If user mentions security: Prioritize Security Analysis component
   - If user wants speed focus: Boost Performance Analysis priority

2. **Conversation-Driven Service Adaptation**
   - Disable unnecessary components for faster responses
   - Enable specialized components based on user's business type
   - Adjust component priorities based on user's pain points

3. **Dynamic Service Configuration**
   - Real-time component status checking before analysis
   - Automatic fallback if components fail
   - Performance optimization based on user requirements

### Current Active Components

From website analysis service:
- `fetchWebsiteComponent` (Priority 1) - Always needed
- `seoAnalysisComponent` (Priority 2) - SEO insights
- `performanceAnalysisComponent` (Priority 3) - Speed analysis
- `securityAnalysisComponent` (Priority 4) - Security check
- `opportunityDetectionComponent` (Priority 5) - Business opportunities

### AI Management Patterns

```javascript
// Check service status before analysis
const serviceStatus = await fetch('/api/manage-services');
const { components } = await serviceStatus.json();

// Adapt based on user needs
if (userMentionsSEO) {
  await fetch('/api/manage-services', {
    method: 'POST',
    body: JSON.stringify({
      action: 'reorder',
      componentName: 'SEO Analysis',
      newPriority: 1
    })
  });
}

// Execute analysis with optimized configuration
const analysis = await fetch('/api/analyze-website', {
  method: 'POST',
  body: JSON.stringify({ url, email })
});
```

This enables the AI to be more intelligent about which tools to use based on the conversation context.
