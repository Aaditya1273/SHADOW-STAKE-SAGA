// AI-Generated Dungeons using Neural Networks

export interface DungeonTheme {
  id: string;
  name: string;
  biome: 'crypt' | 'forest' | 'volcano' | 'ice' | 'void' | 'celestial';
  difficulty: number;
  enemyTypes: string[];
  hazards: string[];
  lootTier: number;
}

export interface AIGeneratedRoom {
  id: string;
  type: 'combat' | 'puzzle' | 'treasure' | 'boss' | 'safe' | 'trap';
  layout: number[][]; // 2D grid: 0=wall, 1=floor, 2=door, 3=special
  enemies: Array<{
    type: string;
    position: { x: number; y: number };
    behavior: string;
  }>;
  items: Array<{
    type: string;
    position: { x: number; y: number };
    rarity: string;
  }>;
  hazards: Array<{
    type: string;
    position: { x: number; y: number };
  }>;
  difficulty: number;
  aiScore: number; // How "interesting" the AI thinks this room is
}

export interface DungeonGenerationParams {
  playerLevel: number;
  playerSkills: string[];
  playStyle: 'aggressive' | 'defensive' | 'balanced' | 'stealth';
  previousPerformance: {
    avgClearTime: number;
    deathCount: number;
    preferredEnemies: string[];
    avoidedEnemies: string[];
  };
  desiredDifficulty: number;
  theme?: DungeonTheme;
}

export class AIDungeonGenerator {
  private neuralWeights: Map<string, number[]>;
  private generationHistory: AIGeneratedRoom[];
  private playerProfiles: Map<string, DungeonGenerationParams>;

  constructor() {
    this.neuralWeights = new Map();
    this.generationHistory = [];
    this.playerProfiles = new Map();
    this.initializeNeuralWeights();
  }

  // Initialize neural network weights
  private initializeNeuralWeights() {
    // Simplified neural network weights for room generation
    this.neuralWeights.set('room_type', [0.3, 0.2, 0.15, 0.1, 0.15, 0.1]);
    this.neuralWeights.set('enemy_density', [0.4, 0.3, 0.2, 0.1]);
    this.neuralWeights.set('hazard_placement', [0.5, 0.3, 0.2]);
    this.neuralWeights.set('loot_quality', [0.2, 0.3, 0.3, 0.2]);
    this.neuralWeights.set('layout_complexity', [0.25, 0.35, 0.25, 0.15]);
  }

  // Generate dungeon using AI
  async generateDungeon(
    params: DungeonGenerationParams,
    roomCount: number = 10
  ): Promise<{
    rooms: AIGeneratedRoom[];
    theme: DungeonTheme;
    estimatedDifficulty: number;
    aiConfidence: number;
  }> {
    // Select or generate theme
    const theme = params.theme || this.selectTheme(params);

    // Generate rooms using neural network
    const rooms: AIGeneratedRoom[] = [];

    for (let i = 0; i < roomCount; i++) {
      const room = await this.generateRoom(params, theme, i, roomCount);
      rooms.push(room);
    }

    // Calculate overall difficulty
    const estimatedDifficulty = this.calculateDungeonDifficulty(rooms);

    // Calculate AI confidence in this generation
    const aiConfidence = this.calculateConfidence(rooms, params);

    // Store in history for learning
    this.generationHistory.push(...rooms);

    return {
      rooms,
      theme,
      estimatedDifficulty,
      aiConfidence,
    };
  }

  // Generate a single room using AI
  private async generateRoom(
    params: DungeonGenerationParams,
    theme: DungeonTheme,
    roomIndex: number,
    totalRooms: number
  ): Promise<AIGeneratedRoom> {
    // Determine room type using neural network
    const roomType = this.predictRoomType(params, roomIndex, totalRooms);

    // Generate layout
    const layout = this.generateLayout(roomType, params.desiredDifficulty);

    // Place enemies intelligently
    const enemies = this.placeEnemies(
      layout,
      theme,
      params,
      roomType
    );

    // Place items
    const items = this.placeItems(
      layout,
      theme,
      params.playerLevel,
      roomType
    );

    // Place hazards
    const hazards = this.placeHazards(
      layout,
      theme,
      params.desiredDifficulty
    );

    // Calculate room difficulty
    const difficulty = this.calculateRoomDifficulty(
      enemies,
      hazards,
      layout
    );

    // Calculate AI score (how interesting/balanced this room is)
    const aiScore = this.scoreRoom(enemies, items, hazards, layout, params);

    return {
      id: `room-${Date.now()}-${roomIndex}`,
      type: roomType,
      layout,
      enemies,
      items,
      hazards,
      difficulty,
      aiScore,
    };
  }

