import type { APIRoute } from 'astro';
import { createServiceArchitecture } from '../../lib/services/ServiceArchitecture';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get environment from locals
    const environment = (locals as any).runtime?.env;
    
    // Check if KV_SERVICES is available
    const kvServices = environment?.KV_SERVICES;
    const hasKVServices = !!kvServices;
    
    let kvData = null;
    let kvKeys = [];
    let latestVersion = null;
    
    if (kvServices) {
      try {
        // List all keys
        const listResult = await kvServices.list();
        kvKeys = listResult.keys.map((key: any) => key.name);
        
        // Check for services_latest pointer
        latestVersion = await kvServices.get('services_latest');
        
        // Try to get some sample data
        if (latestVersion) {
          const serviceDataRaw = await kvServices.get(latestVersion);
          if (serviceDataRaw) {
            kvData = JSON.parse(serviceDataRaw);
          }
        }
      } catch (error) {
        console.error('Error reading from KV_SERVICES:', error);
      }
    }
    
    // Test ServiceArchitecture initialization
    const serviceArchitecture = createServiceArchitecture(environment);
    await serviceArchitecture.ensureAllLoaded(); // Load both services and products
    
    const allServices = serviceArchitecture.getAllServices();
    const allProducts = serviceArchitecture.getAllProducts();
    const serviceCount = allServices.length;
    const productCount = allProducts.length;
    const serviceNames = allServices.map(s => s.name);
    const productNames = allProducts.map(p => p.name);
    
    return new Response(JSON.stringify({
      debug: 'Services and Products Loading Debug',
      kv_status: {
        has_kv_services: hasKVServices,
        kv_keys_count: kvKeys.length,
        kv_keys: kvKeys,
        latest_version: latestVersion,
        has_service_data: !!kvData,
        service_data_count: kvData?.services?.length || 0
      },
      architecture_status: {
        service_count: serviceCount,
        product_count: productCount,
        total_offerings: serviceCount + productCount,
        service_names: serviceNames,
        product_names: productNames,
        first_service: allServices[0] || null,
        first_product: allProducts[0] || null
      },
      environment_keys: Object.keys(environment || {}).filter(key => key.includes('KV'))
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
