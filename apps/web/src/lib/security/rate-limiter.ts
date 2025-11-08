// Rate Limiting System

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

export type RateLimitType =
  | 'game_start'
  | 'score_submit'
  | 'transaction'
  | 'api_call'
  | 'login'
  | 'marketplace';

export class RateLimiter {
  private limits: Map<string, RateLimitEntry>; // key -> entry
  private configs: Map<RateLimitType, RateLimitConfig>;

  constructor() {
    this.limits = new Map();
    this.configs = new Map();
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Game start: 10 games per hour
    this.configs.set('game_start', {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    });

    // Score submit: 20 submissions per hour
    this.configs.set('score_submit', {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });

    // Transactions: 50 per hour
    this.configs.set('transaction', {
      maxRequests: 50,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    });

    // API calls: 100 per minute
    this.configs.set('api_call', {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    });

    // Login attempts: 5 per 15 minutes
    this.configs.set('login', {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });

    // Marketplace: 30 actions per hour
    this.configs.set('marketplace', {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });
  }

  // Check if request is allowed
  checkLimit(
    identifier: string,
    type: RateLimitType
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);

    if (!config) {
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
      };
    }

    const now = Date.now();
    let entry = this.limits.get(key);

    // Check if blocked
    if (entry?.blocked && entry.blockUntil) {
      if (now < entry.blockUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.blockUntil,
          retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        };
      } else {
        // Unblock
        entry.blocked = false;
        entry.blockUntil = undefined;
      }
    }

    // Initialize or reset if window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.limits.set(key, entry);
    }

    // Check limit
    if (entry.count >= config.maxRequests) {
      // Block if configured
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.blockUntil = now + config.blockDurationMs;
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Record request
  recordRequest(identifier: string, type: RateLimitType): void {
    const key = `${type}:${identifier}`;
    const entry = this.limits.get(key);

    if (entry && !entry.blocked) {
      entry.count++;
    }
  }

  // Reset limit for identifier
  resetLimit(identifier: string, type: RateLimitType): void {
    const key = `${type}:${identifier}`;
    this.limits.delete(key);
  }

  // Get current usage
  getUsage(
    identifier: string,
    type: RateLimitType
  ): {
    count: number;
    limit: number;
    resetTime: number;
    blocked: boolean;
  } {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);
    const entry = this.limits.get(key);

    if (!config) {
      return {
        count: 0,
        limit: 999,
        resetTime: Date.now() + 60000,
        blocked: false,
      };
    }

    return {
      count: entry?.count || 0,
      limit: config.maxRequests,
      resetTime: entry?.resetTime || Date.now() + config.windowMs,
      blocked: entry?.blocked || false,
    };
  }

  // Update config
  updateConfig(type: RateLimitType, config: Partial<RateLimitConfig>): void {
    const existing = this.configs.get(type);
    if (existing) {
      this.configs.set(type, { ...existing, ...config });
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.limits.forEach((entry, key) => {
      if (now >= entry.resetTime && !entry.blocked) {
        this.limits.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  // Get statistics
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    activeEntries: number;
    byType: Record<string, number>;
  } {
    const entries = Array.from(this.limits.entries());
    const blocked = entries.filter(([_, entry]) => entry.blocked).length;
    const now = Date.now();
    const active = entries.filter(([_, entry]) => now < entry.resetTime).length;

    const byType: Record<string, number> = {};
    entries.forEach(([key]) => {
      const type = key.split(':')[0]!;
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalEntries: entries.length,
      blockedEntries: blocked,
      activeEntries: active,
      byType,
    };
  }

  // Check if identifier is blocked
  isBlocked(identifier: string, type: RateLimitType): boolean {
    const key = `${type}:${identifier}`;
    const entry = this.limits.get(key);

    if (!entry?.blocked) return false;

    if (entry.blockUntil && Date.now() >= entry.blockUntil) {
      entry.blocked = false;
      entry.blockUntil = undefined;
      return false;
    }

    return true;
  }

  // Manually block identifier
  blockIdentifier(
    identifier: string,
    type: RateLimitType,
    durationMs: number
  ): void {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);

    if (!config) return;

    const entry: RateLimitEntry = {
      count: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      blocked: true,
      blockUntil: Date.now() + durationMs,
    };

    this.limits.set(key, entry);
  }

  // Unblock identifier
  unblockIdentifier(identifier: string, type: RateLimitType): void {
    const key = `${type}:${identifier}`;
    const entry = this.limits.get(key);

    if (entry) {
      entry.blocked = false;
      entry.blockUntil = undefined;
    }
  }
}

export const rateLimiter = new RateLimiter();

// Middleware-style helper
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): {
  proceed: boolean;
  error?: string;
  retryAfter?: number;
} {
  const result = rateLimiter.checkLimit(identifier, type);

  if (!result.allowed) {
    return {
      proceed: false,
      error: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    };
  }

  rateLimiter.recordRequest(identifier, type);

  return {
    proceed: true,
  };
}
