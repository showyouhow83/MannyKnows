# 🧩 Modular Analysis Architecture

## 🎯 **Goal**: Scalable plugin system for adding new analysis features

## 🏗️ **Architecture Design**

### **Plugin Interface:**
```typescript
// src/lib/analysis/types.ts
export interface AnalysisPlugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  
  analyze(context: AnalysisContext): Promise<PluginResult>;
  getRequirements(): PluginRequirements;
}

export interface AnalysisContext {
  url: string;
  html: string;
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  metadata: Record<string, any>;
}

export interface PluginResult {
  score: number;           // 0-100
  weight: number;          // How much this affects overall score
  issues: string[];
  recommendations: string[];
  data: Record<string, any>;
}
```

### **Core Plugin System:**
```typescript
// src/lib/analysis/PluginManager.ts
export class PluginManager {
  private plugins: AnalysisPlugin[] = [];
  
  register(plugin: AnalysisPlugin): void {
    this.plugins.push(plugin);
  }
  
  async runAnalysis(context: AnalysisContext): Promise<CombinedAnalysisResult> {
    const results = await Promise.all(
      this.plugins
        .filter(p => p.enabled)
        .map(async plugin => ({
          plugin: plugin.name,
          result: await plugin.analyze(context)
        }))
    );
    
    return this.combineResults(results);
  }
  
  private combineResults(results: PluginResultWithName[]): CombinedAnalysisResult {
    const totalWeight = results.reduce((sum, r) => sum + r.result.weight, 0);
    const weightedScore = results.reduce((sum, r) => 
      sum + (r.result.score * r.result.weight), 0) / totalWeight;
    
    return {
      overallScore: Math.round(weightedScore),
      pluginResults: results,
      issues: results.flatMap(r => r.result.issues),
      recommendations: results.flatMap(r => r.result.recommendations),
      breakdown: results.reduce((acc, r) => {
        acc[r.plugin] = r.result.score;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
```

## 🔌 **Available Plugins**

### **1. Core Performance Plugin**
```typescript
// src/lib/analysis/plugins/PerformancePlugin.ts
export class PerformancePlugin implements AnalysisPlugin {
  name = "performance";
  version = "1.0.0";
  description = "Analyzes website loading speed and performance metrics";
  enabled = true;
  
  async analyze(context: AnalysisContext): Promise<PluginResult> {
    const { responseTime, html } = context;
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Response time analysis
    if (responseTime > 3000) {
      score -= 30;
      issues.push(`Very slow response time: ${responseTime}ms`);
      recommendations.push("Optimize server response time - consider CDN, caching, or faster hosting");
    } else if (responseTime > 1000) {
      score -= 15;
      issues.push(`Slow response time: ${responseTime}ms`);
      recommendations.push("Improve server response time for better user experience");
    }
    
    // Resource size analysis
    const htmlSize = new Blob([html]).size;
    if (htmlSize > 500000) { // 500KB
      score -= 10;
      issues.push(`Large HTML size: ${(htmlSize / 1024).toFixed(1)}KB`);
      recommendations.push("Minimize HTML size by removing unnecessary content");
    }
    
    return {
      score: Math.max(0, score),
      weight: 0.3, // 30% of overall score
      issues,
      recommendations,
      data: {
        responseTime,
        htmlSize,
        performanceGrade: score > 80 ? 'A' : score > 60 ? 'B' : score > 40 ? 'C' : 'D'
      }
    };
  }
  
  getRequirements(): PluginRequirements {
    return { htmlContent: true, responseTime: true };
  }
}
```