  // Predict room type using neural network
  private predictRoomType(
    params: DungeonGenerationParams,
    roomIndex: number,
    totalRooms: number
  ): AIGeneratedRoom['type'] {
    const weights = this.neuralWeights.get('room_type')!;
    const progress = roomIndex / totalRooms;

    // Input features
    const features = [
      params.desiredDifficulty / 10,
      progress,
      params.previousPerformance.deathCount / 10,
      params.playStyle === 'aggressive' ? 1 : 0,
      params.playStyle === 'defensive' ? 1 : 0,
      params.playStyle === 'stealth' ? 1 : 0,
    ];

    // Simple neural network forward pass
    let scores = {
      combat: features[0] * weights[0]! + features[3] * 0.5,
      puzzle: features[1] * weights[1]! + features[4] * 0.3,
      treasure: features[2] * weights[2]! + progress * 0.4,
      boss: progress > 0.8 ? weights[3]! * 2 : 0,
      safe: features[2] > 0.5 ? weights[4]! : 0,
      trap: features[0] * weights[5]! + features[5] * 0.6,
    };

    // Boss room at the end
    if (roomIndex === totalRooms - 1) {
      return 'boss';
    }

    // Safe room after high death count
    if (params.previousPerformance.deathCount > 5 && Math.random() < 0.3) {
      return 'safe';
    }

    // Select highest scoring type
    return Object.entries(scores).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0] as AIGeneratedRoom['type'];
  }

  // Generate room layout
  private generateLayout(
    roomType: AIGeneratedRoom['type'],
    difficulty: number
  ): number[][] {
    const size = Math.floor(10 + difficulty * 2);
    const layout: number[][] = [];

    // Initialize with walls
    for (let y = 0; y < size; y++) {
      layout[y] = [];
      for (let x = 0; x < size; x++) {
        layout[y]![x] = 0; // Wall
      }
    }

    // Generate floor using cellular automata
    const floorChance = roomType === 'boss' ? 0.6 : 0.5;

    // Random initial state
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        layout[y]![x] = Math.random() < floorChance ? 1 : 0;
      }
    }

    // Cellular automata iterations
    for (let iter = 0; iter < 3; iter++) {
      const newLayout = layout.map((row) => [...row]);

      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const neighbors = this.countNeighbors(layout, x, y);

          if (layout[y]![x] === 1) {
            // Floor
            newLayout[y]![x] = neighbors >= 4 ? 1 : 0;
          } else {
            // Wall
            newLayout[y]![x] = neighbors >= 5 ? 1 : 0;
          }
        }
      }

      layout.splice(0, layout.length, ...newLayout);
    }

    // Add doors
    layout[0]![Math.floor(size / 2)] = 2; // Top door
    layout[size - 1]![Math.floor(size / 2)] = 2; // Bottom door

    return layout;
  }

  private countNeighbors(layout: number[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (layout[y + dy]?.[x + dx] === 1) count++;
      }
    }
    return count;
  }

  // Place enemies intelligently
  private placeEnemies(
    layout: number[][],
    theme: DungeonTheme,
    params: DungeonGenerationParams,
    roomType: AIGeneratedRoom['type']
  ): AIGeneratedRoom['enemies'] {
    if (roomType === 'safe' || roomType === 'treasure') return [];

    const enemies: AIGeneratedRoom['enemies'] = [];
    const enemyCount = roomType === 'boss' ? 1 : Math.floor(2 + params.desiredDifficulty);

    const floorTiles = this.getFloorTiles(layout);

    for (let i = 0; i < enemyCount && floorTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * floorTiles.length);
      const tile = floorTiles.splice(tileIndex, 1)[0]!;

      // Select enemy type based on player preferences
      const enemyType = this.selectEnemyType(theme, params);

      // Determine behavior based on play style
      const behavior = this.selectEnemyBehavior(params.playStyle);

      enemies.push({
        type: enemyType,
        position: tile,
        behavior,
      });
    }

    return enemies;
  }

  private selectEnemyType(
    theme: DungeonTheme,
    params: DungeonGenerationParams
  ): string {
    // Avoid enemies player struggles with
    const availableEnemies = theme.enemyTypes.filter(
      (e) => !params.previousPerformance.avoidedEnemies.includes(e)
    );

    if (availableEnemies.length === 0) {
      return theme.enemyTypes[0]!;
    }

    // Prefer enemies player is good against (for flow)
    const preferredEnemies = availableEnemies.filter((e) =>
      params.previousPerformance.preferredEnemies.includes(e)
    );

    if (preferredEnemies.length > 0 && Math.random() < 0.6) {
      return preferredEnemies[Math.floor(Math.random() * preferredEnemies.length)]!;
    }

    return availableEnemies[Math.floor(Math.random() * availableEnemies.length)]!;
  }

  private selectEnemyBehavior(
    playStyle: DungeonGenerationParams['playStyle']
  ): string {
    const behaviors: Record<string, string[]> = {
      aggressive: ['defensive', 'ranged', 'support'],
      defensive: ['aggressive', 'flanking', 'burst'],
      balanced: ['balanced', 'adaptive', 'mixed'],
      stealth: ['patrol', 'alert', 'group'],
    };

    const options = behaviors[playStyle] || behaviors.balanced;
    return options[Math.floor(Math.random() * options.length)]!;
  }

  // Place items
  private placeItems(
    layout: number[][],
    theme: DungeonTheme,
    playerLevel: number,
    roomType: AIGeneratedRoom['type']
  ): AIGeneratedRoom['items'] {
    const items: AIGeneratedRoom['items'] = [];
    const itemCount = roomType === 'treasure' ? 5 : roomType === 'boss' ? 3 : 1;

    const floorTiles = this.getFloorTiles(layout);

    for (let i = 0; i < itemCount && floorTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * floorTiles.length);
      const tile = floorTiles.splice(tileIndex, 1)[0]!;

      const rarity = this.selectItemRarity(theme.lootTier, playerLevel);

      items.push({
        type: this.selectItemType(rarity),
        position: tile,
        rarity,
      });
    }

    return items;
  }

  private selectItemRarity(lootTier: number, playerLevel: number): string {
    const rand = Math.random();
    const tierBonus = lootTier * 0.1;

    if (rand < 0.05 + tierBonus) return 'mythic';
    if (rand < 0.15 + tierBonus) return 'legendary';
    if (rand < 0.35 + tierBonus) return 'epic';
    if (rand < 0.65) return 'rare';
    return 'common';
  }

  private selectItemType(rarity: string): string {
    const types = ['weapon', 'armor', 'potion', 'scroll', 'relic'];
    return types[Math.floor(Math.random() * types.length)]!;
  }

  // Place hazards
  private placeHazards(
    layout: number[][],
    theme: DungeonTheme,
    difficulty: number
  ): AIGeneratedRoom['hazards'] {
    const hazards: AIGeneratedRoom['hazards'] = [];
    const hazardCount = Math.floor(difficulty / 2);

    const floorTiles = this.getFloorTiles(layout);

    for (let i = 0; i < hazardCount && floorTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * floorTiles.length);
      const tile = floorTiles.splice(tileIndex, 1)[0]!;

      const hazardType =
        theme.hazards[Math.floor(Math.random() * theme.hazards.length)]!;

      hazards.push({
        type: hazardType,
        position: tile,
      });
    }

    return hazards;
  }

  private getFloorTiles(layout: number[][]): Array<{ x: number; y: number }> {
    const tiles: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y]!.length; x++) {
        if (layout[y]![x] === 1) {
          tiles.push({ x, y });
        }
      }
    }

    return tiles;
  }

  // Calculate room difficulty
  private calculateRoomDifficulty(
    enemies: AIGeneratedRoom['enemies'],
    hazards: AIGeneratedRoom['hazards'],
    layout: number[][]
  ): number {
    const enemyDifficulty = enemies.length * 2;
    const hazardDifficulty = hazards.length * 1.5;
    const layoutComplexity = this.calculateLayoutComplexity(layout);

    return enemyDifficulty + hazardDifficulty + layoutComplexity;
  }

  private calculateLayoutComplexity(layout: number[][]): number {
    let complexity = 0;

    // Count turns and dead ends
    for (let y = 1; y < layout.length - 1; y++) {
      for (let x = 1; x < layout[y]!.length - 1; x++) {
        if (layout[y]![x] === 1) {
          const neighbors = this.countNeighbors(layout, x, y);
          if (neighbors <= 2) complexity += 0.5; // Dead end or corridor
          if (neighbors >= 3) complexity += 0.3; // Junction
        }
      }
    }

    return complexity;
  }

  // Calculate dungeon difficulty
  private calculateDungeonDifficulty(rooms: AIGeneratedRoom[]): number {
    const avgDifficulty =
      rooms.reduce((sum, room) => sum + room.difficulty, 0) / rooms.length;
    return Math.round(avgDifficulty * 10) / 10;
  }

  // Score room quality
  private scoreRoom(
    enemies: AIGeneratedRoom['enemies'],
    items: AIGeneratedRoom['items'],
    hazards: AIGeneratedRoom['hazards'],
    layout: number[][],
    params: DungeonGenerationParams
  ): number {
    let score = 0;

    // Balance score
    const enemyItemRatio = enemies.length / (items.length + 1);
    score += enemyItemRatio > 0.5 && enemyItemRatio < 3 ? 10 : 0;

    // Variety score
    const uniqueEnemies = new Set(enemies.map((e) => e.type)).size;
    score += uniqueEnemies * 5;

    // Layout score
    const layoutComplexity = this.calculateLayoutComplexity(layout);
    score += layoutComplexity;

    // Player preference score
    const preferredEnemyCount = enemies.filter((e) =>
      params.previousPerformance.preferredEnemies.includes(e.type)
    ).length;
    score += preferredEnemyCount * 3;

    return Math.min(100, score);
  }

  // Calculate AI confidence
  private calculateConfidence(
    rooms: AIGeneratedRoom[],
    params: DungeonGenerationParams
  ): number {
    const avgScore = rooms.reduce((sum, room) => sum + room.aiScore, 0) / rooms.length;
    const difficultyMatch = Math.abs(
      this.calculateDungeonDifficulty(rooms) - params.desiredDifficulty
    );

    const confidence = (avgScore / 100) * 0.7 + (1 - difficultyMatch / 10) * 0.3;

    return Math.max(0, Math.min(1, confidence));
  }

  // Select theme based on player
  private selectTheme(params: DungeonGenerationParams): DungeonTheme {
    const themes: DungeonTheme[] = [
      {
        id: 'crypt',
        name: 'Ancient Crypt',
        biome: 'crypt',
        difficulty: 3,
        enemyTypes: ['skeleton', 'ghost', 'zombie', 'necromancer'],
        hazards: ['spike-trap', 'poison-gas', 'curse-zone'],
        lootTier: 2,
      },
      {
        id: 'volcano',
        name: 'Volcanic Depths',
        biome: 'volcano',
        difficulty: 7,
        enemyTypes: ['fire-elemental', 'lava-beast', 'flame-imp'],
        hazards: ['lava-pool', 'fire-geyser', 'heat-wave'],
        lootTier: 4,
      },
      {
        id: 'void',
        name: 'Void Realm',
        biome: 'void',
        difficulty: 9,
        enemyTypes: ['void-spawn', 'shadow-beast', 'eldritch-horror'],
        hazards: ['void-rift', 'madness-zone', 'gravity-well'],
        lootTier: 5,
      },
    ];

    // Select theme matching player level
    return themes.find((t) => Math.abs(t.difficulty - params.playerLevel) < 3) || themes[0]!;
  }

  // Learn from player feedback
  learnFromFeedback(
    roomId: string,
    playerFeedback: {
      enjoyment: number; // 1-10
      difficulty: number; // 1-10
      completed: boolean;
      timeSpent: number;
    }
  ) {
    const room = this.generationHistory.find((r) => r.id === roomId);
    if (!room) return;

    // Adjust neural weights based on feedback
    const learningRate = 0.01;

    if (playerFeedback.enjoyment > 7 && playerFeedback.completed) {
      // Good room, reinforce this pattern
      const weights = this.neuralWeights.get('room_type')!;
      const typeIndex = ['combat', 'puzzle', 'treasure', 'boss', 'safe', 'trap'].indexOf(
        room.type
      );
      if (typeIndex >= 0) {
        weights[typeIndex] = weights[typeIndex]! + learningRate;
      }
    }

    if (playerFeedback.difficulty > 8 && !playerFeedback.completed) {
      // Too hard, reduce difficulty
      const weights = this.neuralWeights.get('enemy_density')!;
      weights[0] = Math.max(0.1, weights[0]! - learningRate);
    }
  }
}

export const aiDungeonGenerator = new AIDungeonGenerator();
