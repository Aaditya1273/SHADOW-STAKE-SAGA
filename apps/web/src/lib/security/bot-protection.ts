// Bot Protection System

export interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  reasons: string[];
  score: number;
}

export interface UserBehavior {
  mouseMovements: number;
  keyPresses: number;
  clickPatterns: number[];
  sessionDuration: number;
  actionsPerMinute: number;
  pauseFrequency: number;
  errorRate: number;
}

export interface ChallengeResult {
  challengeId: string;
  passed: boolean;
  responseTime: number;
  attempts: number;
}

export class BotProtection {
  private userBehaviors: Map<string, UserBehavior>;
  private challenges: Map<string, Challenge>;
  private botScores: Map<string, number>;

  // Bot detection thresholds
  private readonly BOT_SCORE_THRESHOLD = 70;
  private readonly MIN_MOUSE_MOVEMENTS = 10;
  private readonly MAX_ACTIONS_PER_MINUTE = 300;
  private readonly MIN_SESSION_DURATION = 10000; // 10 seconds

  constructor() {
    this.userBehaviors = new Map();
    this.challenges = new Map();
    this.botScores = new Map();
  }

  // Track user behavior
  trackBehavior(
    userAddress: string,
    behavior: Partial<UserBehavior>
  ): void {
    const existing = this.userBehaviors.get(userAddress) || {
      mouseMovements: 0,
      keyPresses: 0,
      clickPatterns: [],
      sessionDuration: 0,
      actionsPerMinute: 0,
      pauseFrequency: 0,
      errorRate: 0,
    };

    this.userBehaviors.set(userAddress, {
      ...existing,
      ...behavior,
    });
  }

  // Analyze user for bot behavior
  analyzeBotBehavior(userAddress: string): BotDetectionResult {
    const behavior = this.userBehaviors.get(userAddress);

    if (!behavior) {
      return {
        isBot: false,
        confidence: 0.5,
        reasons: ['No behavior data'],
        score: 50,
      };
    }

    const reasons: string[] = [];
    let score = 0;

    // Check 1: Mouse movements
    if (behavior.mouseMovements < this.MIN_MOUSE_MOVEMENTS) {
      reasons.push('Insufficient mouse movements');
      score += 20;
    }

    // Check 2: Actions per minute
    if (behavior.actionsPerMinute > this.MAX_ACTIONS_PER_MINUTE) {
      reasons.push('Too many actions per minute');
      score += 25;
    }

    // Check 3: Session duration
    if (behavior.sessionDuration < this.MIN_SESSION_DURATION) {
      reasons.push('Session too short');
      score += 15;
    }

    // Check 4: Click patterns (too consistent)
    if (this.isClickPatternSuspicious(behavior.clickPatterns)) {
      reasons.push('Suspicious click patterns');
      score += 20;
    }

    // Check 5: No pauses (bots don't pause)
    if (behavior.pauseFrequency === 0 && behavior.sessionDuration > 60000) {
      reasons.push('No pauses detected');
      score += 15;
    }

    // Check 6: Error rate (humans make mistakes)
    if (behavior.errorRate < 0.01 && behavior.actionsPerMinute > 100) {
      reasons.push('Unusually low error rate');
      score += 15;
    }

    // Check 7: Key presses (bots may not use keyboard naturally)
    if (behavior.keyPresses === 0 && behavior.sessionDuration > 30000) {
      reasons.push('No keyboard input');
      score += 10;
    }

    // Store bot score
    this.botScores.set(userAddress, score);

    const isBot = score >= this.BOT_SCORE_THRESHOLD;
    const confidence = Math.min(1.0, score / 100);

    return {
      isBot,
      confidence,
      reasons,
      score,
    };
  }

  // Check if click pattern is suspicious
  private isClickPatternSuspicious(patterns: number[]): boolean {
    if (patterns.length < 5) return false;

    // Calculate variance in click intervals
    const avg = patterns.reduce((sum, p) => sum + p, 0) / patterns.length;
    const variance =
      patterns.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / patterns.length;
    const stdDev = Math.sqrt(variance);

    // Too consistent (low variance) is suspicious
    return stdDev < 10 && patterns.length > 10;
  }

