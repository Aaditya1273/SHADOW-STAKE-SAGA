// Staking system integration

export interface StakingPool {
  id: string;
  name: string;
  tokenAddress: string;
  rewardTokenAddress: string;
  apr: number; // Annual Percentage Rate
  lockPeriod: number; // In seconds
  minStake: bigint;
  maxStake?: bigint;
  totalStaked: bigint;
  totalRewards: bigint;
}

export interface UserStake {
  poolId: string;
  amount: bigint;
  startTime: number;
  lockEndTime: number;
  rewardsEarned: bigint;
  lastClaimTime: number;
}

// Staking pools available
export const stakingPools: StakingPool[] = [
  {
    id: 'dgn-stt-pool',
    name: 'DGN → STT Rewards',
    tokenAddress: '0x74440B7E4C3Eb17ba37648d2745AF93edCb3849A', // DGN token
    rewardTokenAddress: '0x' + '1'.repeat(40), // STT token (placeholder)
    apr: 50, // 50% APR
    lockPeriod: 30 * 24 * 60 * 60, // 30 days
    minStake: BigInt(100),
    totalStaked: BigInt(0),
    totalRewards: BigInt(0),
  },
  {
    id: 'dgn-flexible',
    name: 'DGN Flexible Staking',
    tokenAddress: '0x74440B7E4C3Eb17ba37648d2745AF93edCb3849A',
    rewardTokenAddress: '0x74440B7E4C3Eb17ba37648d2745AF93edCb3849A', // Same token
    apr: 20, // 20% APR
    lockPeriod: 0, // No lock
    minStake: BigInt(50),
    totalStaked: BigInt(0),
    totalRewards: BigInt(0),
  },
  {
    id: 'dgn-high-yield',
    name: 'DGN High Yield (90 days)',
    tokenAddress: '0x74440B7E4C3Eb17ba37648d2745AF93edCb3849A',
    rewardTokenAddress: '0x' + '1'.repeat(40), // STT token
    apr: 100, // 100% APR
    lockPeriod: 90 * 24 * 60 * 60, // 90 days
    minStake: BigInt(1000),
    maxStake: BigInt(100000),
    totalStaked: BigInt(0),
    totalRewards: BigInt(0),
  },
];

export class StakingManager {
  private userStakes: Map<string, UserStake[]>;
  private pools: Map<string, StakingPool>;

  constructor() {
    this.userStakes = new Map();
    this.pools = new Map();

    // Initialize pools
    stakingPools.forEach((pool) => {
      this.pools.set(pool.id, { ...pool });
    });
  }

  // Stake tokens
  stake(
    userAddress: string,
    poolId: string,
    amount: bigint
  ): {
    success: boolean;
    message: string;
    stake?: UserStake;
  } {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return { success: false, message: 'Pool not found' };
    }

    if (amount < pool.minStake) {
      return {
        success: false,
        message: `Minimum stake is ${pool.minStake} DGN`,
      };
    }

    if (pool.maxStake && amount > pool.maxStake) {
      return {
        success: false,
        message: `Maximum stake is ${pool.maxStake} DGN`,
      };
    }

    const now = Date.now();
    const stake: UserStake = {
      poolId,
      amount,
      startTime: now,
      lockEndTime: now + pool.lockPeriod * 1000,
      rewardsEarned: BigInt(0),
      lastClaimTime: now,
    };

    const userStakeList = this.userStakes.get(userAddress) || [];
    userStakeList.push(stake);
    this.userStakes.set(userAddress, userStakeList);

    // Update pool stats
    pool.totalStaked += amount;

