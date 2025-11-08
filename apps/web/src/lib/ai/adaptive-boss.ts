// AI-Adaptive Boss System - Learns from player behavior

export interface BossAIState {
  bossId: string;
  currentPhase: number;
  health: number;
  maxHealth: number;
  playerBehavior: PlayerBehaviorProfile;
  adaptations: BossAdaptation[];
  learningRate: number;
  aggressionLevel: number;
  strategyWeights: Map<string, number>;
}

export interface PlayerBehaviorProfile {
  avgDistanceFromBoss: number;
  attackFrequency: number;
  dodgeFrequency: number;
  healUsage: number;
  abilityUsage: Map<string, number>;
  movementPattern: 'circle' | 'backpedal' | 'aggressive' | 'erratic';
  reactionTime: number; // milliseconds
  predictability: number; // 0-1, how predictable player is
}

export interface BossAdaptation {
  type: 'attack_pattern' | 'movement' | 'ability' | 'defense' | 'aggression';
  trigger: string;
  effect: string;
  effectiveness: number;
  timesUsed: number;
}

export interface BossStrategy {
  id: string;
  name: string;
  conditions: Array<{
    metric: keyof PlayerBehaviorProfile;
    operator: '>' | '<' | '==' | '>=';
    value: number;
  }>;
  actions: Array<{
    type: string;
    params: any;
  }>;
  priority: number;
}

export class AdaptiveBossAI {
  private bossStates: Map<string, BossAIState>;
  private strategies: BossStrategy[];
  private behaviorHistory: Map<string, PlayerBehaviorProfile[]>;

  constructor() {
    this.bossStates = new Map();
    this.strategies = [];
    this.behaviorHistory = new Map();
    this.initializeStrategies();
  }

  // Initialize boss AI strategies
  private initializeStrategies() {
    this.strategies = [
      // Counter ranged players
      {
        id: 'close-gap',
        name: 'Close the Gap',
        conditions: [
          { metric: 'avgDistanceFromBoss', operator: '>', value: 200 },
        ],
        actions: [
          { type: 'dash', params: { speed: 2.0, frequency: 'high' } },
          { type: 'ranged-attack', params: { projectiles: 3 } },
        ],
        priority: 8,
      },

      // Counter aggressive melee
      {
        id: 'defensive-counter',
        name: 'Defensive Counter',
        conditions: [
          { metric: 'avgDistanceFromBoss', operator: '<', value: 100 },
          { metric: 'attackFrequency', operator: '>', value: 2 },
        ],
        actions: [
          { type: 'counter-attack', params: { damage: 1.5 } },
          { type: 'knockback', params: { distance: 150 } },
        ],
        priority: 9,
      },

      // Counter dodge-heavy players
      {
        id: 'aoe-spam',
        name: 'AOE Spam',
        conditions: [{ metric: 'dodgeFrequency', operator: '>', value: 3 }],
        actions: [
          { type: 'aoe-attack', params: { radius: 200, count: 3 } },
          { type: 'ground-hazard', params: { duration: 5000 } },
        ],
        priority: 7,
      },

      // Counter predictable movement
      {
        id: 'prediction-attack',
        name: 'Prediction Attack',
        conditions: [{ metric: 'predictability', operator: '>', value: 0.7 }],
        actions: [
          { type: 'predicted-strike', params: { leadTime: 500 } },
          { type: 'trap-placement', params: { ahead: true } },
        ],
        priority: 10,
      },

      // Counter heal spamming
      {
        id: 'burst-damage',
        name: 'Burst Damage',
        conditions: [{ metric: 'healUsage', operator: '>', value: 3 }],
        actions: [
          { type: 'combo-attack', params: { hits: 5, speed: 1.5 } },
          { type: 'heal-block', params: { duration: 3000 } },
        ],
        priority: 8,
      },
    ];
  }

