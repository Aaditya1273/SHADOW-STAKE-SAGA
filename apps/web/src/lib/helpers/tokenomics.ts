// Token burn mechanics and deflationary sinks

export interface BurnEvent {
  id: string;
  amount: bigint;
  reason: BurnReason;
  timestamp: number;
  txHash?: string;
}

export type BurnReason =
  | 'skill_upgrade'
  | 'weapon_upgrade'
  | 'revive'
  | 'nft_mint'
  | 'marketplace_fee'
  | 'guild_creation'
  | 'relic_fusion';

export interface BurnSink {
  name: string;
  reason: BurnReason;
  baseAmount: bigint;
  scalingFactor?: number; // Multiplier based on level/usage
  description: string;
}

// Define all burn sinks in the economy
export const burnSinks: BurnSink[] = [
  {
    name: 'Skill Upgrade',
    reason: 'skill_upgrade',
    baseAmount: BigInt(100),
    scalingFactor: 1.5, // Each level costs 50% more
    description: 'Burn DGN to upgrade skills in the skill tree',
  },
  {
    name: 'Weapon Upgrade',
    reason: 'weapon_upgrade',
    baseAmount: BigInt(200),
    scalingFactor: 2.0, // Each upgrade doubles cost
    description: 'Burn DGN to upgrade weapon stats and unlock special abilities',
  },
  {
    name: 'Extra Life Revival',
    reason: 'revive',
    baseAmount: BigInt(500),
    scalingFactor: 1.3, // Gets more expensive each use
    description: 'Burn DGN to revive with an extra life during a run',
  },
  {
    name: 'NFT Relic Minting',
    reason: 'nft_mint',
    baseAmount: BigInt(1000),
    description: 'Burn DGN to mint legendary loot as tradeable NFT relics',
  },
  {
    name: 'Marketplace Trading Fee',
    reason: 'marketplace_fee',
    baseAmount: BigInt(50),
    description: '5% of trade value burned as marketplace fee',
  },
  {
    name: 'Guild Creation',
    reason: 'guild_creation',
    baseAmount: BigInt(5000),
    description: 'Burn DGN to create a new guild',
  },
  {
    name: 'Relic Fusion',
    reason: 'relic_fusion',
    baseAmount: BigInt(300),
    scalingFactor: 1.2,
    description: 'Burn DGN to fuse multiple relics into a more powerful one',
  },
];

export class TokenBurnManager {
  private burnHistory: BurnEvent[];
  private totalBurned: bigint;
  private burnsByReason: Map<BurnReason, bigint>;

  constructor() {
    this.burnHistory = [];
    this.totalBurned = BigInt(0);
    this.burnsByReason = new Map();
  }

  // Calculate burn amount with scaling
  calculateBurnAmount(
    reason: BurnReason,
    level: number = 1,
    customAmount?: bigint
  ): bigint {
    const sink = burnSinks.find((s) => s.reason === reason);
    if (!sink) return BigInt(0);

    if (customAmount) return customAmount;

    if (sink.scalingFactor) {
      const scaledAmount =
        Number(sink.baseAmount) * Math.pow(sink.scalingFactor, level - 1);
      return BigInt(Math.floor(scaledAmount));
    }

    return sink.baseAmount;
  }

  // Record a burn event
  recordBurn(reason: BurnReason, amount: bigint, txHash?: string): BurnEvent {
    const burnEvent: BurnEvent = {
      id: `burn-${Date.now()}-${Math.random()}`,
      amount,
      reason,
      timestamp: Date.now(),
      txHash,
    };

    this.burnHistory.push(burnEvent);
    this.totalBurned += amount;

    const currentBurned = this.burnsByReason.get(reason) || BigInt(0);
    this.burnsByReason.set(reason, currentBurned + amount);

    return burnEvent;
  }

  // Get total burned tokens
  getTotalBurned(): bigint {
    return this.totalBurned;
  }

  // Get burned amount by reason
  getBurnedByReason(reason: BurnReason): bigint {
    return this.burnsByReason.get(reason) || BigInt(0);
  }

  // Get burn history
  getBurnHistory(limit?: number): BurnEvent[] {
    if (limit) {
      return this.burnHistory.slice(-limit);
    }
    return [...this.burnHistory];
  }

  // Get burn statistics
  getBurnStats(): {
    totalBurned: bigint;
    burnsByReason: Record<BurnReason, bigint>;
    recentBurns: BurnEvent[];
  } {
    const burnsByReason: Record<string, bigint> = {};
    burnSinks.forEach((sink) => {
      burnsByReason[sink.reason] = this.getBurnedByReason(sink.reason);
    });

    return {
      totalBurned: this.totalBurned,
      burnsByReason: burnsByReason as Record<BurnReason, bigint>,
      recentBurns: this.getBurnHistory(10),
    };
  }

  // Calculate deflationary rate
  getDeflationaryRate(totalSupply: bigint): number {
    if (totalSupply === BigInt(0)) return 0;
    return (Number(this.totalBurned) / Number(totalSupply)) * 100;
  }

  // Reset (for testing)
  reset() {
    this.burnHistory = [];
    this.totalBurned = BigInt(0);
    this.burnsByReason.clear();
  }
}

// Token supply management
export interface TokenSupplyInfo {
  totalMinted: bigint;
  totalBurned: bigint;
  circulatingSupply: bigint;
  maxSupply?: bigint;
  deflationRate: number;
}

export class TokenSupplyManager {
  private totalMinted: bigint;
  private maxSupply: bigint | null;
  private burnManager: TokenBurnManager;

  constructor(maxSupply?: bigint) {
    this.totalMinted = BigInt(0);
    this.maxSupply = maxSupply || null;
    this.burnManager = new TokenBurnManager();
  }

  recordMint(amount: bigint) {
    if (this.maxSupply && this.totalMinted + amount > this.maxSupply) {
      throw new Error('Max supply exceeded');
    }
    this.totalMinted += amount;
  }

  getSupplyInfo(): TokenSupplyInfo {
    const totalBurned = this.burnManager.getTotalBurned();
    const circulatingSupply = this.totalMinted - totalBurned;

    return {
      totalMinted: this.totalMinted,
      totalBurned,
      circulatingSupply,
      maxSupply: this.maxSupply || undefined,
      deflationRate: this.burnManager.getDeflationaryRate(this.totalMinted),
    };
  }

  getBurnManager(): TokenBurnManager {
    return this.burnManager;
  }
}

// Singleton instances
export const tokenBurnManager = new TokenBurnManager();
export const tokenSupplyManager = new TokenSupplyManager(
  BigInt(1000000000) // 1 billion max supply
);