### **2. SEO Analysis Plugin**
```typescript
// src/lib/analysis/plugins/SEOPlugin.ts
export class SEOPlugin implements AnalysisPlugin {
  name = "seo";
  version = "1.0.0";
  description = "Analyzes SEO elements and search engine optimization";
  enabled = true;
  
  async analyze(context: AnalysisContext): Promise<PluginResult> {
    const { html, url } = context;
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    const data: Record<string, any> = {};
    
    // Title tag analysis
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (!titleMatch) {
      score -= 20;
      issues.push("Missing page title");
      recommendations.push("Add a descriptive title tag (50-60 characters)");
      data.hasTitle = false;
    } else {
      const title = titleMatch[1].trim();
      data.title = title;
      data.titleLength = title.length;
      data.hasTitle = true;
      
      if (title.length < 30) {
        score -= 10;
        issues.push("Title too short");
        recommendations.push("Expand title to 50-60 characters for better SEO");
      } else if (title.length > 60) {
        score -= 5;
        issues.push("Title too long");
        recommendations.push("Shorten title to under 60 characters");
      }
    }
    
    // Meta description analysis
    const metaDescMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
    if (!metaDescMatch) {
      score -= 15;
      issues.push("Missing meta description");
      recommendations.push("Add meta description (150-160 characters)");
      data.hasMetaDescription = false;
    } else {
      const description = metaDescMatch[1].trim();
      data.metaDescription = description;
      data.metaDescriptionLength = description.length;
      data.hasMetaDescription = true;
      
      if (description.length < 120) {
        score -= 5;
        recommendations.push("Expand meta description to 150-160 characters");
      } else if (description.length > 160) {
        score -= 5;
        recommendations.push("Shorten meta description to under 160 characters");
      }
    }
    
    // Heading structure analysis
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      score -= 15;
      issues.push("Missing H1 heading");
      recommendations.push("Add one H1 heading to clearly define page topic");
    } else if (h1Count > 1) {
      score -= 10;
      issues.push(`Multiple H1 headings (${h1Count})`);
      recommendations.push("Use only one H1 heading per page");
    }
    data.h1Count = h1Count;
    
    // Internal/external links analysis
    const internalLinks = (html.match(new RegExp(`href=["\'][^"\']*${new URL(url).hostname}[^"\']*["\']`, 'gi')) || []).length;
    const externalLinks = (html.match(/href=["\']https?:\/\/[^"\']*["\']/gi) || []).length - internalLinks;
    
    data.internalLinks = internalLinks;
    data.externalLinks = externalLinks;
    
    if (internalLinks === 0) {
      score -= 5;
      recommendations.push("Add internal links to improve site navigation and SEO");
    }
    
    return {
      score: Math.max(0, score),
      weight: 0.25, // 25% of overall score
      issues,
      recommendations,
      data
    };
  }
  
  getRequirements(): PluginRequirements {
    return { htmlContent: true };
  }
}
```

### **3. Screenshot Plugin (Future)**
```typescript
// src/lib/analysis/plugins/ScreenshotPlugin.ts
export class ScreenshotPlugin implements AnalysisPlugin {
  name = "screenshot";
  version = "1.0.0";
  description = "Captures website screenshots for visual analysis";
  enabled = false; // Requires Puppeteer integration
  
  async analyze(context: AnalysisContext): Promise<PluginResult> {
    // TODO: Implement screenshot capture
    // - Desktop screenshot (1920x1080)
    // - Mobile screenshot (375x667)
    // - Store in R2 bucket
    // - Visual regression detection
    
    return {
      score: 100,
      weight: 0.1,
      issues: [],
      recommendations: [],
      data: {
        desktopScreenshot: `screenshots/${context.metadata.analysisId}-desktop.png`,
        mobileScreenshot: `screenshots/${context.metadata.analysisId}-mobile.png`
      }
    };
  }
  
  getRequirements(): PluginRequirements {
    return { 
      htmlContent: true, 
      browser: true, // Requires Puppeteer/Playwright
      storage: true 
    };
  }
}
```

## 🔧 **Plugin Registration**

```typescript
// src/lib/analysis/setup.ts
import { PluginManager } from './PluginManager';
import { PerformancePlugin } from './plugins/PerformancePlugin';
import { SEOPlugin } from './plugins/SEOPlugin';
import { AccessibilityPlugin } from './plugins/AccessibilityPlugin';
import { SecurityPlugin } from './plugins/SecurityPlugin';

export function createAnalysisEngine(): PluginManager {
  const manager = new PluginManager();
  
  // Register core plugins
  manager.register(new PerformancePlugin());
  manager.register(new SEOPlugin());
  manager.register(new AccessibilityPlugin());
  manager.register(new SecurityPlugin());
  
  // Register premium plugins (when enabled)
  // manager.register(new ScreenshotPlugin());
  // manager.register(new LighthousePlugin());
  
  return manager;
}
```

## 🚀 **Usage in Analysis API**

```typescript
// src/pages/api/analyze-website.ts (updated)
import { createAnalysisEngine } from '../lib/analysis/setup';

export const POST: APIRoute = async ({ request, locals }) => {
  // ... existing setup ...
  
  const analysisEngine = createAnalysisEngine();
  
  const context = {
    url: targetUrl.toString(),
    html: htmlContent,
    statusCode,
    responseTime,
    headers: Object.fromEntries(response.headers.entries()),
    metadata: { analysisId }
  };
  
  const analysis = await analysisEngine.runAnalysis(context);
  
  // ... rest of the API ...
};
```

## 📊 **Plugin Results Format**

```json
{
  "overallScore": 87,
  "pluginResults": [
    {
      "plugin": "performance",
      "result": {
        "score": 95,
        "weight": 0.3,
        "issues": [],
        "recommendations": ["Consider implementing HTTP/2"],
        "data": {
          "responseTime": 234,
          "performanceGrade": "A"
        }
      }
    },
    {
      "plugin": "seo",
      "result": {
        "score": 85,
        "weight": 0.25,
        "issues": ["Title too short"],
        "recommendations": ["Expand title to 50-60 characters"],
        "data": {
          "title": "Home",
          "titleLength": 4,
          "hasMetaDescription": true
        }
      }
    }
  ],
  "breakdown": {
    "performance": 95,
    "seo": 85,
    "accessibility": 90,
    "security": 80
  }
}
```

---

**Benefits**: Scalable, maintainable, extensible analysis system  
**Timeline**: 2-3 days for core system + initial plugins  
**Future**: Easy to add screenshot, Lighthouse, custom analysis plugins**