  // Initialize boss AI state
  initializeBoss(
    bossId: string,
    maxHealth: number
  ): BossAIState {
    const state: BossAIState = {
      bossId,
      currentPhase: 1,
      health: maxHealth,
      maxHealth,
      playerBehavior: {
        avgDistanceFromBoss: 0,
        attackFrequency: 0,
        dodgeFrequency: 0,
        healUsage: 0,
        abilityUsage: new Map(),
        movementPattern: 'balanced',
        reactionTime: 500,
        predictability: 0.5,
      },
      adaptations: [],
      learningRate: 0.1,
      aggressionLevel: 5,
      strategyWeights: new Map(),
    };

    // Initialize strategy weights
    this.strategies.forEach((strategy) => {
      state.strategyWeights.set(strategy.id, 1.0);
    });

    this.bossStates.set(bossId, state);
    return state;
  }

  // Update player behavior tracking
  updatePlayerBehavior(
    bossId: string,
    action: {
      type: 'attack' | 'dodge' | 'heal' | 'ability' | 'move';
      position?: { x: number; y: number };
      bossPosition?: { x: number; y: number };
      abilityId?: string;
      timestamp: number;
    }
  ) {
    const state = this.bossStates.get(bossId);
    if (!state) return;

    const behavior = state.playerBehavior;

    // Update metrics based on action
    switch (action.type) {
      case 'attack':
        behavior.attackFrequency++;
        break;

      case 'dodge':
        behavior.dodgeFrequency++;
        break;

      case 'heal':
        behavior.healUsage++;
        break;

      case 'ability':
        if (action.abilityId) {
          const count = behavior.abilityUsage.get(action.abilityId) || 0;
          behavior.abilityUsage.set(action.abilityId, count + 1);
        }
        break;

      case 'move':
        if (action.position && action.bossPosition) {
          const distance = this.calculateDistance(
            action.position,
            action.bossPosition
          );
          behavior.avgDistanceFromBoss =
            (behavior.avgDistanceFromBoss + distance) / 2;
        }
        break;
    }

    // Update movement pattern
    behavior.movementPattern = this.detectMovementPattern(bossId);

    // Update predictability
    behavior.predictability = this.calculatePredictability(bossId);

    // Store in history
    const history = this.behaviorHistory.get(bossId) || [];
    history.push({ ...behavior });
    if (history.length > 100) history.shift(); // Keep last 100
    this.behaviorHistory.set(bossId, history);
  }

  // Detect player movement pattern
  private detectMovementPattern(
    bossId: string
  ): PlayerBehaviorProfile['movementPattern'] {
    const history = this.behaviorHistory.get(bossId);
    if (!history || history.length < 10) return 'balanced';

    const recent = history.slice(-10);
    const avgDistance =
      recent.reduce((sum, b) => sum + b.avgDistanceFromBoss, 0) / recent.length;

    if (avgDistance > 250) return 'backpedal';
    if (avgDistance < 100) return 'aggressive';

    // Check for circular movement (simplified)
    const distanceVariance =
      recent.reduce(
        (sum, b) => sum + Math.abs(b.avgDistanceFromBoss - avgDistance),
        0
      ) / recent.length;

    if (distanceVariance < 30) return 'circle';
    return 'erratic';
  }

