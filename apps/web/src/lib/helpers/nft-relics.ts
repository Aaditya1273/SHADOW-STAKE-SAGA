// NFT Relics System - Mint legendary loot as tradeable NFTs

export interface Relic {
  id: string;
  tokenId?: bigint;
  name: string;
  type: RelicType;
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  stats: RelicStats;
  origin: {
    level: number;
    enemyType?: string;
    bossType?: string;
    timestamp: number;
  };
  isMinted: boolean;
  owner?: string;
  metadata: RelicMetadata;
}

export type RelicType =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'material';

export interface RelicStats {
  damage?: number;
  defense?: number;
  health?: number;
  speed?: number;
  critChance?: number;
  specialEffect?: string;
}

export interface RelicMetadata {
  image: string;
  description: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export interface RelicDrop {
  relic: Relic;
  dropChance: number;
  minLevel: number;
}

// Legendary relics that can be minted as NFTs
export const legendaryRelics: RelicDrop[] = [
  {
    relic: {
      id: 'relic-veil-shard',
      name: 'Shard of the Veil',
      type: 'material',
      rarity: 'mythic',
      stats: {
        specialEffect: 'Grants immunity to corruption for 10 seconds',
      },
      origin: {
        level: 0,
        timestamp: 0,
      },
      isMinted: false,
      metadata: {
        image: '/relics/veil-shard.png',
        description:
          'A fragment of the shattered Veil, pulsing with reality-bending energy. Extremely rare.',
        attributes: [
          { trait_type: 'Rarity', value: 'Mythic' },
          { trait_type: 'Type', value: 'Material' },
          { trait_type: 'Effect', value: 'Corruption Immunity' },
        ],
      },
    },
    dropChance: 0.001, // 0.1%
    minLevel: 20,
  },
  {
    relic: {
      id: 'relic-crown-forgotten',
      name: 'Crown of the Forgotten King',
      type: 'armor',
      rarity: 'legendary',
      stats: {
        defense: 50,
        health: 100,
        specialEffect: 'Summon skeleton minions once per battle',
      },
      origin: {
        level: 0,
        bossType: 'skeleton-king',
        timestamp: 0,
      },
      isMinted: false,
      metadata: {
        image: '/relics/forgotten-crown.png',
        description:
          'The rusted crown of a fallen monarch. Whispers of ancient power echo from within.',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Type', value: 'Armor' },
          { trait_type: 'Defense', value: 50 },
          { trait_type: 'Health Bonus', value: 100 },
          { trait_type: 'Boss Drop', value: 'Skeleton King' },
        ],
      },
    },
    dropChance: 0.05, // 5% from Skeleton King
    minLevel: 5,
  },
  {
    relic: {
      id: 'relic-shadow-essence',
      name: 'Essence of Shadows',
      type: 'consumable',
      rarity: 'epic',
      stats: {
        specialEffect: 'Become invisible for 5 seconds',
      },
      origin: {
        level: 0,
        bossType: 'shadow-lord',
        timestamp: 0,
      },
      isMinted: false,
      metadata: {
        image: '/relics/shadow-essence.png',
        description:
          'Concentrated darkness from the Shadow Lord. Grants temporary invisibility.',
        attributes: [
          { trait_type: 'Rarity', value: 'Epic' },
          { trait_type: 'Type', value: 'Consumable' },
          { trait_type: 'Effect', value: 'Invisibility' },
          { trait_type: 'Boss Drop', value: 'Shadow Lord' },
        ],
      },
    },
    dropChance: 0.1, // 10% from Shadow Lord
    minLevel: 10,
  },
  {
    relic: {
      id: 'relic-titan-heart',
      name: 'Heart of the Titan',
      type: 'accessory',
      rarity: 'legendary',
      stats: {
        health: 200,
        defense: 30,
        specialEffect: 'Regenerate 5 HP per second',
      },
      origin: {
        level: 0,
        bossType: 'elemental-titan',
        timestamp: 0,
      },
      isMinted: false,
      metadata: {
        image: '/relics/titan-heart.png',
        description:
          'The still-beating heart of an Elemental Titan. Pulses with primordial life force.',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Type', value: 'Accessory' },
          { trait_type: 'Health Bonus', value: 200 },
          { trait_type: 'Defense', value: 30 },
          { trait_type: 'Boss Drop', value: 'Elemental Titan' },
        ],
      },
    },
    dropChance: 0.08, // 8% from Elemental Titan
    minLevel: 15,
  },
  {
    relic: {
      id: 'relic-necro-staff',
      name: "Necro-Overlord's Staff",
      type: 'weapon',
      rarity: 'mythic',
      stats: {
        damage: 100,
        critChance: 25,
        specialEffect: 'Raise defeated enemies as temporary allies',
      },
      origin: {
        level: 0,
        bossType: 'necro-overlord',
        timestamp: 0,
      },
      isMinted: false,
      metadata: {
        image: '/relics/necro-staff.png',
        description:
          'The weapon that shattered the Veil. Radiates forbidden necromantic power.',
        attributes: [
          { trait_type: 'Rarity', value: 'Mythic' },
          { trait_type: 'Type', value: 'Weapon' },
          { trait_type: 'Damage', value: 100 },
          { trait_type: 'Crit Chance', value: '25%' },
          { trait_type: 'Boss Drop', value: 'Necro-Overlord' },
        ],
      },
    },
    dropChance: 0.03, // 3% from Necro-Overlord
    minLevel: 20,
  },
];

