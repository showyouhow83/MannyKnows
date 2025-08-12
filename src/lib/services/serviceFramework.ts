import type { ServiceComponent, ServiceResult, ServiceConfig } from './types';

export class Service {
  public name: string;
  public components: Map<string, ServiceComponent>;
  public config: ServiceConfig;

  constructor(name: string, config: Partial<ServiceConfig> = {}) {
    this.name = name;
    this.components = new Map();
    this.config = {
      enabled: true,
      requiresVerification: true,
      maxExecutionTime: 30000,
      ...config
    };
  }

  // Add a component to this service
  addComponent(name: string, component: ServiceComponent): void {
    this.components.set(name, component);
  }

  // Remove a component from this service
  removeComponent(name: string): boolean {
    return this.components.delete(name);
  }

  // Update component configuration
  updateComponent(name: string, updates: Partial<ServiceComponent>): boolean {
    const component = this.components.get(name);
    if (!component) return false;
    
    this.components.set(name, { ...component, ...updates });
    return true;
  }

  // Execute all enabled components
  async execute(input: any): Promise<ServiceResult> {
    const results: Record<string, any> = {};
    const errors: string[] = [];
    let success = true;

    // Sort components by priority
    const sortedComponents = Array.from(this.components.entries())
      .filter(([_, component]) => component.config.enabled)
      .sort(([_, a], [__, b]) => a.config.priority - b.config.priority);

    // Execute components sequentially, passing results forward
    let componentInput = { ...input };
    
    for (const [name, component] of sortedComponents) {
      try {
        const timeout = component.config.timeout || 10000;
        const result = await Promise.race([
          component.execute(componentInput),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Component ${name} timeout`)), timeout)
          )
        ]);
        
        results[name] = result;
        // Add this component's results to the input for the next component
        componentInput = { ...componentInput, [name]: result };
        
      } catch (error) {
        console.error(`Component ${name} failed:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${name}: ${errorMessage}`);
        success = false;
      }
    }

    return {
      success,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      componentResults: results
    };
  }

  // Get service status and component info
  getStatus() {
    return {
      name: this.name,
      enabled: this.config.enabled,
      componentCount: this.components.size,
      enabledComponents: Array.from(this.components.entries())
        .filter(([_, component]) => component.config.enabled)
        .map(([name, component]) => ({
          name,
          priority: component.config.priority,
          enabled: component.config.enabled
        }))
        .sort((a, b) => a.priority - b.priority)
    };
  }
}

export class ServiceRegistry {
  private services: Map<string, Service> = new Map();

  // Register a service
  register(service: Service): void {
    this.services.set(service.name, service);
  }

  // Get a service
  get(name: string): Service | undefined {
    return this.services.get(name);
  }

  // List all services
  list(): Array<{ name: string; status: any }> {
    return Array.from(this.services.values()).map(service => ({
      name: service.name,
      status: service.getStatus()
    }));
  }

  // Execute a service
  async execute(serviceName: string, input: any): Promise<ServiceResult> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (!service.config.enabled) {
      throw new Error(`Service ${serviceName} is disabled`);
    }

    return await service.execute(input);
  }

  // Get service status
  getServiceStatus(serviceName: string) {
    const service = this.services.get(serviceName);
    return service?.getStatus() || null;
  }

  // Get list of available services
  getAvailableServices(): string[] {
    return Array.from(this.services.keys());
  }

  // Get list of enabled services
  getEnabledServices(): string[] {
    return Array.from(this.services.entries())
      .filter(([_, service]) => service.config.enabled)
      .map(([name, _]) => name);
  }
}