  // Calculate player predictability
  private calculatePredictability(bossId: string): number {
    const history = this.behaviorHistory.get(bossId);
    if (!history || history.length < 20) return 0.5;

    const recent = history.slice(-20);

    // Check consistency in behavior
    const attackVariance = this.calculateVariance(
      recent.map((b) => b.attackFrequency)
    );
    const dodgeVariance = this.calculateVariance(
      recent.map((b) => b.dodgeFrequency)
    );

    // Lower variance = more predictable
    const predictability = 1 - Math.min(1, (attackVariance + dodgeVariance) / 10);

    return predictability;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Select best strategy based on player behavior
  selectStrategy(bossId: string): BossStrategy | null {
    const state = this.bossStates.get(bossId);
    if (!state) return null;

    const behavior = state.playerBehavior;

    // Evaluate all strategies
    const scores = this.strategies.map((strategy) => {
      let score = strategy.priority;

      // Check if conditions are met
      const conditionsMet = strategy.conditions.every((condition) => {
        const value = behavior[condition.metric];
        const numValue = typeof value === 'number' ? value : 0;

        switch (condition.operator) {
          case '>':
            return numValue > condition.value;
          case '<':
            return numValue < condition.value;
          case '==':
            return numValue === condition.value;
          case '>=':
            return numValue >= condition.value;
          default:
            return false;
        }
      });

      if (!conditionsMet) return 0;

      // Apply learned weights
      const weight = state.strategyWeights.get(strategy.id) || 1.0;
      score *= weight;

      return score;
    });

    // Select highest scoring strategy
    const maxScore = Math.max(...scores);
    if (maxScore === 0) return null;

    const selectedIndex = scores.indexOf(maxScore);
    return this.strategies[selectedIndex] || null;
  }

  // Execute boss action
  executeBossAction(
    bossId: string,
    strategy: BossStrategy
  ): Array<{
    type: string;
    params: any;
  }> {
    const state = this.bossStates.get(bossId);
    if (!state) return [];

    // Record adaptation
    const adaptation: BossAdaptation = {
      type: 'attack_pattern',
      trigger: strategy.name,
      effect: strategy.actions.map((a) => a.type).join(', '),
      effectiveness: 0,
      timesUsed: 1,
    };

    // Check if we've used this adaptation before
    const existing = state.adaptations.find(
      (a) => a.trigger === adaptation.trigger
    );

    if (existing) {
      existing.timesUsed++;
    } else {
      state.adaptations.push(adaptation);
    }

    return strategy.actions;
  }

  // Learn from strategy effectiveness
  learnFromOutcome(
    bossId: string,
    strategyId: string,
    outcome: {
      damageDealt: number;
      playerHit: boolean;
      playerDodged: boolean;
    }
  ) {
    const state = this.bossStates.get(bossId);
    if (!state) return;

    const currentWeight = state.strategyWeights.get(strategyId) || 1.0;

    // Calculate effectiveness
    let effectiveness = 0;
    if (outcome.playerHit) effectiveness += 0.5;
    if (outcome.damageDealt > 0) effectiveness += outcome.damageDealt / 100;
    if (!outcome.playerDodged) effectiveness += 0.3;

    // Update strategy weight using learning rate
    const newWeight =
      currentWeight + state.learningRate * (effectiveness - currentWeight);
    state.strategyWeights.set(strategyId, Math.max(0.1, Math.min(3.0, newWeight)));

    // Update adaptation effectiveness
    const adaptation = state.adaptations.find((a) =>
      a.trigger.includes(strategyId)
    );
    if (adaptation) {
      adaptation.effectiveness =
        (adaptation.effectiveness * (adaptation.timesUsed - 1) + effectiveness) /
        adaptation.timesUsed;
    }
  }

  // Phase transition with adaptation
  transitionPhase(bossId: string, newPhase: number) {
    const state = this.bossStates.get(bossId);
    if (!state) return;

    state.currentPhase = newPhase;

    // Increase aggression in later phases
    state.aggressionLevel = Math.min(10, 5 + newPhase * 2);

    // Increase learning rate in later phases
    state.learningRate = Math.min(0.3, 0.1 + newPhase * 0.05);

    // Reset some counters
    state.playerBehavior.attackFrequency = 0;
    state.playerBehavior.dodgeFrequency = 0;
    state.playerBehavior.healUsage = 0;
  }

  // Get boss difficulty adjustment
  getDifficultyMultiplier(bossId: string): number {
    const state = this.bossStates.get(bossId);
    if (!state) return 1.0;

    // Increase difficulty based on adaptations
    const adaptationBonus = Math.min(0.5, state.adaptations.length * 0.05);

    // Increase based on phase
    const phaseBonus = (state.currentPhase - 1) * 0.2;

    return 1.0 + adaptationBonus + phaseBonus;
  }

  // Get AI insights for debugging/display
  getAIInsights(bossId: string): {
    currentStrategy: string;
    playerProfile: string;
    adaptations: string[];
    difficulty: number;
  } | null {
    const state = this.bossStates.get(bossId);
    if (!state) return null;

    const strategy = this.selectStrategy(bossId);

    return {
      currentStrategy: strategy?.name || 'None',
      playerProfile: `${state.playerBehavior.movementPattern} (${Math.round(state.playerBehavior.predictability * 100)}% predictable)`,
      adaptations: state.adaptations.map(
        (a) => `${a.trigger}: ${Math.round(a.effectiveness * 100)}% effective`
      ),
      difficulty: this.getDifficultyMultiplier(bossId),
    };
  }

  private calculateDistance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  }
}

export const adaptiveBossAI = new AdaptiveBossAI();
