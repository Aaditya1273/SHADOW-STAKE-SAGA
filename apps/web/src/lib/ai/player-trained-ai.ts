// Player-Trained AI System - Collective Learning from All Players

export interface PlayerDataPoint {
  playerId: string;
  timestamp: number;
  level: number;
  action: string;
  context: {
    enemyType?: string;
    bossPhase?: number;
    playerHealth: number;
    enemyHealth?: number;
    position: { x: number; y: number };
  };
  outcome: {
    success: boolean;
    damageDealt?: number;
    damageTaken?: number;
    survived: boolean;
  };
}

export interface AIModel {
  id: string;
  name: string;
  type: 'enemy_behavior' | 'boss_strategy' | 'dungeon_layout' | 'loot_distribution';
  version: number;
  trainingData: PlayerDataPoint[];
  weights: Map<string, number>;
  accuracy: number;
  lastTrained: number;
  trainingIterations: number;
}

export interface PredictionResult {
  action: string;
  confidence: number;
  alternatives: Array<{
    action: string;
    confidence: number;
  }>;
  reasoning: string;
}

export class PlayerTrainedAI {
  private models: Map<string, AIModel>;
  private trainingQueue: PlayerDataPoint[];
  private globalDataset: PlayerDataPoint[];
  private isTraining: boolean;

  constructor() {
    this.models = new Map();
    this.trainingQueue = [];
    this.globalDataset = [];
    this.isTraining = false;
    this.initializeModels();
  }

  private initializeModels() {
    // Enemy Behavior Model
    this.models.set('enemy_behavior', {
      id: 'enemy_behavior',
      name: 'Enemy Behavior Predictor',
      type: 'enemy_behavior',
      version: 1,
      trainingData: [],
      weights: new Map([
        ['aggression', 0.5],
        ['retreat', 0.3],
        ['flank', 0.2],
      ]),
      accuracy: 0.5,
      lastTrained: Date.now(),
      trainingIterations: 0,
    });

    // Boss Strategy Model
    this.models.set('boss_strategy', {
      id: 'boss_strategy',
      name: 'Boss Strategy Optimizer',
      type: 'boss_strategy',
      version: 1,
      trainingData: [],
      weights: new Map([
        ['aoe_attack', 0.4],
        ['single_target', 0.3],
        ['defensive', 0.3],
      ]),
      accuracy: 0.5,
      lastTrained: Date.now(),
      trainingIterations: 0,
    });

    // Dungeon Layout Model
    this.models.set('dungeon_layout', {
      id: 'dungeon_layout',
      name: 'Dungeon Layout Generator',
      type: 'dungeon_layout',
      version: 1,
      trainingData: [],
      weights: new Map([
        ['open_room', 0.4],
        ['corridor', 0.3],
        ['maze', 0.3],
      ]),
      accuracy: 0.5,
      lastTrained: Date.now(),
      trainingIterations: 0,
    });

    // Loot Distribution Model
    this.models.set('loot_distribution', {
      id: 'loot_distribution',
      name: 'Loot Distribution Optimizer',
      type: 'loot_distribution',
      version: 1,
      trainingData: [],
      weights: new Map([
        ['weapon', 0.3],
        ['armor', 0.3],
        ['potion', 0.2],
        ['gold', 0.2],
      ]),
      accuracy: 0.5,
      lastTrained: Date.now(),
      trainingIterations: 0,
    });
  }

  // Submit player data for training
  submitPlayerData(dataPoint: PlayerDataPoint) {
    this.trainingQueue.push(dataPoint);
    this.globalDataset.push(dataPoint);

    // Keep dataset manageable
    if (this.globalDataset.length > 100000) {
      this.globalDataset.shift();
    }

    // Auto-train when enough data accumulated
    if (this.trainingQueue.length >= 1000 && !this.isTraining) {
      this.trainModels();
    }
  }

