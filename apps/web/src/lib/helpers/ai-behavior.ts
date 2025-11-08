// AI-adaptive enemy behavior system

export interface PlayerBehaviorProfile {
  preferredDistance: 'close' | 'medium' | 'far';
  aggressiveness: number; // 0-1, how often player attacks
  dodgeFrequency: number; // 0-1, how often player dodges
  healingThreshold: number; // HP % when player typically heals
  favoriteWeaponType: string;
  averageSessionTime: number;
  deathCount: number;
}

export interface AdaptiveEnemyBehavior {
  flankingEnabled: boolean;
  retreatWhenLowHP: boolean;
  groupCoordination: boolean;
  predictiveMovement: boolean;
  counterAttackTiming: number;
  adaptationLevel: number; // 0-5, increases with player skill
}

export class AIBehaviorManager {
  private playerProfile: PlayerBehaviorProfile;
  private enemyBehavior: AdaptiveEnemyBehavior;
  private recentPlayerActions: Array<{
    type: 'attack' | 'dodge' | 'heal' | 'move';
    timestamp: number;
    position: { x: number; y: number };
  }>;
  private maxHistorySize = 50;

  constructor() {
    this.playerProfile = {
      preferredDistance: 'close',
      aggressiveness: 0.5,
      dodgeFrequency: 0.3,
      healingThreshold: 30,
      favoriteWeaponType: 'sword',
      averageSessionTime: 0,
      deathCount: 0,
    };

    this.enemyBehavior = {
      flankingEnabled: false,
      retreatWhenLowHP: false,
      groupCoordination: false,
      predictiveMovement: false,
      counterAttackTiming: 0,
      adaptationLevel: 0,
    };

    this.recentPlayerActions = [];
  }

  // Track player actions to build profile
  recordPlayerAction(
    type: 'attack' | 'dodge' | 'heal' | 'move',
    position: { x: number; y: number }
  ) {
    this.recentPlayerActions.push({
      type,
      timestamp: Date.now(),
      position,
    });

    // Keep only recent history
    if (this.recentPlayerActions.length > this.maxHistorySize) {
      this.recentPlayerActions.shift();
    }

    this.updatePlayerProfile();
  }

  // Analyze player behavior and update profile
  private updatePlayerProfile() {
    if (this.recentPlayerActions.length < 10) return;

    const recent = this.recentPlayerActions.slice(-20);
    
    // Calculate aggressiveness (attack frequency)
    const attacks = recent.filter((a) => a.type === 'attack').length;
    this.playerProfile.aggressiveness = attacks / recent.length;

    // Calculate dodge frequency
    const dodges = recent.filter((a) => a.type === 'dodge').length;
    this.playerProfile.dodgeFrequency = dodges / recent.length;

    // Determine preferred distance (analyze movement patterns)
    const movements = recent.filter((a) => a.type === 'move');
    if (movements.length > 5) {
      const avgDistance = this.calculateAverageDistance(movements);
      if (avgDistance < 100) {
        this.playerProfile.preferredDistance = 'close';
      } else if (avgDistance < 200) {
        this.playerProfile.preferredDistance = 'medium';
      } else {
        this.playerProfile.preferredDistance = 'far';
      }
    }

    // Update adaptation level based on player skill
    this.updateAdaptationLevel();
  }

  private calculateAverageDistance(
    movements: Array<{ position: { x: number; y: number } }>
  ): number {
    if (movements.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1]!.position;
      const curr = movements[i]!.position;
      totalDistance += Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
    }

