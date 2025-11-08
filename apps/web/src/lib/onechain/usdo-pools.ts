// OneChain USDO Pools Integration

export interface USDOPool {
  id: string;
  name: string;
  totalLiquidity: bigint;
  apy: number;
  token0: string; // DGN
  token1: string; // USDO
  reserve0: bigint;
  reserve1: bigint;
  lpTokenSupply: bigint;
  volume24h: bigint;
  fees24h: bigint;
}

export interface USDOPosition {
  poolId: string;
  userAddress: string;
  lpTokens: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
  depositedAt: number;
  earnedFees: bigint;
  currentValue: bigint;
}

export interface USDOStaking {
  poolId: string;
  userAddress: string;
  stakedAmount: bigint;
  rewardRate: bigint;
  lastClaimTime: number;
  pendingRewards: bigint;
}

export const USDO_ADDRESS = '0x0000000000000000000000000000000000000002'; // OneChain USDO
export const DGN_ADDRESS = '0x74440B7E4C3Eb17ba37648d2745AF93edCb3849A'; // DGN Token

export class USDOPoolManager {
  private pools: Map<string, USDOPool>;
  private positions: Map<string, USDOPosition[]>; // userAddress -> positions
  private stakingPositions: Map<string, USDOStaking[]>;

  constructor() {
    this.pools = new Map();
    this.positions = new Map();
    this.stakingPositions = new Map();

    // Initialize default USDO pools
    this.initializePools();
  }

  private initializePools() {
    // DGN/USDO Main Pool
    const mainPool: USDOPool = {
      id: 'dgn-usdo-main',
      name: 'DGN/USDO',
      totalLiquidity: BigInt(1000000) * BigInt(1e18), // $1M
      apy: 85,
      token0: DGN_ADDRESS,
      token1: USDO_ADDRESS,
      reserve0: BigInt(10000000) * BigInt(1e18), // 10M DGN
      reserve1: BigInt(100000) * BigInt(1e18), // 100K USDO
      lpTokenSupply: BigInt(1000000) * BigInt(1e18),
      volume24h: BigInt(50000) * BigInt(1e18),
      fees24h: BigInt(150) * BigInt(1e18),
    };

    this.pools.set(mainPool.id, mainPool);

    // DGN/USDO Stable Pool (Lower volatility)
    const stablePool: USDOPool = {
      id: 'dgn-usdo-stable',
      name: 'DGN/USDO Stable',
      totalLiquidity: BigInt(500000) * BigInt(1e18), // $500K
      apy: 45,
      token0: DGN_ADDRESS,
      token1: USDO_ADDRESS,
      reserve0: BigInt(5000000) * BigInt(1e18),
      reserve1: BigInt(50000) * BigInt(1e18),
      lpTokenSupply: BigInt(500000) * BigInt(1e18),
      volume24h: BigInt(25000) * BigInt(1e18),
      fees24h: BigInt(75) * BigInt(1e18),
    };

    this.pools.set(stablePool.id, stablePool);

    // DGN/USDO High Yield Pool (Higher risk)
    const highYieldPool: USDOPool = {
      id: 'dgn-usdo-high-yield',
      name: 'DGN/USDO High Yield',
      totalLiquidity: BigInt(2000000) * BigInt(1e18), // $2M
      apy: 150,
      token0: DGN_ADDRESS,
      token1: USDO_ADDRESS,
      reserve0: BigInt(20000000) * BigInt(1e18),
      reserve1: BigInt(200000) * BigInt(1e18),
      lpTokenSupply: BigInt(2000000) * BigInt(1e18),
      volume24h: BigInt(100000) * BigInt(1e18),
      fees24h: BigInt(300) * BigInt(1e18),
    };

    this.pools.set(highYieldPool.id, highYieldPool);
  }