  // Train all models
  async trainModels() {
    if (this.isTraining) return;

    this.isTraining = true;
    console.log('Starting AI training with', this.trainingQueue.length, 'data points');

    try {
      // Train each model
      for (const [modelId, model] of this.models.entries()) {
        await this.trainModel(modelId);
      }

      // Clear training queue
      this.trainingQueue = [];
    } finally {
      this.isTraining = false;
    }
  }

  // Train specific model
  private async trainModel(modelId: string) {
    const model = this.models.get(modelId);
    if (!model) return;

    // Filter relevant data
    const relevantData = this.filterRelevantData(model);

    if (relevantData.length < 100) {
      console.log(`Not enough data for ${modelId}, skipping...`);
      return;
    }

    // Add to training data
    model.trainingData.push(...relevantData);

    // Keep training data manageable
    if (model.trainingData.length > 10000) {
      model.trainingData = model.trainingData.slice(-10000);
    }

    // Perform training (simplified neural network)
    const learningRate = 0.01;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Sample batch
      const batchSize = Math.min(32, relevantData.length);
      const batch = this.sampleBatch(relevantData, batchSize);

      // Update weights based on outcomes
      batch.forEach((dataPoint) => {
        const action = dataPoint.action;
        const success = dataPoint.outcome.success ? 1 : 0;

        // Get current weight
        const currentWeight = model.weights.get(action) || 0.5;

        // Update weight (gradient descent)
        const error = success - currentWeight;
        const newWeight = currentWeight + learningRate * error;

        model.weights.set(action, Math.max(0.1, Math.min(1.0, newWeight)));
      });
    }

    // Calculate accuracy
    model.accuracy = this.calculateAccuracy(model, relevantData);
    model.lastTrained = Date.now();
    model.trainingIterations++;
    model.version++;