    return totalDistance / (movements.length - 1);
  }

  private updateAdaptationLevel() {
    // Increase adaptation based on player skill indicators
    let skillScore = 0;

    // High aggressiveness + low death count = skilled player
    if (this.playerProfile.aggressiveness > 0.6) skillScore += 1;
    if (this.playerProfile.dodgeFrequency > 0.4) skillScore += 1;
    if (this.playerProfile.deathCount < 3) skillScore += 1;
    if (this.playerProfile.averageSessionTime > 300) skillScore += 1; // 5+ min sessions

    this.enemyBehavior.adaptationLevel = Math.min(skillScore, 5);

    // Enable advanced behaviors based on adaptation level
    this.enemyBehavior.flankingEnabled = this.enemyBehavior.adaptationLevel >= 2;
    this.enemyBehavior.retreatWhenLowHP = this.enemyBehavior.adaptationLevel >= 2;
    this.enemyBehavior.groupCoordination = this.enemyBehavior.adaptationLevel >= 3;
    this.enemyBehavior.predictiveMovement = this.enemyBehavior.adaptationLevel >= 4;
    this.enemyBehavior.counterAttackTiming = this.enemyBehavior.adaptationLevel * 200;
  }

  // Get AI decision for enemy movement
  getEnemyMovementStrategy(
    enemyPos: { x: number; y: number },
    playerPos: { x: number; y: number },
    enemyHealth: number,
    maxHealth: number
  ): {
    shouldFlank: boolean;
    shouldRetreat: boolean;
    predictedPlayerPos: { x: number; y: number } | null;
  } {
    const healthPercent = (enemyHealth / maxHealth) * 100;

    // Retreat if low HP and behavior enabled
    const shouldRetreat =
      this.enemyBehavior.retreatWhenLowHP && healthPercent < 25;

    // Flank if player is aggressive
    const shouldFlank =
      this.enemyBehavior.flankingEnabled &&
      this.playerProfile.aggressiveness > 0.6;

    // Predict player position based on recent movement
    let predictedPlayerPos = null;
    if (this.enemyBehavior.predictiveMovement) {
      predictedPlayerPos = this.predictPlayerPosition(playerPos);
    }

    return { shouldFlank, shouldRetreat, predictedPlayerPos };
  }

  private predictPlayerPosition(currentPos: {
    x: number;
    y: number;
  }): { x: number; y: number } {
    const recentMoves = this.recentPlayerActions
      .filter((a) => a.type === 'move')
      .slice(-5);

    if (recentMoves.length < 2) return currentPos;

    // Calculate average velocity
    let totalVelX = 0;
    let totalVelY = 0;

    for (let i = 1; i < recentMoves.length; i++) {
      const prev = recentMoves[i - 1]!;
      const curr = recentMoves[i]!;
      const dt = (curr.timestamp - prev.timestamp) / 1000; // seconds

      if (dt > 0) {
        totalVelX += (curr.position.x - prev.position.x) / dt;
        totalVelY += (curr.position.y - prev.position.y) / dt;
      }
    }

    const avgVelX = totalVelX / (recentMoves.length - 1);
    const avgVelY = totalVelY / (recentMoves.length - 1);

    // Predict position 0.5 seconds ahead
    return {
      x: currentPos.x + avgVelX * 0.5,
      y: currentPos.y + avgVelY * 0.5,
    };
  }

  // Get attack timing based on player patterns
  getOptimalAttackTiming(playerHealth: number, maxHealth: number): number {
    const healthPercent = (playerHealth / maxHealth) * 100;

    // Attack more aggressively if player is low HP
    if (healthPercent < this.playerProfile.healingThreshold) {
      return 1000; // Fast attacks
    }

    // Counter-attack timing based on player dodge frequency
    if (this.playerProfile.dodgeFrequency > 0.5) {
      return 2000 + this.enemyBehavior.counterAttackTiming; // Wait for dodge cooldown
    }

    return 1500; // Normal timing
  }

  // Coordinate group attacks
  shouldCoordinateAttack(
    nearbyEnemies: number,
    playerHealth: number,
    maxHealth: number
  ): boolean {
    if (!this.enemyBehavior.groupCoordination) return false;

    const healthPercent = (playerHealth / maxHealth) * 100;

    // Coordinate if player is vulnerable and multiple enemies nearby
    return nearbyEnemies >= 2 && healthPercent < 50;
  }

  // Record player death for adaptation
  recordPlayerDeath() {
    this.playerProfile.deathCount++;
    this.updateAdaptationLevel();
  }

  // Update session time
  updateSessionTime(seconds: number) {
    this.playerProfile.averageSessionTime = seconds;
    this.updateAdaptationLevel();
  }

  // Get current behavior settings (for debugging/display)
  getBehaviorSettings(): AdaptiveEnemyBehavior {
    return { ...this.enemyBehavior };
  }

  getPlayerProfile(): PlayerBehaviorProfile {
    return { ...this.playerProfile };
  }

  // Reset for new game
  reset() {
    this.recentPlayerActions = [];
    this.playerProfile.deathCount = 0;
    this.playerProfile.averageSessionTime = 0;
    this.enemyBehavior.adaptationLevel = 0;
    this.updateAdaptationLevel();
  }

  // Difficulty scaling based on player performance
  getDifficultyMultiplier(): number {
    // Scale enemy stats based on adaptation level
    return 1 + this.enemyBehavior.adaptationLevel * 0.1; // 1.0 to 1.5x
  }
}

// Singleton instance
export const aiBehaviorManager = new AIBehaviorManager();
