// Cheat Detection System

export interface CheatPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: (data: GameData) => boolean;
  confidence: number;
}

export interface GameData {
  sessionId: string;
  playerAddress: string;
  duration: number;
  score: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  itemsCollected: number;
  actions: number;
  avgActionInterval: number;
  maxSpeed: number;
  positions: Array<{ x: number; y: number; timestamp: number }>;
}

export interface CheatDetection {
  detected: boolean;
  patterns: string[];
  severity: 'clean' | 'suspicious' | 'likely_cheating' | 'confirmed_cheating';
  confidence: number;
  details: string[];
}

export class CheatDetector {
  private patterns: CheatPattern[];
  private detectionHistory: Map<string, CheatDetection[]>;

  constructor() {
    this.patterns = [];
    this.detectionHistory = new Map();
    this.initializePatterns();
  }

  private initializePatterns() {
    // Pattern 1: Impossible Score
    this.patterns.push({
      id: 'impossible_score',
      name: 'Impossible Score',
      description: 'Score too high for game duration',
      severity: 'critical',
      detectionMethod: (data) => {
        const maxScorePerSecond = 100;
        const durationSeconds = data.duration / 1000;
        const maxPossibleScore = durationSeconds * maxScorePerSecond;
        return data.score > maxPossibleScore * 1.5;
      },
      confidence: 0.95,
    });

    // Pattern 2: Perfect Play
    this.patterns.push({
      id: 'perfect_play',
      name: 'Perfect Play',
      description: 'No deaths with extremely high score',
      severity: 'high',
      detectionMethod: (data) => {
        return data.deaths === 0 && data.score > 10000 && data.duration < 300000;
      },
      confidence: 0.7,
    });

    // Pattern 3: Speed Hacking
    this.patterns.push({
      id: 'speed_hack',
      name: 'Speed Hacking',
      description: 'Movement speed exceeds maximum',
      severity: 'critical',
      detectionMethod: (data) => {
        return data.maxSpeed > 500; // Max speed threshold
      },
      confidence: 0.9,
    });

    // Pattern 4: Bot-like Behavior
    this.patterns.push({
      id: 'bot_behavior',
      name: 'Bot-like Behavior',
      description: 'Actions too consistent and mechanical',
      severity: 'high',
      detectionMethod: (data) => {
        // Check if action intervals are too consistent
        const variance = this.calculateVariance(data);
        return variance < 10 && data.actions > 100;
      },
      confidence: 0.75,
    });

    // Pattern 5: Instant Kills
    this.patterns.push({
      id: 'instant_kills',
      name: 'Instant Kills',
      description: 'Kills enemies too quickly',
      severity: 'critical',
      detectionMethod: (data) => {
        const killsPerSecond = data.kills / (data.duration / 1000);
        return killsPerSecond > 5;
      },
      confidence: 0.85,
    });

    // Pattern 6: No Damage Taken
    this.patterns.push({
      id: 'invincibility',
      name: 'Invincibility',
      description: 'Takes no damage despite many enemies',
      severity: 'critical',
      detectionMethod: (data) => {
        return data.damageTaken === 0 && data.kills > 50;
      },
      confidence: 0.9,
    });

    // Pattern 7: Teleportation
    this.patterns.push({
      id: 'teleportation',
      name: 'Teleportation',
      description: 'Instant position changes',
      severity: 'critical',
      detectionMethod: (data) => {
        return this.detectTeleportation(data.positions);
      },
      confidence: 0.95,
    });

    // Pattern 8: Impossible Damage
    this.patterns.push({
      id: 'damage_hack',
      name: 'Damage Hack',
      description: 'Damage dealt exceeds possible values',
      severity: 'critical',
      detectionMethod: (data) => {
        const avgDamagePerKill = data.damageDealt / (data.kills || 1);
        return avgDamagePerKill > 1000; // Max damage per kill
      },
      confidence: 0.85,
    });

    // Pattern 9: Action Spam
    this.patterns.push({
      id: 'action_spam',
      name: 'Action Spam',
      description: 'Too many actions in short time',
      severity: 'medium',
      detectionMethod: (data) => {
        return data.avgActionInterval < 50; // Less than 50ms between actions
      },
      confidence: 0.7,
    });

    // Pattern 10: Memory Editing
    this.patterns.push({
      id: 'memory_edit',
      name: 'Memory Editing',
      description: 'Stats changed without valid actions',
      severity: 'critical',
      detectionMethod: (data) => {
        // Check if score/kills don't match actions
        const expectedScore = data.kills * 100 + data.itemsCollected * 10;
        const scoreDiff = Math.abs(data.score - expectedScore);
        return scoreDiff > expectedScore * 0.5;
      },
      confidence: 0.8,
    });
  }