  // Create challenge for suspicious users
  createChallenge(
    userAddress: string,
    type: 'captcha' | 'puzzle' | 'timing'
  ): Challenge {
    const challengeId = `challenge-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const challenge: Challenge = {
      id: challengeId,
      userAddress,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      solved: false,
      data: this.generateChallengeData(type),
    };

    this.challenges.set(challengeId, challenge);

    return challenge;
  }

  // Generate challenge data
  private generateChallengeData(type: Challenge['type']): any {
    switch (type) {
      case 'captcha':
        return {
          question: 'What is 2 + 2?',
          answer: '4',
        };

      case 'puzzle':
        return {
          pieces: 9,
          correctOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        };

      case 'timing':
        return {
          targetTime: 1000, // 1 second
          tolerance: 200, // ±200ms
        };

      default:
        return {};
    }
  }

  // Verify challenge response
  verifyChallenge(
    challengeId: string,
    response: any,
    responseTime: number
  ): ChallengeResult {
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      return {
        challengeId,
        passed: false,
        responseTime: 0,
        attempts: 0,
      };
    }

    if (challenge.solved) {
      return {
        challengeId,
        passed: true,
        responseTime: 0,
        attempts: challenge.attempts,
      };
    }

    if (Date.now() > challenge.expiresAt) {
      return {
        challengeId,
        passed: false,
        responseTime: 0,
        attempts: challenge.attempts,
      };
    }

    challenge.attempts++;

    let passed = false;

    switch (challenge.type) {
      case 'captcha':
        passed = response === challenge.data.answer;
        break;

      case 'puzzle':
        passed = JSON.stringify(response) === JSON.stringify(challenge.data.correctOrder);
        break;

      case 'timing':
        const timeDiff = Math.abs(responseTime - challenge.data.targetTime);
        passed = timeDiff <= challenge.data.tolerance;
        break;
    }

    if (passed) {
      challenge.solved = true;
      // Reduce bot score on successful challenge
      const currentScore = this.botScores.get(challenge.userAddress) || 0;
      this.botScores.set(challenge.userAddress, Math.max(0, currentScore - 30));
    } else if (challenge.attempts >= challenge.maxAttempts) {
      // Failed too many times, increase bot score
      const currentScore = this.botScores.get(challenge.userAddress) || 0;
      this.botScores.set(challenge.userAddress, currentScore + 20);
    }

    return {
      challengeId,
      passed,
      responseTime,
      attempts: challenge.attempts,
    };
  }

  // Check if user needs challenge
  needsChallenge(userAddress: string): boolean {
    const botAnalysis = this.analyzeBotBehavior(userAddress);
    return botAnalysis.score >= 50; // Require challenge if score >= 50
  }

  // Get user bot score
  getUserBotScore(userAddress: string): number {
    return this.botScores.get(userAddress) || 0;
  }

  // Reset user bot score
  resetBotScore(userAddress: string): void {
    this.botScores.set(userAddress, 0);
  }

  // Get statistics
  getStats(): {
    totalUsers: number;
    suspiciousUsers: number;
    confirmedBots: number;
    challengesIssued: number;
    challengesPassed: number;
  } {
    const users = Array.from(this.botScores.entries());
    const suspicious = users.filter(([_, score]) => score >= 50 && score < 70).length;
    const confirmedBots = users.filter(([_, score]) => score >= 70).length;

    const challenges = Array.from(this.challenges.values());
    const challengesPassed = challenges.filter((c) => c.solved).length;

    return {
      totalUsers: users.length,
      suspiciousUsers: suspicious,
      confirmedBots,
      challengesIssued: challenges.length,
      challengesPassed,
    };
  }

  // Clean up expired challenges
  cleanupChallenges(): number {
    const now = Date.now();
    let cleaned = 0;

    this.challenges.forEach((challenge, id) => {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
        cleaned++;
      }
    });

    return cleaned;
  }
}

interface Challenge {
  id: string;
  userAddress: string;
  type: 'captcha' | 'puzzle' | 'timing';
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  solved: boolean;
  data: any;
}

export const botProtection = new BotProtection();

// Helper function to track mouse movement
export function trackMouseMovement(userAddress: string): void {
  const behavior = botProtection['userBehaviors'].get(userAddress) || {
    mouseMovements: 0,
    keyPresses: 0,
    clickPatterns: [],
    sessionDuration: 0,
    actionsPerMinute: 0,
    pauseFrequency: 0,
    errorRate: 0,
  };

  behavior.mouseMovements++;
  botProtection.trackBehavior(userAddress, behavior);
}

// Helper function to track key press
export function trackKeyPress(userAddress: string): void {
  const behavior = botProtection['userBehaviors'].get(userAddress) || {
    mouseMovements: 0,
    keyPresses: 0,
    clickPatterns: [],
    sessionDuration: 0,
    actionsPerMinute: 0,
    pauseFrequency: 0,
    errorRate: 0,
  };

  behavior.keyPresses++;
  botProtection.trackBehavior(userAddress, behavior);
}
