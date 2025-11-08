// Server-Side Validation System

export interface GameSession {
  sessionId: string;
  playerAddress: string;
  startTime: number;
  endTime?: number;
  level: number;
  seed: string; // Random seed for dungeon generation
  actions: GameAction[];
  checkpoints: GameCheckpoint[];
  status: 'active' | 'completed' | 'abandoned' | 'invalid';
}

export interface GameAction {
  timestamp: number;
  type: 'move' | 'attack' | 'damage_taken' | 'enemy_killed' | 'item_collected' | 'level_complete';
  data: any;
  hash: string; // Hash of action for verification
}

export interface GameCheckpoint {
  timestamp: number;
  level: number;
  score: number;
  health: number;
  position: { x: number; y: number };
  enemiesKilled: number;
  itemsCollected: number;
  hash: string; // Hash of checkpoint state
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  reason?: string;
  flags: string[];
  confidence: number; // 0-1
}

export class ServerValidator {
  private sessions: Map<string, GameSession>;
  private suspiciousPlayers: Map<string, number>; // playerAddress -> suspicion score

  // Validation thresholds
  private readonly MAX_SCORE_PER_SECOND = 100;
  private readonly MAX_KILLS_PER_SECOND = 5;
  private readonly MAX_SPEED = 500; // units per second
  private readonly MIN_GAME_DURATION = 30000; // 30 seconds
  private readonly MAX_GAME_DURATION = 3600000; // 1 hour

  constructor() {
    this.sessions = new Map();
    this.suspiciousPlayers = new Map();
  }

  // Start new game session
  startSession(
    playerAddress: string,
    level: number
  ): {
    sessionId: string;
    seed: string;
  } {
    const sessionId = this.generateSessionId();
    const seed = this.generateSeed();

    const session: GameSession = {
      sessionId,
      playerAddress,
      startTime: Date.now(),
      level,
      seed,
      actions: [],
      checkpoints: [],
      status: 'active',
    };

    this.sessions.set(sessionId, session);

    return { sessionId, seed };
  }

  // Record game action
  recordAction(
    sessionId: string,
    action: Omit<GameAction, 'hash'>
  ): {
    success: boolean;
    message?: string;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.status !== 'active') {
      return { success: false, message: 'Session not active' };
    }

    // Validate timestamp
    if (action.timestamp < session.startTime) {
      return { success: false, message: 'Invalid timestamp' };
    }

    // Generate hash
    const hash = this.hashAction(action);

    session.actions.push({
      ...action,
      hash,
    });

