import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('Authorization');
    const expectedToken = (locals as any).runtime?.env?.ADMIN_API_KEY;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get KV_SERVICES namespace
    const kvServices = (locals as any).runtime?.env?.KV_SERVICES;
    if (!kvServices) {
      return new Response(JSON.stringify({ 
        error: 'KV_SERVICES namespace not available',
        available_namespaces: Object.keys((locals as any).runtime?.env || {}).filter(key => key.includes('KV'))
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // List all keys in KV_SERVICES
    const listResult = await kvServices.list();
    const keys = listResult.keys.map((key: any) => key.name);

    // Get current services data
    let servicesData = null;
    try {
      const servicesRaw = await kvServices.get('services_v1');
      if (servicesRaw) {
        servicesData = JSON.parse(servicesRaw);
      }
    } catch (error) {
      console.error('Error parsing services data:', error);
    }

    // Get latest services pointer
    let latestVersion = null;
    try {
      latestVersion = await kvServices.get('latest_version');
    } catch (error) {
      console.error('Error getting latest version:', error);
    }

    const response = {
      namespace: 'KV_SERVICES',
      totalKeys: keys.length,
      allKeys: keys,
      latestVersion,
      servicesData: servicesData ? {
        hasServices: !!servicesData.services,
        serviceCount: servicesData.services?.length || 0,
        services: servicesData.services || [],
        lastUpdated: servicesData.lastUpdated,
        version: servicesData.version
      } : null,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to analyze KV_SERVICES',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