  // Add liquidity to USDO pool
  async addLiquidity(
    poolId: string,
    userAddress: string,
    token0Amount: bigint,
    token1Amount: bigint
  ): Promise<{
    success: boolean;
    lpTokens?: bigint;
    message?: string;
  }> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return {
        success: false,
        message: 'Pool not found',
      };
    }

    // Calculate LP tokens to mint
    const lpTokens = this.calculateLPTokens(
      pool,
      token0Amount,
      token1Amount
    );

    // Update pool reserves
    pool.reserve0 += token0Amount;
    pool.reserve1 += token1Amount;
    pool.lpTokenSupply += lpTokens;
    pool.totalLiquidity = this.calculateTotalLiquidity(pool);

    // Create or update position
    const userPositions = this.positions.get(userAddress) || [];
    const existingPosition = userPositions.find((p) => p.poolId === poolId);

    if (existingPosition) {
      existingPosition.lpTokens += lpTokens;
      existingPosition.token0Amount += token0Amount;
      existingPosition.token1Amount += token1Amount;
      existingPosition.currentValue = this.calculatePositionValue(
        pool,
        existingPosition.lpTokens
      );
    } else {
      const position: USDOPosition = {
        poolId,
        userAddress,
        lpTokens,
        token0Amount,
        token1Amount,
        depositedAt: Date.now(),
        earnedFees: BigInt(0),
        currentValue: this.calculatePositionValue(pool, lpTokens),
      };
      userPositions.push(position);
    }

    this.positions.set(userAddress, userPositions);

    return {
      success: true,
      lpTokens,
    };
  }

  // Remove liquidity from USDO pool
  async removeLiquidity(
    poolId: string,
    userAddress: string,
    lpTokens: bigint
  ): Promise<{
    success: boolean;
    token0Amount?: bigint;
    token1Amount?: bigint;
    fees?: bigint;
    message?: string;
  }> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return {
        success: false,
        message: 'Pool not found',
      };
    }

    const userPositions = this.positions.get(userAddress) || [];
    const position = userPositions.find((p) => p.poolId === poolId);

    if (!position || position.lpTokens < lpTokens) {
      return {
        success: false,
        message: 'Insufficient LP tokens',
      };
    }

    // Calculate token amounts to return
    const token0Amount = (pool.reserve0 * lpTokens) / pool.lpTokenSupply;
    const token1Amount = (pool.reserve1 * lpTokens) / pool.lpTokenSupply;

    // Calculate earned fees
    const fees = this.calculateEarnedFees(pool, position, lpTokens);

    // Update pool reserves
    pool.reserve0 -= token0Amount;
    pool.reserve1 -= token1Amount;
    pool.lpTokenSupply -= lpTokens;
    pool.totalLiquidity = this.calculateTotalLiquidity(pool);

    // Update position
    position.lpTokens -= lpTokens;
    position.token0Amount -= token0Amount;
    position.token1Amount -= token1Amount;
    position.earnedFees += fees;

    if (position.lpTokens === BigInt(0)) {
      // Remove position if fully withdrawn
      const index = userPositions.indexOf(position);
      userPositions.splice(index, 1);
    }

    return {
      success: true,
      token0Amount,
      token1Amount,
      fees,
    };
  }

  // Stake LP tokens for additional rewards
  async stakeLPTokens(
    poolId: string,
    userAddress: string,
    amount: bigint
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return {
        success: false,
        message: 'Pool not found',
      };
    }

    const userPositions = this.positions.get(userAddress) || [];
    const position = userPositions.find((p) => p.poolId === poolId);

    if (!position || position.lpTokens < amount) {
      return {
        success: false,
        message: 'Insufficient LP tokens',
      };
    }

    // Create or update staking position
    const stakingPositions = this.stakingPositions.get(userAddress) || [];
    const existingStake = stakingPositions.find((s) => s.poolId === poolId);

    const rewardRate = this.calculateRewardRate(pool);

    if (existingStake) {
      // Claim pending rewards first
      existingStake.pendingRewards += this.calculatePendingRewards(existingStake);
      existingStake.stakedAmount += amount;
      existingStake.lastClaimTime = Date.now();
      existingStake.rewardRate = rewardRate;
    } else {
      const stake: USDOStaking = {
        poolId,
        userAddress,
        stakedAmount: amount,
        rewardRate,
        lastClaimTime: Date.now(),
        pendingRewards: BigInt(0),
      };
      stakingPositions.push(stake);
    }

    this.stakingPositions.set(userAddress, stakingPositions);

    return {
      success: true,
      message: 'LP tokens staked successfully',
    };
  }

  // Claim staking rewards
  async claimRewards(
    poolId: string,
    userAddress: string
  ): Promise<{
    success: boolean;
    rewards?: bigint;
    message?: string;
  }> {
    const stakingPositions = this.stakingPositions.get(userAddress) || [];
    const stake = stakingPositions.find((s) => s.poolId === poolId);

    if (!stake) {
      return {
        success: false,
        message: 'No staking position found',
      };
    }

    const pendingRewards = this.calculatePendingRewards(stake);
    const totalRewards = stake.pendingRewards + pendingRewards;

    stake.pendingRewards = BigInt(0);
    stake.lastClaimTime = Date.now();

    return {
      success: true,
      rewards: totalRewards,
    };
  }

  // Calculate LP tokens to mint
  private calculateLPTokens(
    pool: USDOPool,
    token0Amount: bigint,
    token1Amount: bigint
  ): bigint {
    if (pool.lpTokenSupply === BigInt(0)) {
      // Initial liquidity
      return token0Amount * token1Amount;
    }

    // Proportional to existing liquidity
    const liquidity0 = (token0Amount * pool.lpTokenSupply) / pool.reserve0;
    const liquidity1 = (token1Amount * pool.lpTokenSupply) / pool.reserve1;

    return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
  }

  // Calculate total liquidity in USD
  private calculateTotalLiquidity(pool: USDOPool): bigint {
    // Assume 1 USDO = $1
    return pool.reserve1 * BigInt(2); // Both sides of the pool
  }

  // Calculate position value
  private calculatePositionValue(pool: USDOPool, lpTokens: bigint): bigint {
    if (pool.lpTokenSupply === BigInt(0)) return BigInt(0);
    return (pool.totalLiquidity * lpTokens) / pool.lpTokenSupply;
  }

  // Calculate earned fees
  private calculateEarnedFees(
    pool: USDOPool,
    position: USDOPosition,
    lpTokens: bigint
  ): bigint {
    const timeHeld = Date.now() - position.depositedAt;
    const daysHeld = timeHeld / (24 * 60 * 60 * 1000);

    // Estimate fees based on pool's 24h fees and time held
    const dailyFees = pool.fees24h;
    const userShare = lpTokens / pool.lpTokenSupply;
    const estimatedFees = BigInt(Math.floor(Number(dailyFees) * Number(userShare) * daysHeld));

    return estimatedFees;
  }

  // Calculate reward rate for staking
  private calculateRewardRate(pool: USDOPool): bigint {
    // Reward rate based on APY
    // APY to per-second rate: APY / 365 / 24 / 60 / 60
    const annualRate = pool.apy / 100;
    const perSecondRate = annualRate / (365 * 24 * 60 * 60);
    return BigInt(Math.floor(perSecondRate * 1e18)); // 18 decimals
  }

  // Calculate pending rewards
  private calculatePendingRewards(stake: USDOStaking): bigint {
    const timeElapsed = Date.now() - stake.lastClaimTime;
    const secondsElapsed = BigInt(Math.floor(timeElapsed / 1000));

    return (stake.stakedAmount * stake.rewardRate * secondsElapsed) / BigInt(1e18);
  }

  // Get pool
  getPool(poolId: string): USDOPool | undefined {
    return this.pools.get(poolId);
  }

  // Get all pools
  getAllPools(): USDOPool[] {
    return Array.from(this.pools.values());
  }

  // Get user positions
  getUserPositions(userAddress: string): USDOPosition[] {
    return this.positions.get(userAddress) || [];
  }

  // Get user staking positions
  getUserStakingPositions(userAddress: string): USDOStaking[] {
    return this.stakingPositions.get(userAddress) || [];
  }

  // Get pool statistics
  getPoolStats(poolId: string): {
    tvl: bigint;
    apy: number;
    volume24h: bigint;
    fees24h: bigint;
    priceImpact: number;
  } | null {
    const pool = this.pools.get(poolId);
    if (!pool) return null;

    // Calculate price impact for a standard trade (1% of reserves)
    const tradeAmount = pool.reserve0 / BigInt(100);
    const priceImpact = this.calculatePriceImpact(pool, tradeAmount);

    return {
      tvl: pool.totalLiquidity,
      apy: pool.apy,
      volume24h: pool.volume24h,
      fees24h: pool.fees24h,
      priceImpact,
    };
  }

  // Calculate price impact
  private calculatePriceImpact(pool: USDOPool, tradeAmount: bigint): number {
    const k = pool.reserve0 * pool.reserve1;
    const newReserve0 = pool.reserve0 + tradeAmount;
    const newReserve1 = k / newReserve0;
    const priceChange = Number(pool.reserve1 - newReserve1) / Number(pool.reserve1);

    return priceChange * 100; // Return as percentage
  }

  // Swap DGN for USDO
  async swapDGNForUSDO(
    poolId: string,
    userAddress: string,
    dgnAmount: bigint,
    minUSDOAmount: bigint
  ): Promise<{
    success: boolean;
    usdoAmount?: bigint;
    priceImpact?: number;
    message?: string;
  }> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      return {
        success: false,
        message: 'Pool not found',
      };
    }

    // Calculate output amount (constant product formula)
    const k = pool.reserve0 * pool.reserve1;
    const newReserve0 = pool.reserve0 + dgnAmount;
    const newReserve1 = k / newReserve0;
    const usdoAmount = pool.reserve1 - newReserve1;

    // Apply 0.3% fee
    const fee = (usdoAmount * BigInt(3)) / BigInt(1000);
    const usdoAmountAfterFee = usdoAmount - fee;

    // Check slippage
    if (usdoAmountAfterFee < minUSDOAmount) {
      return {
        success: false,
        message: 'Slippage tolerance exceeded',
      };
    }

    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(pool, dgnAmount);

    // Update pool
    pool.reserve0 = newReserve0;
    pool.reserve1 = newReserve1;
    pool.volume24h += dgnAmount;
    pool.fees24h += fee;

    return {
      success: true,
      usdoAmount: usdoAmountAfterFee,
      priceImpact,
    };
  }
}

export const usdoPoolManager = new USDOPoolManager();