    return { success: true };
  }

  // Record checkpoint
  recordCheckpoint(
    sessionId: string,
    checkpoint: Omit<GameCheckpoint, 'hash'>
  ): {
    success: boolean;
    message?: string;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    // Generate hash
    const hash = this.hashCheckpoint(checkpoint);

    session.checkpoints.push({
      ...checkpoint,
      hash,
    });

    return { success: true };
  }

  // Validate and complete session
  validateSession(
    sessionId: string,
    finalScore: number
  ): ValidationResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        valid: false,
        score: 0,
        reason: 'Session not found',
        flags: ['session_not_found'],
        confidence: 0,
      };
    }

    session.endTime = Date.now();
    const duration = session.endTime - session.startTime;

    const flags: string[] = [];
    let confidence = 1.0;

    // Validation checks
    const checks = [
      this.validateDuration(session, duration),
      this.validateScore(session, finalScore, duration),
      this.validateActions(session),
      this.validateCheckpoints(session),
      this.validateProgression(session),
      this.validateSpeed(session),
    ];

    checks.forEach((check) => {
      if (!check.valid) {
        flags.push(check.flag);
        confidence *= check.confidence;
      }
    });

    // Calculate suspicion score
    const suspicionScore = this.calculateSuspicionScore(flags);
    this.updatePlayerSuspicion(session.playerAddress, suspicionScore);

    // Determine if valid
    const valid = confidence > 0.5 && flags.length < 3;

    // Calculate final score (may be reduced for suspicious activity)
    const validatedScore = valid
      ? Math.floor(finalScore * confidence)
      : 0;

    session.status = valid ? 'completed' : 'invalid';

    return {
      valid,
      score: validatedScore,
      reason: valid ? undefined : 'Failed validation checks',
      flags,
      confidence,
    };
  }

  // Validate game duration
  private validateDuration(
    session: GameSession,
    duration: number
  ): { valid: boolean; flag: string; confidence: number } {
    if (duration < this.MIN_GAME_DURATION) {
      return {
        valid: false,
        flag: 'game_too_short',
        confidence: 0.3,
      };
    }

    if (duration > this.MAX_GAME_DURATION) {
      return {
        valid: false,
        flag: 'game_too_long',
        confidence: 0.7,
      };
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Validate score
  private validateScore(
    session: GameSession,
    finalScore: number,
    duration: number
  ): { valid: boolean; flag: string; confidence: number } {
    const durationSeconds = duration / 1000;
    const scorePerSecond = finalScore / durationSeconds;

    if (scorePerSecond > this.MAX_SCORE_PER_SECOND) {
      return {
        valid: false,
        flag: 'score_too_high',
        confidence: 0.2,
      };
    }

    // Check if score matches actions
    const expectedScore = this.calculateExpectedScore(session);
    const scoreDiff = Math.abs(finalScore - expectedScore);
    const scoreVariance = scoreDiff / expectedScore;

    if (scoreVariance > 0.3) {
      // More than 30% difference
      return {
        valid: false,
        flag: 'score_mismatch',
        confidence: 0.4,
      };
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Validate actions
  private validateActions(
    session: GameSession
  ): { valid: boolean; flag: string; confidence: number } {
    if (session.actions.length === 0) {
      return {
        valid: false,
        flag: 'no_actions',
        confidence: 0.1,
      };
    }

    // Check for action spam
    const actionTimestamps = session.actions.map((a) => a.timestamp);
    const avgTimeBetweenActions =
      (actionTimestamps[actionTimestamps.length - 1]! - actionTimestamps[0]!) /
      actionTimestamps.length;

    if (avgTimeBetweenActions < 50) {
      // Less than 50ms between actions
      return {
        valid: false,
        flag: 'action_spam',
        confidence: 0.3,
      };
    }

    // Verify action hashes
    const invalidHashes = session.actions.filter((action) => {
      const expectedHash = this.hashAction(action);
      return expectedHash !== action.hash;
    });

    if (invalidHashes.length > 0) {
      return {
        valid: false,
        flag: 'invalid_action_hash',
        confidence: 0.1,
      };
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Validate checkpoints
  private validateCheckpoints(
    session: GameSession
  ): { valid: boolean; flag: string; confidence: number } {
    if (session.checkpoints.length === 0) {
      return {
        valid: false,
        flag: 'no_checkpoints',
        confidence: 0.5,
      };
    }

    // Verify checkpoint progression
    for (let i = 1; i < session.checkpoints.length; i++) {
      const prev = session.checkpoints[i - 1]!;
      const curr = session.checkpoints[i]!;

      // Score should increase
      if (curr.score < prev.score) {
        return {
          valid: false,
          flag: 'score_decreased',
          confidence: 0.3,
        };
      }

      // Level should increase or stay same
      if (curr.level < prev.level) {
        return {
          valid: false,
          flag: 'level_decreased',
          confidence: 0.2,
        };
      }

      // Verify checkpoint hash
      const expectedHash = this.hashCheckpoint(curr);
      if (expectedHash !== curr.hash) {
        return {
          valid: false,
          flag: 'invalid_checkpoint_hash',
          confidence: 0.1,
        };
      }
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Validate progression
  private validateProgression(
    session: GameSession
  ): { valid: boolean; flag: string; confidence: number } {
    const kills = session.actions.filter((a) => a.type === 'enemy_killed').length;
    const duration = (session.endTime || Date.now()) - session.startTime;
    const killsPerSecond = kills / (duration / 1000);

    if (killsPerSecond > this.MAX_KILLS_PER_SECOND) {
      return {
        valid: false,
        flag: 'kills_too_fast',
        confidence: 0.3,
      };
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Validate player speed
  private validateSpeed(
    session: GameSession
  ): { valid: boolean; flag: string; confidence: number } {
    const moveActions = session.actions.filter((a) => a.type === 'move');

    for (let i = 1; i < moveActions.length; i++) {
      const prev = moveActions[i - 1]!;
      const curr = moveActions[i]!;

      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      if (timeDiff === 0) continue;

      const distance = this.calculateDistance(
        prev.data.position,
        curr.data.position
      );
      const speed = distance / timeDiff;

      if (speed > this.MAX_SPEED) {
        return {
          valid: false,
          flag: 'speed_too_high',
          confidence: 0.2,
        };
      }
    }

    return { valid: true, flag: '', confidence: 1.0 };
  }

  // Calculate expected score from actions
  private calculateExpectedScore(session: GameSession): number {
    let score = 0;

    session.actions.forEach((action) => {
      switch (action.type) {
        case 'enemy_killed':
          score += action.data.points || 100;
          break;
        case 'item_collected':
          score += action.data.points || 10;
          break;
        case 'level_complete':
          score += action.data.bonus || 500;
          break;
      }
    });

    return score;
  }

  // Calculate suspicion score
  private calculateSuspicionScore(flags: string[]): number {
    const weights: Record<string, number> = {
      game_too_short: 5,
      score_too_high: 10,
      score_mismatch: 8,
      no_actions: 10,
      action_spam: 7,
      invalid_action_hash: 10,
      no_checkpoints: 3,
      score_decreased: 9,
      invalid_checkpoint_hash: 10,
      kills_too_fast: 6,
      speed_too_high: 8,
    };

    return flags.reduce((sum, flag) => sum + (weights[flag] || 5), 0);
  }

  // Update player suspicion
  private updatePlayerSuspicion(playerAddress: string, suspicionScore: number) {
    const current = this.suspiciousPlayers.get(playerAddress) || 0;
    const updated = current + suspicionScore;

    this.suspiciousPlayers.set(playerAddress, updated);

    // Decay suspicion over time (not implemented here)
  }

  // Get player suspicion level
  getPlayerSuspicion(playerAddress: string): {
    score: number;
    level: 'clean' | 'suspicious' | 'flagged' | 'banned';
  } {
    const score = this.suspiciousPlayers.get(playerAddress) || 0;

    let level: 'clean' | 'suspicious' | 'flagged' | 'banned';
    if (score < 10) level = 'clean';
    else if (score < 30) level = 'suspicious';
    else if (score < 50) level = 'flagged';
    else level = 'banned';

    return { score, level };
  }

  // Hash functions
  private hashAction(action: Omit<GameAction, 'hash'>): string {
    const data = JSON.stringify({
      timestamp: action.timestamp,
      type: action.type,
      data: action.data,
    });
    return this.simpleHash(data);
  }

  private hashCheckpoint(checkpoint: Omit<GameCheckpoint, 'hash'>): string {
    const data = JSON.stringify({
      timestamp: checkpoint.timestamp,
      level: checkpoint.level,
      score: checkpoint.score,
      health: checkpoint.health,
      position: checkpoint.position,
      enemiesKilled: checkpoint.enemiesKilled,
      itemsCollected: checkpoint.itemsCollected,
    });
    return this.simpleHash(data);
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  private calculateDistance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private generateSeed(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Get session
  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get validation statistics
  getValidationStats(): {
    totalSessions: number;
    validSessions: number;
    invalidSessions: number;
    suspiciousPlayers: number;
    flaggedPlayers: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const validSessions = sessions.filter((s) => s.status === 'completed').length;
    const invalidSessions = sessions.filter((s) => s.status === 'invalid').length;

    let suspiciousPlayers = 0;
    let flaggedPlayers = 0;

    this.suspiciousPlayers.forEach((score) => {
      if (score >= 10 && score < 30) suspiciousPlayers++;
      if (score >= 30) flaggedPlayers++;
    });

    return {
      totalSessions: sessions.length,
      validSessions,
      invalidSessions,
      suspiciousPlayers,
      flaggedPlayers,
    };
  }
}

export const serverValidator = new ServerValidator();
