# Service Component Registry

Components available for building services dynamically via Google Sheets.

## Website Analysis Components

### `fetch_website`
- **Purpose**: Fetches website content and basic metrics
- **Inputs**: `url` (string)
- **Outputs**: `html`, `statusCode`, `headers`, `responseTime`, `url`, `success`

### `seo_analysis`
- **Purpose**: Analyzes SEO elements (title, meta tags, headings)
- **Inputs**: `fetch_website` output
- **Outputs**: SEO score, title analysis, meta descriptions, heading structure

### `performance_analysis`
- **Purpose**: Checks website performance metrics
- **Inputs**: `fetch_website` output
- **Outputs**: Performance score, load time analysis, optimization suggestions

### `security_analysis`
- **Purpose**: Scans for security issues and headers
- **Inputs**: `fetch_website` output
- **Outputs**: Security score, HTTPS check, header analysis

### `opportunity_detection`
- **Purpose**: Identifies business growth opportunities
- **Inputs**: Previous component outputs
- **Outputs**: Opportunity list, revenue potential, improvement areas

### `ai_readiness_analysis`
- **Purpose**: Assesses AI automation potential
- **Inputs**: All previous outputs
- **Outputs**: AI readiness score, automation opportunities, implementation steps

## AI Service Components

### `email_verification_ai`
- **Purpose**: Handles email verification workflows

### `session_management_ai`
- **Purpose**: Manages user session data

## Google Sheets Usage

Add a `components` column with a JSON array:

```json
["fetch_website", "seo_analysis", "performance_analysis"]
```

### Service Examples

**Quick SEO Check** (~30 seconds):
```json
["fetch_website", "seo_analysis"]
```

**Full Website Audit** (~2-3 minutes):
```json
["fetch_website", "seo_analysis", "performance_analysis", "security_analysis", "opportunity_detection"]
```

**AI Readiness Assessment** (~1-2 minutes):
```json
["fetch_website", "seo_analysis", "performance_analysis", "ai_readiness_analysis"]
```

## Adding New Components

1. Create component in `/src/lib/services/components/`
2. Export in the appropriate file
3. Add to `COMPONENT_REGISTRY` in `dynamicServiceExecutor.ts`
4. Update this documentation