export class RelicManager {
  private collectedRelics: Map<string, Relic>;
  private mintedRelics: Set<string>;

  constructor() {
    this.collectedRelics = new Map();
    this.mintedRelics = new Set();
  }

  // Check for relic drop
  checkRelicDrop(level: number, bossType?: string): Relic | null {
    const eligibleRelics = legendaryRelics.filter(
      (drop) =>
        level >= drop.minLevel &&
        (!drop.relic.origin.bossType || drop.relic.origin.bossType === bossType)
    );

    for (const drop of eligibleRelics) {
      if (Math.random() < drop.dropChance) {
        const relic = this.createRelicInstance(drop.relic, level, bossType);
        return relic;
      }
    }

    return null;
  }

  private createRelicInstance(
    template: Relic,
    level: number,
    bossType?: string
  ): Relic {
    return {
      ...template,
      id: `${template.id}-${Date.now()}`,
      origin: {
        level,
        bossType,
        timestamp: Date.now(),
      },
    };
  }

  // Add relic to collection
  collectRelic(relic: Relic) {
    this.collectedRelics.set(relic.id, relic);
  }

  // Get all collected relics
  getCollectedRelics(): Relic[] {
    return Array.from(this.collectedRelics.values());
  }

  // Get unminted relics
  getUnmintedRelics(): Relic[] {
    return this.getCollectedRelics().filter((r) => !r.isMinted);
  }

  // Mark relic as minted
  markAsMinted(relicId: string, tokenId: bigint, owner: string) {
    const relic = this.collectedRelics.get(relicId);
    if (relic) {
      relic.isMinted = true;
      relic.tokenId = tokenId;
      relic.owner = owner;
      this.mintedRelics.add(relicId);
    }
  }

  // Get relic by ID
  getRelic(relicId: string): Relic | undefined {
    return this.collectedRelics.get(relicId);
  }

  // Calculate mint cost (requires DGN burn)
  getMintCost(relic: Relic): bigint {
    const baseCost = BigInt(1000);
    const rarityMultiplier = {
      rare: 1,
      epic: 2,
      legendary: 5,
      mythic: 10,
    };

    return baseCost * BigInt(rarityMultiplier[relic.rarity]);
  }

  // Fuse relics (burn multiple to create stronger one)
  fuseRelics(relicIds: string[]): Relic | null {
    if (relicIds.length < 2) return null;

    const relics = relicIds
      .map((id) => this.collectedRelics.get(id))
      .filter((r) => r !== undefined) as Relic[];

    if (relics.length < 2) return null;

    // Calculate fused relic stats
    const fusedStats: RelicStats = {};
    relics.forEach((relic) => {
      if (relic.stats.damage)
        fusedStats.damage = (fusedStats.damage || 0) + relic.stats.damage * 0.5;
      if (relic.stats.defense)
        fusedStats.defense =
          (fusedStats.defense || 0) + relic.stats.defense * 0.5;
      if (relic.stats.health)
        fusedStats.health = (fusedStats.health || 0) + relic.stats.health * 0.5;
    });

    // Determine fused rarity
    const rarityOrder = ['rare', 'epic', 'legendary', 'mythic'];
    const highestRarity = relics.reduce((max, relic) => {
      const currentIndex = rarityOrder.indexOf(relic.rarity);
      const maxIndex = rarityOrder.indexOf(max);
      return currentIndex > maxIndex ? relic.rarity : max;
    }, 'rare' as Relic['rarity']);

    const fusedRelic: Relic = {
      id: `fused-${Date.now()}`,
      name: 'Fused Relic',
      type: relics[0]!.type,
      rarity: highestRarity,
      stats: fusedStats,
      origin: {
        level: Math.max(...relics.map((r) => r.origin.level)),
        timestamp: Date.now(),
      },
      isMinted: false,
      metadata: {
        image: '/relics/fused.png',
        description: `A powerful relic created by fusing ${relics.length} relics together.`,
        attributes: [
          { trait_type: 'Rarity', value: highestRarity },
          { trait_type: 'Type', value: 'Fused' },
          { trait_type: 'Source Relics', value: relics.length },
        ],
      },
    };

    // Remove source relics
    relicIds.forEach((id) => this.collectedRelics.delete(id));

    // Add fused relic
    this.collectRelic(fusedRelic);

    return fusedRelic;
  }

  // Get collection statistics
  getCollectionStats(): {
    total: number;
    minted: number;
    unminted: number;
    byRarity: Record<string, number>;
  } {
    const relics = this.getCollectedRelics();
    const byRarity: Record<string, number> = {
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };

    relics.forEach((relic) => {
      byRarity[relic.rarity]++;
    });

    return {
      total: relics.length,
      minted: this.mintedRelics.size,
      unminted: relics.length - this.mintedRelics.size,
      byRarity,
    };
  }
}

// Singleton instance
export const relicManager = new RelicManager();