  // Analyze game data for cheats
  analyzeGameData(data: GameData): CheatDetection {
    const detectedPatterns: string[] = [];
    const details: string[] = [];
    let totalConfidence = 0;
    let maxSeverity: CheatDetection['severity'] = 'clean';

    // Check each pattern
    this.patterns.forEach((pattern) => {
      if (pattern.detectionMethod(data)) {
        detectedPatterns.push(pattern.id);
        details.push(`${pattern.name}: ${pattern.description}`);
        totalConfidence += pattern.confidence;

        // Update severity
        if (pattern.severity === 'critical') {
          maxSeverity = 'confirmed_cheating';
        } else if (pattern.severity === 'high' && maxSeverity !== 'confirmed_cheating') {
          maxSeverity = 'likely_cheating';
        } else if (pattern.severity === 'medium' && maxSeverity === 'clean') {
          maxSeverity = 'suspicious';
        }
      }
    });

    // Calculate overall confidence
    const avgConfidence = detectedPatterns.length > 0
      ? totalConfidence / detectedPatterns.length
      : 1.0;

    const detection: CheatDetection = {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      severity: maxSeverity,
      confidence: avgConfidence,
      details,
    };

    // Store in history
    const history = this.detectionHistory.get(data.playerAddress) || [];
    history.push(detection);
    this.detectionHistory.set(data.playerAddress, history);

    return detection;
  }

  // Calculate variance (for bot detection)
  private calculateVariance(data: GameData): number {
    // Simplified variance calculation
    // In production, would analyze actual action timestamps
    return data.avgActionInterval * 0.1;
  }

  // Detect teleportation
  private detectTeleportation(
    positions: Array<{ x: number; y: number; timestamp: number }>
  ): boolean {
    if (positions.length < 2) return false;

    const maxSpeed = 500;

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1]!;
      const curr = positions[i]!;

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );

      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      if (timeDiff === 0) continue;

      const speed = distance / timeDiff;

      if (speed > maxSpeed) {
        return true;
      }
    }

    return false;
  }

  // Get player cheat history
  getPlayerHistory(playerAddress: string): CheatDetection[] {
    return this.detectionHistory.get(playerAddress) || [];
  }

  // Get player cheat score
  getPlayerCheatScore(playerAddress: string): {
    score: number;
    level: 'clean' | 'suspicious' | 'likely_cheater' | 'confirmed_cheater';
    detections: number;
  } {
    const history = this.getPlayerHistory(playerAddress);

    if (history.length === 0) {
      return {
        score: 0,
        level: 'clean',
        detections: 0,
      };
    }

    // Calculate score based on severity and frequency
    let score = 0;
    const severityWeights = {
      clean: 0,
      suspicious: 1,
      likely_cheating: 5,
      confirmed_cheating: 10,
    };

    history.forEach((detection) => {
      score += severityWeights[detection.severity];
    });

    // Determine level
    let level: 'clean' | 'suspicious' | 'likely_cheater' | 'confirmed_cheater';
    if (score === 0) level = 'clean';
    else if (score < 5) level = 'suspicious';
    else if (score < 20) level = 'likely_cheater';
    else level = 'confirmed_cheater';

    return {
      score,
      level,
      detections: history.filter((d) => d.detected).length,
    };
  }

  // Get detection statistics
  getStats(): {
    totalAnalyses: number;
    cheatsDetected: number;
    byPattern: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    let totalAnalyses = 0;
    let cheatsDetected = 0;
    const byPattern: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      clean: 0,
      suspicious: 0,
      likely_cheating: 0,
      confirmed_cheating: 0,
    };

    this.detectionHistory.forEach((history) => {
      history.forEach((detection) => {
        totalAnalyses++;

        if (detection.detected) {
          cheatsDetected++;
          bySeverity[detection.severity]++;

          detection.patterns.forEach((pattern) => {
            byPattern[pattern] = (byPattern[pattern] || 0) + 1;
          });
        } else {
          bySeverity.clean++;
        }
      });
    });

    return {
      totalAnalyses,
      cheatsDetected,
      byPattern,
      bySeverity,
    };
  }

  // Add custom pattern
  addPattern(pattern: CheatPattern): void {
    this.patterns.push(pattern);
  }

  // Remove pattern
  removePattern(patternId: string): void {
    this.patterns = this.patterns.filter((p) => p.id !== patternId);
  }

  // Get all patterns
  getPatterns(): CheatPattern[] {
    return [...this.patterns];
  }
}

export const cheatDetector = new CheatDetector();
