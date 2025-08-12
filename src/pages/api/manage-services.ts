import type { APIRoute } from 'astro';
import { serviceRegistry } from '../../lib/services/websiteAnalysisService';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const serviceName = url.searchParams.get('service');
    
    if (serviceName) {
      // Get specific service status
      const status = serviceRegistry.getServiceStatus(serviceName);
      if (!status) {
        return new Response(JSON.stringify({ 
          error: `Service '${serviceName}' not found` 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        service: serviceName,
        status
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // List all services
    const services = serviceRegistry.list();
    return new Response(JSON.stringify({
      services,
      total: services.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get service information',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, serviceName, componentName, updates } = await request.json();
    
    if (!serviceName) {
      return new Response(JSON.stringify({ 
        error: 'serviceName is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const service = serviceRegistry.get(serviceName);
    if (!service) {
      return new Response(JSON.stringify({ 
        error: `Service '${serviceName}' not found` 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let result: any = { success: false };
    
    switch (action) {
      case 'disable_component':
        if (!componentName) {
          return new Response(JSON.stringify({ 
            error: 'componentName is required for disable_component action' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const disableComponent = service.components.get(componentName);
        if (disableComponent) {
          result.success = service.updateComponent(componentName, { 
            config: { ...disableComponent.config, enabled: false } 
          });
          result.message = `Component '${componentName}' disabled`;
        } else {
          result.error = `Component '${componentName}' not found`;
        }
        break;
        
      case 'enable_component':
        if (!componentName) {
          return new Response(JSON.stringify({ 
            error: 'componentName is required for enable_component action' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const enableComponent = service.components.get(componentName);
        if (enableComponent) {
          result.success = service.updateComponent(componentName, { 
            config: { ...enableComponent.config, enabled: true } 
          });
          result.message = `Component '${componentName}' enabled`;
        } else {
          result.error = `Component '${componentName}' not found`;
        }
        break;
        
      case 'update_priority':
        if (!componentName || !updates?.priority) {
          return new Response(JSON.stringify({ 
            error: 'componentName and updates.priority are required for update_priority action' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const priorityComponent = service.components.get(componentName);
        if (priorityComponent) {
          result.success = service.updateComponent(componentName, { 
            config: { ...priorityComponent.config, priority: updates.priority } 
          });
          result.message = `Component '${componentName}' priority updated to ${updates.priority}`;
        } else {
          result.error = `Component '${componentName}' not found`;
        }
        break;
        
      case 'remove_component':
        if (!componentName) {
          return new Response(JSON.stringify({ 
            error: 'componentName is required for remove_component action' 
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        result.success = service.removeComponent(componentName);
        result.message = result.success ? 
          `Component '${componentName}' removed` : 
          `Component '${componentName}' not found`;
        break;
        
      default:
        return new Response(JSON.stringify({ 
          error: `Unknown action: ${action}. Valid actions: disable_component, enable_component, update_priority, remove_component` 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Include updated service status in response
    result.serviceStatus = service.getStatus();
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to manage service',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
