# MannyKnows Modular Service Framework - AI Development Guide

## Quick Architecture Reference

### Core Framework Structure
```
src/lib/services/
├── serviceFramework.ts      # Core Service & ServiceRegistry classes
├── types.ts                 # All TypeScript interfaces
├── websiteAnalysisService.ts # Main service orchestrator
├── salesResponseGenerator.ts # Intelligent response engine
└── components/
    └── websiteComponents.ts # Analysis components
```

### API Integration Points
```
src/pages/api/
├── analyze-website.ts       # Website analysis endpoint
├── chat.ts                 # Chat with intelligent responses
└── manage-services.ts      # Runtime service management
```

## Service Creation Template

### Step 1: Create Service File
```typescript
// src/lib/services/[serviceName]Service.ts
import { Service, ServiceRegistry } from './serviceFramework';
import type { ServiceComponent, ComponentResult } from './types';

const [serviceName]Service = new Service('[Service Display Name]');
const serviceRegistry = new ServiceRegistry();

// Import and register components
import { component1, component2 } from './components/[serviceName]Components';
serviceRegistry.addComponent(component1);
serviceRegistry.addComponent(component2);

export async function execute[ServiceName](param1: string, param2: string): Promise<any> {
  try {
    const context = { param1, param2, timestamp: new Date().toISOString() };
    const result = await [serviceName]Service.execute(serviceRegistry, context);
    
    if (!result.success) {
      return {
        success: false,
        errors: result.errors || ['Service execution failed']
      };
    }

    return {
      success: true,
      data: result.data,
      salesResponse: generateSalesResponse(result.data) // If needed
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
```

### Step 2: Create Components File
```typescript
// src/lib/services/components/[serviceName]Components.ts
import type { ServiceComponent, ComponentResult } from '../types';

export const component1: ServiceComponent = {
  name: 'Component 1 Name',
  priority: 1,
  enabled: true,
  async execute(param1: string, param2: string, context: any): Promise<ComponentResult> {
    const startTime = Date.now();
    try {
      // Component logic here
      const result = await performAnalysis(param1, param2);
      
      return {
        success: true,
        data: result,
        metadata: {
          componentName: 'Component 1 Name',
          executionTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Component failed',
        metadata: { componentName: 'Component 1 Name' }
      };
    }
  }
};
```

### Step 3: Create API Endpoint
```typescript
// src/pages/api/[service-endpoint].ts
import type { APIRoute } from 'astro';
import { execute[ServiceName] } from '../../lib/services/[serviceName]Service';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { param1, param2 } = await request.json();
    
    // Validation
    if (!param1) {
      return new Response(JSON.stringify({ error: 'param1 is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute service
    const result = await execute[ServiceName](param1, param2);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: 'Service execution failed',
        details: result.errors
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ServiceName] error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

## Current Service Examples to Reference

### Website Analysis Service
- **File**: `src/lib/services/websiteAnalysisService.ts`
- **Components**: 5 components (fetch, SEO, performance, security, opportunities)
- **API**: `src/pages/api/analyze-website.ts`
- **Integration**: Used by `src/pages/api/chat.ts`

### Management API Pattern
- **File**: `src/pages/api/manage-services.ts`
- **Purpose**: Runtime component management
- **Actions**: enable, disable, remove, reorder, status

## TypeScript Interfaces (Reference src/lib/services/types.ts)

```typescript
interface ServiceComponent {
  name: string;
  priority: number;
  enabled: boolean;
  execute(param1: any, param2: any, context: any): Promise<ComponentResult>;
}

interface ComponentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: any;
}
```

## Coding Style Guidelines

1. **Error Handling**: Always wrap in try-catch, return structured error objects
2. **TypeScript**: Use strict typing, import types with `import type`
3. **Async/Await**: Prefer over promises, handle timeouts with AbortController
4. **Logging**: Use console.error for errors, console.log for debugging
5. **Response Format**: Consistent JSON responses with success/error structure
6. **Validation**: Validate inputs early, return 400 for bad requests
7. **Context**: Pass execution context through components for debugging

## AI Development Instructions

When creating a new service:
1. Ask for service name and parameters
2. Create service file using template above
3. Create components file with analysis logic
4. Create API endpoint following pattern
5. Test with curl commands
6. Add to chat.ts integration if needed
7. Update this documentation

Always reference existing files for patterns and maintain consistency.