    console.log(
      `Trained ${modelId}: v${model.version}, accuracy: ${(model.accuracy * 100).toFixed(1)}%`
    );
  }

  // Filter data relevant to model
  private filterRelevantData(model: AIModel): PlayerDataPoint[] {
    return this.trainingQueue.filter((dataPoint) => {
      switch (model.type) {
        case 'enemy_behavior':
          return dataPoint.context.enemyType !== undefined;

        case 'boss_strategy':
          return dataPoint.context.bossPhase !== undefined;

        case 'dungeon_layout':
          return true; // All data relevant

        case 'loot_distribution':
          return dataPoint.action.includes('loot');

        default:
          return false;
      }
    });
  }

  // Sample random batch
  private sampleBatch(data: PlayerDataPoint[], size: number): PlayerDataPoint[] {
    const batch: PlayerDataPoint[] = [];
    const indices = new Set<number>();

    while (batch.length < size && indices.size < data.length) {
      const index = Math.floor(Math.random() * data.length);
      if (!indices.has(index)) {
        indices.add(index);
        batch.push(data[index]!);
      }
    }

    return batch;
  }

  // Calculate model accuracy
  private calculateAccuracy(
    model: AIModel,
    testData: PlayerDataPoint[]
  ): number {
    if (testData.length === 0) return 0.5;

    let correct = 0;

    testData.forEach((dataPoint) => {
      const prediction = this.predictAction(model, dataPoint.context);
      if (prediction.action === dataPoint.action && dataPoint.outcome.success) {
        correct++;
      }
    });

    return correct / testData.length;
  }

  // Predict best action using trained model
  predictAction(
    model: AIModel,
    context: PlayerDataPoint['context']
  ): PredictionResult {
    // Get all possible actions and their weights
    const actions = Array.from(model.weights.entries()).map(([action, weight]) => ({
      action,
      weight,
    }));

    // Adjust weights based on context
    actions.forEach((actionData) => {
      // Context-specific adjustments
      if (context.playerHealth < 30) {
        if (actionData.action.includes('defensive') || actionData.action.includes('retreat')) {
          actionData.weight *= 1.5;
        }
      }

      if (context.enemyHealth && context.enemyHealth < 20) {
        if (actionData.action.includes('aggressive') || actionData.action.includes('attack')) {
          actionData.weight *= 1.3;
        }
      }
    });

    // Normalize weights to probabilities
    const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
    const probabilities = actions.map((a) => ({
      action: a.action,
      confidence: a.weight / totalWeight,
    }));

    // Sort by confidence
    probabilities.sort((a, b) => b.confidence - a.confidence);

    const bestAction = probabilities[0]!;
    const alternatives = probabilities.slice(1, 4);

    return {
      action: bestAction.action,
      confidence: bestAction.confidence,
      alternatives,
      reasoning: this.generateReasoning(bestAction.action, context, model),
    };
  }

  // Generate human-readable reasoning
  private generateReasoning(
    action: string,
    context: PlayerDataPoint['context'],
    model: AIModel
  ): string {
    const reasons: string[] = [];

    if (context.playerHealth < 30) {
      reasons.push('Low health detected');
    }

    if (context.enemyHealth && context.enemyHealth < 20) {
      reasons.push('Enemy nearly defeated');
    }

    reasons.push(
      `Based on ${model.trainingData.length} player experiences (${(model.accuracy * 100).toFixed(1)}% accuracy)`
    );

    return reasons.join('. ');
  }

  // Get model by ID
  getModel(modelId: string): AIModel | undefined {
    return this.models.get(modelId);
  }

  // Get all models
  getAllModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  // Get training statistics
  getTrainingStats(): {
    totalDataPoints: number;
    queuedDataPoints: number;
    modelsCount: number;
    avgAccuracy: number;
    isTraining: boolean;
  } {
    const models = Array.from(this.models.values());
    const avgAccuracy =
      models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;

    return {
      totalDataPoints: this.globalDataset.length,
      queuedDataPoints: this.trainingQueue.length,
      modelsCount: models.length,
      avgAccuracy,
      isTraining: this.isTraining,
    };
  }

  // Get model insights
  getModelInsights(modelId: string): {
    topActions: Array<{ action: string; weight: number }>;
    dataPoints: number;
    accuracy: number;
    version: number;
  } | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const topActions = Array.from(model.weights.entries())
      .map(([action, weight]) => ({ action, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    return {
      topActions,
      dataPoints: model.trainingData.length,
      accuracy: model.accuracy,
      version: model.version,
    };
  }

  // Export model for sharing
  exportModel(modelId: string): string | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const exportData = {
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      weights: Array.from(model.weights.entries()),
      accuracy: model.accuracy,
      lastTrained: model.lastTrained,
    };

    return JSON.stringify(exportData);
  }

  // Import model
  importModel(modelData: string): boolean {
    try {
      const data = JSON.parse(modelData);
      const model = this.models.get(data.id);

      if (!model) return false;

      // Only import if newer version
      if (data.version > model.version) {
        model.weights = new Map(data.weights);
        model.accuracy = data.accuracy;
        model.version = data.version;
        model.lastTrained = data.lastTrained;

        console.log(`Imported ${data.id} v${data.version}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to import model:', error);
      return false;
    }
  }

  // Simulate player action and learn
  async simulateAndLearn(
    playerId: string,
    level: number,
    action: string,
    context: PlayerDataPoint['context']
  ): Promise<PredictionResult> {
    // Get prediction from model
    const model = this.models.get('enemy_behavior');
    if (!model) {
      return {
        action: 'default',
        confidence: 0.5,
        alternatives: [],
        reasoning: 'No model available',
      };
    }

    const prediction = this.predictAction(model, context);

    // Simulate outcome (in real game, this would be actual outcome)
    const success = Math.random() < prediction.confidence;

    // Submit data point for learning
    this.submitPlayerData({
      playerId,
      timestamp: Date.now(),
      level,
      action,
      context,
      outcome: {
        success,
        damageDealt: success ? Math.floor(Math.random() * 50) : 0,
        damageTaken: success ? 0 : Math.floor(Math.random() * 30),
        survived: success,
      },
    });

    return prediction;
  }
}

export const playerTrainedAI = new PlayerTrainedAI();
