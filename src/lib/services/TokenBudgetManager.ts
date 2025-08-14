// Token Budget Management for Freemium Model
// Progressive token allocation based on user engagement level

import type { UserProfile } from '../user/ProfileManager.js';

export interface TokenBudget {
  max_tokens_per_response: number;
  daily_token_budget: number;
  session_token_budget: number;
}

export interface TokenUsage {
  sessionTokensUsed: number;
  dailyTokensUsed: number;
  lastDailyReset: number;
}

export interface TokenAllocation {
  maxTokensForResponse: number;
  remainingSessionBudget: number;
  remainingDailyBudget: number;
  userTier: 'anonymous' | 'engaged' | 'verified';
  budgetWarning?: string;
}

export class TokenBudgetManager {
  private kv: any;
  private tokenBudgets: Record<string, TokenBudget>;

  constructor(kv: any, envConfig: any) {
    this.kv = kv;
    this.tokenBudgets = envConfig.token_budget;
  }

  /**
   * Get user's token tier based on engagement
   */
  getUserTier(profile: UserProfile): 'anonymous' | 'engaged' | 'verified' {
    if (profile.emailVerified) {
      return 'verified';
    }
    
    if (profile.interactions >= 3 || profile.trustScore >= 10 || profile.freeServicesUsed.length >= 2) {
      return 'engaged';
    }
    
    return 'anonymous';
  }

  /**
   * Get current token usage for user
   */
  async getTokenUsage(profileId: string): Promise<TokenUsage> {
    const usageData = await this.kv.get(`token_usage:${profileId}`);
    
    if (!usageData) {
      return {
        sessionTokensUsed: 0,
        dailyTokensUsed: 0,
        lastDailyReset: Date.now()
      };
    }

    const usage = JSON.parse(usageData);
    
    // Reset daily usage if it's a new day
    const now = Date.now();
    const lastReset = usage.lastDailyReset || 0;
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 24) {
      usage.dailyTokensUsed = 0;
      usage.lastDailyReset = now;
      await this.saveTokenUsage(profileId, usage);
    }

    return usage;
  }

  /**
   * Calculate token allocation for a request
   */
  async calculateTokenAllocation(profile: UserProfile): Promise<TokenAllocation> {
    const userTier = this.getUserTier(profile);
    const budget = this.tokenBudgets[userTier];
    const usage = await this.getTokenUsage(profile.id);

    const remainingDaily = Math.max(0, budget.daily_token_budget - usage.dailyTokensUsed);
    const remainingSession = Math.max(0, budget.session_token_budget - usage.sessionTokensUsed);
    
    // Calculate max tokens for this response
    let maxTokensForResponse = Math.min(
      budget.max_tokens_per_response,
      remainingDaily,
      remainingSession
    );

    // Generate warnings based on usage (email collection removed)
    let budgetWarning: string | undefined;

    // Check if approaching limits
    const dailyUsagePercent = usage.dailyTokensUsed / budget.daily_token_budget;
    const sessionUsagePercent = usage.sessionTokensUsed / budget.session_token_budget;

    // Simple usage warnings without email prompts
    if (dailyUsagePercent > 0.9 || sessionUsagePercent > 0.9) {
      if (maxTokensForResponse < budget.max_tokens_per_response * 0.5) {
        budgetWarning = "Approaching your usage limit for today. Responses may be shorter.";
      }
    }

    // Ensure minimum response size
    if (maxTokensForResponse < 200 && remainingDaily > 0) {
      maxTokensForResponse = Math.min(500, remainingDaily);
      budgetWarning = "This will be a shorter response due to usage limits. " + (budgetWarning || '');
    }

    return {
      maxTokensForResponse,
      remainingSessionBudget: remainingSession,
      remainingDailyBudget: remainingDaily,
      userTier,
      budgetWarning
    };
  }

  /**
   * Track token usage after a response
   */
  async trackTokenUsage(profileId: string, promptTokens: number, completionTokens: number): Promise<void> {
    const usage = await this.getTokenUsage(profileId);
    const totalTokens = promptTokens + completionTokens;

    usage.sessionTokensUsed += totalTokens;
    usage.dailyTokensUsed += totalTokens;

    await this.saveTokenUsage(profileId, usage);
  }

  /**
   * Save token usage to storage
   */
  private async saveTokenUsage(profileId: string, usage: TokenUsage): Promise<void> {
    await this.kv.put(`token_usage:${profileId}`, JSON.stringify(usage), {
      expirationTtl: 86400 * 2 // 2 days
    });
  }

  /**
   * Reset session token usage (when user starts new session)
   */
  async resetSessionUsage(profileId: string): Promise<void> {
    const usage = await this.getTokenUsage(profileId);
    usage.sessionTokensUsed = 0;
    await this.saveTokenUsage(profileId, usage);
  }

  /**
   * Get usage summary for user
   */
  async getUsageSummary(profile: UserProfile): Promise<{
    tier: string;
    dailyUsage: { used: number; total: number; percentage: number };
    sessionUsage: { used: number; total: number; percentage: number };
    canUpgrade: boolean;
  }> {
    const userTier = this.getUserTier(profile);
    const budget = this.tokenBudgets[userTier];
    const usage = await this.getTokenUsage(profile.id);

    return {
      tier: userTier,
      dailyUsage: {
        used: usage.dailyTokensUsed,
        total: budget.daily_token_budget,
        percentage: Math.round((usage.dailyTokensUsed / budget.daily_token_budget) * 100)
      },
      sessionUsage: {
        used: usage.sessionTokensUsed,
        total: budget.session_token_budget,
        percentage: Math.round((usage.sessionTokensUsed / budget.session_token_budget) * 100)
      },
      canUpgrade: userTier !== 'verified'
    };
  }
}

export default TokenBudgetManager;