    return {
      success: true,
      message: 'Tokens staked successfully',
      stake,
    };
  }

  // Unstake tokens
  unstake(
    userAddress: string,
    poolId: string,
    amount: bigint
  ): {
    success: boolean;
    message: string;
    amount?: bigint;
    rewards?: bigint;
  } {
    const userStakeList = this.userStakes.get(userAddress);
    if (!userStakeList) {
      return { success: false, message: 'No stakes found' };
    }

    const stake = userStakeList.find((s) => s.poolId === poolId);
    if (!stake) {
      return { success: false, message: 'Stake not found in this pool' };
    }

    const now = Date.now();
    if (now < stake.lockEndTime) {
      return {
        success: false,
        message: `Tokens locked until ${new Date(stake.lockEndTime).toLocaleDateString()}`,
      };
    }

    if (amount > stake.amount) {
      return { success: false, message: 'Insufficient staked amount' };
    }

    // Calculate pending rewards
    const pendingRewards = this.calculateRewards(stake);

    // Update stake
    stake.amount -= amount;
    if (stake.amount === BigInt(0)) {
      // Remove stake if fully unstaked
      const index = userStakeList.indexOf(stake);
      userStakeList.splice(index, 1);
    }

    // Update pool stats
    const pool = this.pools.get(poolId);
    if (pool) {
      pool.totalStaked -= amount;
    }

    return {
      success: true,
      message: 'Tokens unstaked successfully',
      amount,
      rewards: pendingRewards,
    };
  }

  // Calculate rewards for a stake
  private calculateRewards(stake: UserStake): bigint {
    const pool = this.pools.get(stake.poolId);
    if (!pool) return BigInt(0);

    const now = Date.now();
    const timeStaked = now - stake.lastClaimTime;
    const timeStakedSeconds = timeStaked / 1000;

    // APR calculation: (amount * APR * time) / (365 days * 100)
    const yearInSeconds = 365 * 24 * 60 * 60;
    const rewards =
      (stake.amount * BigInt(pool.apr) * BigInt(Math.floor(timeStakedSeconds))) /
      BigInt(yearInSeconds * 100);

    return rewards + stake.rewardsEarned;
  }

  // Claim rewards
  claimRewards(
    userAddress: string,
    poolId: string
  ): {
    success: boolean;
    message: string;
    rewards?: bigint;
  } {
    const userStakeList = this.userStakes.get(userAddress);
    if (!userStakeList) {
      return { success: false, message: 'No stakes found' };
    }

    const stake = userStakeList.find((s) => s.poolId === poolId);
    if (!stake) {
      return { success: false, message: 'Stake not found in this pool' };
    }

    const rewards = this.calculateRewards(stake);

    if (rewards === BigInt(0)) {
      return { success: false, message: 'No rewards to claim' };
    }

    // Reset rewards tracking
    stake.rewardsEarned = BigInt(0);
    stake.lastClaimTime = Date.now();

    // Update pool stats
    const pool = this.pools.get(poolId);
    if (pool) {
      pool.totalRewards += rewards;
    }

    return {
      success: true,
      message: 'Rewards claimed successfully',
      rewards,
    };
  }

  // Get user stakes
  getUserStakes(userAddress: string): UserStake[] {
    return this.userStakes.get(userAddress) || [];
  }

  // Get stake info with pending rewards
  getStakeInfo(
    userAddress: string,
    poolId: string
  ): {
    stake?: UserStake;
    pendingRewards: bigint;
    isLocked: boolean;
    unlockTime?: number;
  } {
    const userStakeList = this.userStakes.get(userAddress);
    const stake = userStakeList?.find((s) => s.poolId === poolId);

    if (!stake) {
      return {
        pendingRewards: BigInt(0),
        isLocked: false,
      };
    }

    const now = Date.now();
    const isLocked = now < stake.lockEndTime;

    return {
      stake,
      pendingRewards: this.calculateRewards(stake),
      isLocked,
      unlockTime: isLocked ? stake.lockEndTime : undefined,
    };
  }

  // Get pool info
  getPool(poolId: string): StakingPool | undefined {
    return this.pools.get(poolId);
  }

  // Get all pools
  getAllPools(): StakingPool[] {
    return Array.from(this.pools.values());
  }

  // Get total staked across all pools
  getTotalStaked(): bigint {
    let total = BigInt(0);
    this.pools.forEach((pool) => {
      total += pool.totalStaked;
    });
    return total;
  }

  // Get user's total staked value
  getUserTotalStaked(userAddress: string): bigint {
    const stakes = this.getUserStakes(userAddress);
    return stakes.reduce((total, stake) => total + stake.amount, BigInt(0));
  }

  // Get user's total pending rewards
  getUserTotalRewards(userAddress: string): bigint {
    const stakes = this.getUserStakes(userAddress);
    return stakes.reduce(
      (total, stake) => total + this.calculateRewards(stake),
      BigInt(0)
    );
  }

  // Compound rewards (restake rewards)
  compoundRewards(
    userAddress: string,
    poolId: string
  ): {
    success: boolean;
    message: string;
    compoundedAmount?: bigint;
  } {
    const claimResult = this.claimRewards(userAddress, poolId);
    if (!claimResult.success || !claimResult.rewards) {
      return { success: false, message: 'No rewards to compound' };
    }

    const stakeResult = this.stake(userAddress, poolId, claimResult.rewards);
    if (!stakeResult.success) {
      return { success: false, message: 'Failed to compound rewards' };
    }

    return {
      success: true,
      message: 'Rewards compounded successfully',
      compoundedAmount: claimResult.rewards,
    };
  }
}

// Singleton instance
export const stakingManager = new StakingManager();
