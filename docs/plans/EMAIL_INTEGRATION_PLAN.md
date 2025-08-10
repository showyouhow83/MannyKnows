# 📧 Email Integration Implementation Plan

## 🎯 **Goal**: Enable users to receive analysis reports via email

## 🛠️ **Implementation Steps**

### **Step 1: Email Service Setup**
```bash
# Add Resend to dependencies
npm install resend

# Add environment variables to wrangler secrets
wrangler secret put RESEND_API_KEY
wrangler secret put EMAIL_FROM_ADDRESS
```

### **Step 2: Update Analysis API**
```typescript
// src/pages/api/analyze-website.ts - Enhanced with email
export const POST: APIRoute = async ({ request, locals }) => {
  const { url, email, reportDelivery } = await request.json();
  
  // ... existing analysis logic ...
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(analysis, targetUrl.toString());
  await r2.put(`reports/${analysisId}.html`, htmlReport, {
    httpMetadata: { contentType: 'text/html' }
  });
  
  // Send email if requested
  if (email && reportDelivery === 'email') {
    await sendAnalysisEmail(email, analysis, analysisId);
  }
  
  // Store user analysis history
  if (email) {
    await storeUserAnalysis(email, analysisId, analysis);
  }
};
```

### **Step 3: HTML Report Generator**
```typescript
// src/lib/email/reportGenerator.ts
export function generateHTMLReport(analysis: any, url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Website Analysis Report - ${url}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
    .score { font-size: 48px; font-weight: bold; color: ${getScoreColor(analysis.overallScore)}; }
    .section { margin: 20px 0; padding: 20px; border-left: 4px solid #0066cc; }
    .issue { color: #d73502; }
    .recommendation { color: #0066cc; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Website Analysis Report</h1>
  <h2>${url}</h2>
  
  <div class="score">${analysis.overallScore}/100</div>
  <p>Overall Quality Score</p>
  
  <div class="metrics">
    <div class="metric">
      <h3>Performance</h3>
      <div class="score">${analysis.performanceScore}</div>
      <p>${analysis.responseTime}ms load time</p>
    </div>
    <div class="metric">
      <h3>SEO</h3>
      <div class="score">${analysis.seoScore}</div>
      <p>Search optimization</p>
    </div>
    <div class="metric">
      <h3>Accessibility</h3>
      <div class="score">${analysis.accessibilityScore}</div>
      <p>${analysis.imagesWithAlt}/${analysis.totalImages} images with alt text</p>
    </div>
  </div>
  
  <div class="section">
    <h3>Issues Found</h3>
    ${analysis.issues.map(issue => `<div class="issue">❌ ${issue}</div>`).join('')}
  </div>
  
  <div class="section">
    <h3>Recommendations</h3>
    ${analysis.recommendations.map(rec => `<div class="recommendation">💡 ${rec}</div>`).join('')}
  </div>
  
  <p><small>Analysis performed by <a href="https://mannyknows.com">MannyKnows</a></small></p>
</body>
</html>`;
}
```

### **Step 4: Email Sender**
```typescript
// src/lib/email/sender.ts
import { Resend } from 'resend';

export async function sendAnalysisEmail(
  userEmail: string, 
  analysis: any, 
  analysisId: string,
  env: any
) {
  const resend = new Resend(env.RESEND_API_KEY);
  
  const reportUrl = `https://mannyknows.showyouhow83.workers.dev/api/files/reports/${analysisId}.html`;
  
  await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: userEmail,
    subject: `Website Analysis Complete - Score: ${analysis.overallScore}/100`,
    html: `
      <h2>Your website analysis is ready!</h2>
      <p><strong>Overall Score:</strong> ${analysis.overallScore}/100</p>
      <p><strong>Issues Found:</strong> ${analysis.issues.length}</p>
      <p><strong>Recommendations:</strong> ${analysis.recommendations.length}</p>
      
      <p><a href="${reportUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Report</a></p>
      
      <p><small>This report will be available for 90 days.</small></p>
    `
  });
}
```

### **Step 5: User History Tracking**
```typescript
// src/lib/user/history.ts
export async function storeUserAnalysis(
  email: string, 
  analysisId: string, 
  analysis: any,
  kv: any
) {
  const userKey = `user:${email}:history`;
  const existingHistory = await kv.get(userKey, { type: 'json' }) || [];
  
  const newEntry = {
    id: analysisId,
    url: analysis.url,
    timestamp: new Date().toISOString(),
    score: analysis.overallScore,
    issues: analysis.issues.length
  };
  
  const updatedHistory = [newEntry, ...existingHistory].slice(0, 50); // Keep last 50
  await kv.put(userKey, JSON.stringify(updatedHistory), { expirationTtl: 7776000 }); // 90 days
}
```

## 📊 **Usage Examples**

### **Direct API with Email:**
```bash
curl -X POST https://mannyknows.showyouhow83.workers.dev/api/analyze-website \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "email": "user@example.com",
    "reportDelivery": "email"
  }'
```

### **Email-Only Report Request:**
```bash
curl -X POST https://mannyknows.showyouhow83.workers.dev/api/analysis/uuid/email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## 🎯 **Benefits**

✅ **User Engagement**: Users get beautiful reports in their inbox  
✅ **Report Sharing**: Easy to forward and discuss with teams  
✅ **History Tracking**: Users can track multiple analyses  
✅ **Professional Appearance**: Branded HTML reports vs raw JSON  
✅ **Lead Generation**: Email collection for future services  

## 🚀 **Next Features**

- **PDF Generation**: Convert HTML reports to PDF
- **Scheduled Re-analysis**: "Check this site again in 30 days"
- **Comparison Reports**: "Your site improved by 15 points!"
- **Team Sharing**: Send reports to multiple emails
- **White-label Reports**: Custom branding for agency customers

---

**Timeline**: 1-2 days for basic email integration  
**Effort**: Medium (email service + HTML generation)  
**Impact**: High (professional user experience + lead capture)**
