// Async Co-op System - Play with ghosts of other players

export interface GhostRun {
  id: string;
  playerAddress: string;
  playerName: string;
  level: number;
  score: bigint;
  completedAt: number;
  duration: number;
  actions: GhostAction[];
  stats: {
    kills: number;
    deaths: number;
    damageDealt: bigint;
    damageTaken: bigint;
    itemsCollected: number;
  };
  difficulty: 'normal' | 'hard' | 'nightmare' | 'hell';
  isSuccessful: boolean;
}

export interface GhostAction {
  timestamp: number; // Relative to run start
  type: 'move' | 'attack' | 'dodge' | 'use_item' | 'death';
  position: { x: number; y: number };
  data?: any;
}

export interface AsyncCoopSession {
  id: string;
  hostAddress: string;
  hostName: string;
  ghostRuns: GhostRun[];
  maxGhosts: number;
  level: number;
  difficulty: 'normal' | 'hard' | 'nightmare' | 'hell';
  startedAt: number;
  status: 'active' | 'completed' | 'failed';
  rewards: {
    baseReward: bigint;
    ghostBonus: bigint; // Bonus for each ghost that survives
    totalReward: bigint;
  };
}

export interface GhostInteraction {
  id: string;
  sessionId: string;
  type: 'assist' | 'revive' | 'buff' | 'heal';
  fromGhost: string; // Ghost player address
  toPlayer: string; // Live player address
  timestamp: number;
  value: number; // Damage/healing amount
}

export class AsyncCoopManager {
  private ghostRuns: Map<string, GhostRun[]>; // level -> runs
  private activeSessions: Map<string, AsyncCoopSession>;
  private interactions: Map<string, GhostInteraction[]>; // sessionId -> interactions

  constructor() {
    this.ghostRuns = new Map();
    this.activeSessions = new Map();
    this.interactions = new Map();
  }

  // Record a player's run as a ghost
  recordGhostRun(
    playerAddress: string,
    playerName: string,
    level: number,
    score: bigint,
    duration: number,
    actions: GhostAction[],
    stats: GhostRun['stats'],
    difficulty: GhostRun['difficulty'],
    isSuccessful: boolean
  ): GhostRun {
    const ghostRun: GhostRun = {
      id: `ghost-${Date.now()}-${playerAddress}`,
      playerAddress,
      playerName,
      level,
      score,
      completedAt: Date.now(),
      duration,
      actions,
      stats,
      difficulty,
      isSuccessful,
    };

    const levelRuns = this.ghostRuns.get(`${level}-${difficulty}`) || [];
    levelRuns.push(ghostRun);

    // Keep only top 100 runs per level/difficulty
    levelRuns.sort((a, b) => (a.score > b.score ? -1 : 1));
    if (levelRuns.length > 100) {
      levelRuns.splice(100);
    }

    this.ghostRuns.set(`${level}-${difficulty}`, levelRuns);

    return ghostRun;
  }

  // Get available ghost runs for a level
  getAvailableGhosts(
    level: number,
    difficulty: 'normal' | 'hard' | 'nightmare' | 'hell',
    limit: number = 10,
    filters?: {
      minScore?: bigint;
      maxScore?: bigint;
      onlySuccessful?: boolean;
    }
  ): GhostRun[] {
    let runs = this.ghostRuns.get(`${level}-${difficulty}`) || [];

    if (filters) {
      if (filters.minScore) {
        runs = runs.filter((r) => r.score >= filters.minScore!);
      }
      if (filters.maxScore) {
        runs = runs.filter((r) => r.score <= filters.maxScore!);
      }
      if (filters.onlySuccessful) {
        runs = runs.filter((r) => r.isSuccessful);
      }
    }

    return runs.slice(0, limit);
  }

