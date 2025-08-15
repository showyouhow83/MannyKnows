# Service Component Registry

This document lists all available components that can be used in Google Sheets to build services dynamically.

## Website Analysis Components

### `fetch_website`
- **Purpose**: Fetches website content and basic metrics
- **Inputs**: `url` (string)
- **Outputs**: `html`, `statusCode`, `headers`, `responseTime`, `url`, `success`
- **Used for**: Getting raw website data for analysis

### `seo_analysis` 
- **Purpose**: Analyzes SEO elements like title, meta tags, headings
- **Inputs**: `fetch_website` output
- **Outputs**: SEO score, title analysis, meta descriptions, heading structure
- **Used for**: SEO auditing and recommendations

### `performance_analysis`
- **Purpose**: Checks website performance metrics
- **Inputs**: `fetch_website` output  
- **Outputs**: Performance score, load time analysis, optimization suggestions
- **Used for**: Speed and performance optimization

### `security_analysis`
- **Purpose**: Scans for security issues and headers
- **Inputs**: `fetch_website` output
- **Outputs**: Security score, HTTPS check, header analysis
- **Used for**: Security auditing

### `opportunity_detection`
- **Purpose**: Identifies business growth opportunities
- **Inputs**: Previous component outputs
- **Outputs**: Opportunity list, revenue potential, improvement areas
- **Used for**: Business consultation and recommendations

### `ai_readiness_analysis`
- **Purpose**: Assesses AI automation potential
- **Inputs**: All previous outputs
- **Outputs**: AI readiness score, automation opportunities, implementation steps
- **Used for**: AI transformation consulting

## AI Service Components

### `email_verification_ai`
- **Purpose**: Handles email verification workflows
- **Used for**: User verification processes

### `session_management_ai`
- **Purpose**: Manages user session data
- **Used for**: Session tracking and user state

### `phone_verification_ai`
- **Purpose**: Phone verification (not implemented yet)
- **Used for**: Future phone verification

## How to Use in Google Sheets

Add a `components` column to your services with a JSON array:

```json
["fetch_website", "seo_analysis", "performance_analysis"]
```

**Simple service (1-2 components):**
```json
["fetch_website", "seo_analysis"]
```

**Complex service (all website components):**
```json
["fetch_website", "seo_analysis", "performance_analysis", "security_analysis", "opportunity_detection", "ai_readiness_analysis"]
```

## Service Examples

### Quick SEO Check
- **Components**: `["fetch_website", "seo_analysis"]`
- **Description**: Fast SEO analysis for basic recommendations
- **Processing Time**: ~30 seconds

### Full Website Audit  
- **Components**: `["fetch_website", "seo_analysis", "performance_analysis", "security_analysis", "opportunity_detection"]`
- **Description**: Comprehensive website analysis
- **Processing Time**: ~2-3 minutes

### AI Readiness Assessment
- **Components**: `["fetch_website", "seo_analysis", "performance_analysis", "ai_readiness_analysis"]`
- **Description**: Focus on AI automation potential
- **Processing Time**: ~1-2 minutes

## Adding New Components

To add new components:

1. Create component in `/src/lib/services/components/`
2. Export it in the appropriate file
3. Add to `COMPONENT_REGISTRY` in `dynamicServiceExecutor.ts`
4. Update this documentation
5. Use in Google Sheets services
