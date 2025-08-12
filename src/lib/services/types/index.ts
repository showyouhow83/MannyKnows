export interface ServiceComponent {
  name: string;
  execute: (input: any) => Promise<any>;
  config: {
    enabled: boolean;
    priority: number;
    timeout?: number;
  };
}

export interface ServiceResult {
  success: boolean;
  data: any;
  errors?: string[];
  componentResults: Record<string, any>;
}

export interface ServiceConfig {
  enabled: boolean;
  requiresVerification: boolean;
  requiresPhoneVerification?: boolean;
  maxExecutionTime: number;
}

export interface SalesResponse {
  reply: string;
  urgency: 'low' | 'medium' | 'high';
  leadScore: number;
  nextAction: 'schedule' | 'follow_up' | 'continue_chat';
  opportunities: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    service: string;
  }>;
  servicesExecuted?: string[];
  servicesAvailable?: string[];
}