  // Start async co-op session with ghosts
  startAsyncSession(
    hostAddress: string,
    hostName: string,
    level: number,
    difficulty: 'normal' | 'hard' | 'nightmare' | 'hell',
    ghostIds: string[]
  ): {
    success: boolean;
    message: string;
    session?: AsyncCoopSession;
  } {
    if (ghostIds.length > 3) {
      return { success: false, message: 'Maximum 3 ghosts allowed' };
    }

    // Get ghost runs
    const levelRuns = this.ghostRuns.get(`${level}-${difficulty}`) || [];
    const selectedGhosts = ghostIds
      .map((id) => levelRuns.find((r) => r.id === id))
      .filter((r) => r !== undefined) as GhostRun[];

    if (selectedGhosts.length !== ghostIds.length) {
      return { success: false, message: 'Some ghosts not found' };
    }

    const session: AsyncCoopSession = {
      id: `async-${Date.now()}-${hostAddress}`,
      hostAddress,
      hostName,
      ghostRuns: selectedGhosts,
      maxGhosts: 3,
      level,
      difficulty,
      startedAt: Date.now(),
      status: 'active',
      rewards: {
        baseReward: BigInt(1000),
        ghostBonus: BigInt(500),
        totalReward: BigInt(0),
      },
    };

    this.activeSessions.set(session.id, session);

    return {
      success: true,
      message: 'Async co-op session started',
      session,
    };
  }

  // Get ghost action at specific time
  getGhostActionAtTime(
    ghostRun: GhostRun,
    elapsedTime: number
  ): GhostAction | null {
    // Find the most recent action before or at the elapsed time
    const actions = ghostRun.actions.filter((a) => a.timestamp <= elapsedTime);
    return actions.length > 0 ? actions[actions.length - 1]! : null;
  }

  // Get ghost position at specific time
  getGhostPosition(
    ghostRun: GhostRun,
    elapsedTime: number
  ): { x: number; y: number } | null {
    const action = this.getGhostActionAtTime(ghostRun, elapsedTime);
    return action ? action.position : null;
  }

  // Check if ghost can assist player
  canGhostAssist(
    sessionId: string,
    ghostId: string,
    playerPosition: { x: number; y: number },
    elapsedTime: number
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const ghost = session.ghostRuns.find((g) => g.id === ghostId);
    if (!ghost) return false;

    const ghostPos = this.getGhostPosition(ghost, elapsedTime);
    if (!ghostPos) return false;

    // Check if ghost is within assist range (100 units)
    const distance = Math.sqrt(
      Math.pow(ghostPos.x - playerPosition.x, 2) +
        Math.pow(ghostPos.y - playerPosition.y, 2)
    );

    return distance < 100;
  }

  // Record ghost interaction
  recordInteraction(
    sessionId: string,
    type: GhostInteraction['type'],
    fromGhost: string,
    toPlayer: string,
    value: number
  ): GhostInteraction {
    const interaction: GhostInteraction = {
      id: `interaction-${Date.now()}-${Math.random()}`,
      sessionId,
      type,
      fromGhost,
      toPlayer,
      timestamp: Date.now(),
      value,
    };

    const sessionInteractions = this.interactions.get(sessionId) || [];
    sessionInteractions.push(interaction);
    this.interactions.set(sessionId, sessionInteractions);

    return interaction;
  }

  // Complete async session
  completeAsyncSession(
    sessionId: string,
    success: boolean,
    survivingGhosts: number
  ): {
    success: boolean;
    message: string;
    rewards?: bigint;
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    session.status = success ? 'completed' : 'failed';

    if (success) {
      // Calculate rewards
      const ghostBonus = session.rewards.ghostBonus * BigInt(survivingGhosts);
      const totalReward = session.rewards.baseReward + ghostBonus;
      session.rewards.totalReward = totalReward;

      return {
        success: true,
        message: 'Session completed!',
        rewards: totalReward,
      };
    }

    return { success: true, message: 'Session failed' };
  }

  // Get session interactions
  getSessionInteractions(sessionId: string): GhostInteraction[] {
    return this.interactions.get(sessionId) || [];
  }

