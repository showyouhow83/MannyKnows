// Admin Analytics API - Fetches Cloudflare Analytics via GraphQL
// Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID secrets

import type { APIContext } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

interface CloudflareAnalyticsResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1dGroups?: Array<{
          sum?: {
            requests: number;
            pageViews: number;
            bytes: number;
          };
          uniq?: {
            uniques: number;
          };
          dimensions?: {
            date: string;
          };
        }>;
        httpRequestsAdaptiveGroups?: Array<{
          count: number;
          dimensions?: {
            clientRequestPath?: string;
          };
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export async function GET({ request, locals }: APIContext) {
  const env = locals.runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);

  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiToken = env?.CLOUDFLARE_API_TOKEN;
  const zoneId = env?.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    return new Response(JSON.stringify({
      error: 'Analytics not configured',
      message: 'Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID secrets to enable analytics',
      configured: false,
      // Presence flags only (never values) — lets the dashboard card say
      // exactly which secret the running worker can't see.
      hasToken: Boolean(apiToken),
      hasZoneId: Boolean(zoneId)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  try {
    // Get date range (last 7 days for daily stats)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // For adaptive groups (top pages), must use single day (API limit: 86400s)
    const today = new Date().toISOString().split('T')[0];

    const query = `
      query GetZoneAnalytics($zoneTag: String!, $since: String!, $until: String!, $today: Date!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 7
              filter: { date_geq: $since, date_leq: $until }
              orderBy: [date_DESC]
            ) {
              sum {
                requests
                pageViews
                bytes
              }
              uniq {
                uniques
              }
              dimensions {
                date
              }
            }
            httpRequestsAdaptiveGroups(
              limit: 100
              filter: {
                date: $today
              }
            ) {
              count
              dimensions {
                clientRequestPath
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: zoneId,
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
          today: today
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const result = await response.json() as CloudflareAnalyticsResponse;

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    const zoneData = result.data?.viewer?.zones?.[0];

    if (!zoneData) {
      // Zone exists but returned no analytics rows (new zone / no traffic
      // yet) — render zeros rather than an error state.
      return new Response(JSON.stringify({
        configured: true,
        warning: 'No zone data found',
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totals: { requests: 0, pageViews: 0, uniqueVisitors: 0, bandwidth: 0 },
        daily: [],
        topPages: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process daily data
    const dailyData = (zoneData.httpRequests1dGroups || []).map(day => ({
      date: day.dimensions?.date || '',
      requests: day.sum?.requests || 0,
      pageViews: day.sum?.pageViews || 0,
      uniqueVisitors: day.uniq?.uniques || 0,
      bandwidth: day.sum?.bytes || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totals = dailyData.reduce((acc, day) => ({
      requests: acc.requests + day.requests,
      pageViews: acc.pageViews + day.pageViews,
      uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
      bandwidth: acc.bandwidth + day.bandwidth
    }), { requests: 0, pageViews: 0, uniqueVisitors: 0, bandwidth: 0 });

    // Top pages (filter out API, CDN, static files, then aggregate and sort by count)
    const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|xml|txt|pdf|webp|mp4|webm|avif)$/i;

    // Aggregate page views by path (same path may appear multiple times in adaptive groups)
    const pageAggregates = new Map<string, number>();

    for (const page of (zoneData.httpRequestsAdaptiveGroups || [])) {
      const path = page.dimensions?.clientRequestPath;
      if (!path) continue;
      // Exclude API endpoints, CDN paths, admin pages, static files, and bot probes
      if (path.startsWith('/api')) continue;
      if (path.startsWith('/cdn-cgi')) continue;
      if (path.startsWith('/admin')) continue;
      if (path.startsWith('/_')) continue; // Astro internal routes
      if (staticExtensions.test(path)) continue;
      // Filter common vulnerability scanner / bot probe paths
      if (path.startsWith('/config')) continue;
      if (path.startsWith('/integrations')) continue;
      if (path.startsWith('/content')) continue;
      if (path.startsWith('/wp-')) continue; // WordPress probes
      if (path.startsWith('/wordpress')) continue;
      if (path.startsWith('/.env')) continue;
      if (path.startsWith('/phpmy')) continue;
      if (path.startsWith('/vendor')) continue;
      if (path.startsWith('/actuator')) continue; // Spring Boot probes
      if (path.includes('.php')) continue;
      if (path.includes('.asp')) continue;
      if (path.includes('.properties')) continue;

      const current = pageAggregates.get(path) || 0;
      pageAggregates.set(path, current + (page.count || 0));
    }

    const topPages = Array.from(pageAggregates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }));

    return new Response(JSON.stringify({
      configured: true,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      totals,
      daily: dailyData,
      topPages
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Graceful degradation: an API hiccup (bad token, wrong zone id, rate
    // limit, network) must not paint the dashboard red — return an empty,
    // well-formed dataset so the analytics section renders with zeros.
    console.error('Analytics fetch error:', error);
    return new Response(JSON.stringify({
      configured: true,
      warning: error instanceof Error ? error.message : 'Failed to fetch analytics',
      period: {
        start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      totals: { requests: 0, pageViews: 0, uniqueVisitors: 0, bandwidth: 0 },
      daily: [],
      topPages: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
