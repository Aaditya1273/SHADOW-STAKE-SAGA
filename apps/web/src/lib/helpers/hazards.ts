// Environmental hazards system for dungeon variety

export interface Hazard {
  type: 'trap' | 'darkness' | 'corruption' | 'poison' | 'fire';
  damage: number;
  duration?: number; // For status effects
  triggerRadius: number;
  visualEffect: string;
}

export const hazardTypes: Record<string, Hazard> = {
  spike_trap: {
    type: 'trap',
    damage: 15,
    triggerRadius: 30,
    visualEffect: 'spikes',
  },
  arrow_trap: {
    type: 'trap',
    damage: 20,
    triggerRadius: 50,
    visualEffect: 'arrows',
  },
  darkness_zone: {
    type: 'darkness',
    damage: 0,
    duration: 5000,
    triggerRadius: 100,
    visualEffect: 'dark-overlay',
  },
  corruption_pool: {
    type: 'corruption',
    damage: 5,
    duration: 3000,
    triggerRadius: 60,
    visualEffect: 'purple-mist',
  },
  poison_gas: {
    type: 'poison',
    damage: 3,
    duration: 4000,
    triggerRadius: 80,
    visualEffect: 'green-cloud',
  },
  fire_pit: {
    type: 'fire',
    damage: 10,
    duration: 2000,
    triggerRadius: 40,
    visualEffect: 'flames',
  },
};

export class HazardManager {
  private activeHazards: Map<string, { x: number; y: number; hazard: Hazard }>;
  private statusEffects: Map<string, { endTime: number; tickDamage: number }>;

  constructor() {
    this.activeHazards = new Map();
    this.statusEffects = new Map();
  }

  spawnHazard(id: string, x: number, y: number, hazardType: string) {
    const hazard = hazardTypes[hazardType];
    if (hazard) {
      this.activeHazards.set(id, { x, y, hazard });
    }
  }

  checkPlayerCollision(
    playerX: number,
    playerY: number,
    currentTime: number
  ): number {
    let totalDamage = 0;

    this.activeHazards.forEach((hazardData, id) => {
      const distance = Math.sqrt(
        Math.pow(playerX - hazardData.x, 2) + Math.pow(playerY - hazardData.y, 2)
      );

      if (distance < hazardData.hazard.triggerRadius) {
        // Instant damage traps
        if (hazardData.hazard.type === 'trap') {
          totalDamage += hazardData.hazard.damage;
          this.activeHazards.delete(id); // Trap triggers once
        }
        // Status effect hazards
        else if (hazardData.hazard.duration) {
          const effectKey = `${id}-${hazardData.hazard.type}`;
          if (!this.statusEffects.has(effectKey)) {
            this.statusEffects.set(effectKey, {
              endTime: currentTime + hazardData.hazard.duration,
              tickDamage: hazardData.hazard.damage,
            });
          }
        }
      }
    });

    return totalDamage;
  }

  updateStatusEffects(currentTime: number): number {
    let tickDamage = 0;

    this.statusEffects.forEach((effect, key) => {
      if (currentTime > effect.endTime) {
        this.statusEffects.delete(key);
      } else {
        tickDamage += effect.tickDamage;
      }
    });

    return tickDamage;
  }

  getActiveHazards() {
    return Array.from(this.activeHazards.values());
  }

  clearHazards() {
    this.activeHazards.clear();
    this.statusEffects.clear();
  }

  // Generate hazards for a room based on level
  generateRoomHazards(
    roomX: number,
    roomY: number,
    roomWidth: number,
    roomHeight: number,
    level: number
  ): Array<{ id: string; x: number; y: number; type: string }> {
    const hazards: Array<{ id: string; x: number; y: number; type: string }> = [];
    const hazardCount = Math.min(Math.floor(level / 2) + 1, 5);

    const availableHazards = Object.keys(hazardTypes);

    for (let i = 0; i < hazardCount; i++) {
      const hazardType =
        availableHazards[Math.floor(Math.random() * availableHazards.length)];
      const x = roomX + Math.random() * roomWidth;
      const y = roomY + Math.random() * roomHeight;
      const id = `hazard-${roomX}-${roomY}-${i}`;

      hazards.push({ id, x, y, type: hazardType! });
    }

    return hazards;
  }
}