  // Get ghost run by ID
  getGhostRun(ghostId: string): GhostRun | null {
    for (const runs of this.ghostRuns.values()) {
      const run = runs.find((r) => r.id === ghostId);
      if (run) return run;
    }
    return null;
  }

  // Get player's ghost runs
  getPlayerGhostRuns(playerAddress: string): GhostRun[] {
    const allRuns: GhostRun[] = [];
    this.ghostRuns.forEach((runs) => {
      runs.forEach((run) => {
        if (run.playerAddress === playerAddress) {
          allRuns.push(run);
        }
      });
    });
    return allRuns.sort((a, b) => b.completedAt - a.completedAt);
  }

  // Get ghost run statistics
  getGhostStats(ghostId: string): {
    timesUsed: number;
    avgSurvivalRate: number;
    totalAssists: number;
    totalRevives: number;
  } | null {
    const ghostRun = this.getGhostRun(ghostId);
    if (!ghostRun) return null;

    let timesUsed = 0;
    let survived = 0;
    let totalAssists = 0;
    let totalRevives = 0;

    this.activeSessions.forEach((session) => {
      const hasGhost = session.ghostRuns.some((g) => g.id === ghostId);
      if (hasGhost) {
        timesUsed++;
        if (session.status === 'completed') survived++;
      }
    });

    this.interactions.forEach((interactions) => {
      interactions.forEach((interaction) => {
        if (interaction.fromGhost === ghostRun.playerAddress) {
          if (interaction.type === 'assist') totalAssists++;
          if (interaction.type === 'revive') totalRevives++;
        }
      });
    });

    return {
      timesUsed,
      avgSurvivalRate: timesUsed > 0 ? survived / timesUsed : 0,
      totalAssists,
      totalRevives,
    };
  }

  // Get recommended ghosts for player
  getRecommendedGhosts(
    playerAddress: string,
    level: number,
    difficulty: 'normal' | 'hard' | 'nightmare' | 'hell'
  ): GhostRun[] {
    const availableGhosts = this.getAvailableGhosts(level, difficulty, 50, {
      onlySuccessful: true,
    });

    // Filter out player's own runs
    const otherGhosts = availableGhosts.filter(
      (g) => g.playerAddress !== playerAddress
    );

    // Score ghosts based on multiple factors
    const scoredGhosts = otherGhosts.map((ghost) => {
      const stats = this.getGhostStats(ghost.id);
      let score = 0;

      // High score is good
      score += Number(ghost.score) / 1000;

      // High survival rate is good
      if (stats) {
        score += stats.avgSurvivalRate * 100;
        score += stats.totalAssists * 10;
        score += stats.totalRevives * 20;
      }

      // Successful runs are better
      if (ghost.isSuccessful) score += 50;

      return { ghost, score };
    });

    // Sort by score and return top 10
    scoredGhosts.sort((a, b) => b.score - a.score);
    return scoredGhosts.slice(0, 10).map((sg) => sg.ghost);
  }

  // Get active session
  getActiveSession(sessionId: string): AsyncCoopSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get all active sessions
  getAllActiveSessions(): AsyncCoopSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (s) => s.status === 'active'
    );
  }

  // Calculate ghost influence on rewards
  calculateGhostInfluence(
    sessionId: string
  ): {
    totalAssists: number;
    totalRevives: number;
    bonusMultiplier: number;
  } {
    const interactions = this.getSessionInteractions(sessionId);

    const totalAssists = interactions.filter((i) => i.type === 'assist').length;
    const totalRevives = interactions.filter((i) => i.type === 'revive').length;

    // Each assist adds 1% bonus, each revive adds 5% bonus
    const bonusMultiplier = 1 + totalAssists * 0.01 + totalRevives * 0.05;

    return {
      totalAssists,
      totalRevives,
      bonusMultiplier,
    };
  }
}

// Singleton instance
export const asyncCoopManager = new AsyncCoopManager();
