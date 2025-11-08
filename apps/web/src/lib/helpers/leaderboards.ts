// Shared Leaderboards with Rewards System

export interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  score: bigint;
  level: number;
  bossesDefeated: number;
  dungeonsCleared: number;
  guildId?: string;
  guildName?: string;
  lastUpdated: number;
  streak: number; // Consecutive days played
  achievements: string[];
}

export interface LeaderboardReward {
  rank: number;
  dgnReward: bigint;
  sttReward: bigint;
  nftReward?: string;
  title?: string;
  badge?: string;
}

export type LeaderboardType =
  | 'global'
  | 'weekly'
  | 'monthly'
  | 'guild'
  | 'boss_kills'
  | 'speed_run'
  | 'hardcore';

export interface LeaderboardSeason {
  id: string;
  type: LeaderboardType;
  startTime: number;
  endTime: number;
  status: 'active' | 'ended' | 'rewarded';
  totalPrizePool: bigint;
  entries: LeaderboardEntry[];
  rewards: LeaderboardReward[];
}

export class LeaderboardManager {
  private leaderboards: Map<LeaderboardType, LeaderboardEntry[]>;
  private seasons: Map<string, LeaderboardSeason>;
  private userEntries: Map<string, Map<LeaderboardType, LeaderboardEntry>>;

  constructor() {
    this.leaderboards = new Map();
    this.seasons = new Map();
    this.userEntries = new Map();

    // Initialize leaderboard types
    const types: LeaderboardType[] = [
      'global',
      'weekly',
      'monthly',
      'guild',
      'boss_kills',
      'speed_run',
      'hardcore',
    ];

    types.forEach((type) => {
      this.leaderboards.set(type, []);
    });

    // Create initial seasons
    this.createSeason('weekly', 7);
    this.createSeason('monthly', 30);
  }

  // Create a new season
  createSeason(
    type: LeaderboardType,
    durationDays: number
  ): LeaderboardSeason {
    const now = Date.now();
    const season: LeaderboardSeason = {
      id: `season-${type}-${now}`,
      type,
      startTime: now,
      endTime: now + durationDays * 24 * 60 * 60 * 1000,
      status: 'active',
      totalPrizePool: this.calculatePrizePool(type),
      entries: [],
      rewards: this.generateRewards(type),
    };

    this.seasons.set(season.id, season);
    return season;
  }

  private calculatePrizePool(type: LeaderboardType): bigint {
    const basePools: Record<LeaderboardType, bigint> = {
      global: BigInt(1000000),
      weekly: BigInt(50000),
      monthly: BigInt(200000),
      guild: BigInt(100000),
      boss_kills: BigInt(75000),
      speed_run: BigInt(50000),
      hardcore: BigInt(150000),
    };

    return basePools[type];
  }

  private generateRewards(type: LeaderboardType): LeaderboardReward[] {
    const prizePool = this.calculatePrizePool(type);
    const rewards: LeaderboardReward[] = [];

    // Top 100 get rewards
    const distribution = [
      { rank: 1, share: 0.25, title: '🥇 Champion', badge: 'champion' },
      { rank: 2, share: 0.15, title: '🥈 Master', badge: 'master' },
      { rank: 3, share: 0.1, title: '🥉 Expert', badge: 'expert' },
      { rank: 4, share: 0.05 },
      { rank: 5, share: 0.05 },
      { rank: 10, share: 0.03 }, // Ranks 6-10
      { rank: 20, share: 0.02 }, // Ranks 11-20
      { rank: 50, share: 0.01 }, // Ranks 21-50
      { rank: 100, share: 0.005 }, // Ranks 51-100
    ];

    distribution.forEach((dist, index) => {
      const dgnReward =
        (prizePool * BigInt(Math.floor(dist.share * 1000))) / BigInt(1000);
      const sttReward = dgnReward / BigInt(10); // 10% in STT

      if (index === 0) {
        // Rank 1
        rewards.push({
          rank: 1,
          dgnReward,
          sttReward,
          nftReward: 'legendary-trophy',
          title: dist.title,
          badge: dist.badge,
        });
      } else if (index < 3) {
        // Ranks 2-3
        rewards.push({
          rank: dist.rank,
          dgnReward,
          sttReward,
          nftReward: 'epic-trophy',
          title: dist.title,
          badge: dist.badge,
        });
      } else if (index < 5) {
        // Ranks 4-5
        rewards.push({
          rank: dist.rank,
          dgnReward,
          sttReward,
          nftReward: 'rare-trophy',
        });
      } else {
        // Distribute to range
        const prevRank = index > 0 ? distribution[index - 1]!.rank : 0;
        const rangeSize = dist.rank - prevRank;
        const rewardPerRank = dgnReward / BigInt(rangeSize);

        for (let rank = prevRank + 1; rank <= dist.rank; rank++) {
          rewards.push({
            rank,
            dgnReward: rewardPerRank,
            sttReward: rewardPerRank / BigInt(10),
          });
        }
      }
    });

    return rewards;
  }

  // Update or create leaderboard entry
  updateEntry(
    address: string,
    name: string,
    type: LeaderboardType,
    data: {
      score?: bigint;
      level?: number;
      bossesDefeated?: number;
      dungeonsCleared?: number;
      guildId?: string;
      guildName?: string;
    }
  ): LeaderboardEntry {
    const leaderboard = this.leaderboards.get(type) || [];
    let entry = leaderboard.find((e) => e.address === address);

    if (!entry) {
      entry = {
        rank: 0,
        address,
        name,
        score: BigInt(0),
        level: 0,
        bossesDefeated: 0,
        dungeonsCleared: 0,
        lastUpdated: Date.now(),
        streak: 1,
        achievements: [],
      };
      leaderboard.push(entry);
    }

    // Update entry
    if (data.score !== undefined) entry.score = data.score;
    if (data.level !== undefined) entry.level = data.level;
    if (data.bossesDefeated !== undefined)
      entry.bossesDefeated = data.bossesDefeated;
    if (data.dungeonsCleared !== undefined)
      entry.dungeonsCleared = data.dungeonsCleared;
    if (data.guildId !== undefined) entry.guildId = data.guildId;
    if (data.guildName !== undefined) entry.guildName = data.guildName;

    entry.lastUpdated = Date.now();

    // Update streak
    const lastUpdate = new Date(entry.lastUpdated);
    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysDiff === 1) {
      entry.streak++;
    } else if (daysDiff > 1) {
      entry.streak = 1;
    }

    // Recalculate ranks
    this.recalculateRanks(type);

    // Store user entry
    const userEntries = this.userEntries.get(address) || new Map();
    userEntries.set(type, entry);
    this.userEntries.set(address, userEntries);

    return entry;
  }

  private recalculateRanks(type: LeaderboardType) {
    const leaderboard = this.leaderboards.get(type);
    if (!leaderboard) return;

    // Sort by score descending
    leaderboard.sort((a, b) => {
      if (a.score > b.score) return -1;
      if (a.score < b.score) return 1;
      return 0;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  // Get leaderboard
  getLeaderboard(
    type: LeaderboardType,
    limit: number = 100,
    offset: number = 0
  ): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(type) || [];
    return leaderboard.slice(offset, offset + limit);
  }

  // Get user's rank
  getUserRank(
    address: string,
    type: LeaderboardType
  ): LeaderboardEntry | null {
    const leaderboard = this.leaderboards.get(type) || [];
    return leaderboard.find((e) => e.address === address) || null;
  }

  // Get users around a specific rank
  getLeaderboardContext(
    address: string,
    type: LeaderboardType,
    range: number = 5
  ): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(type) || [];
    const userEntry = leaderboard.find((e) => e.address === address);

    if (!userEntry) return [];

    const startIndex = Math.max(0, userEntry.rank - range - 1);
    const endIndex = Math.min(leaderboard.length, userEntry.rank + range);

    return leaderboard.slice(startIndex, endIndex);
  }

  // End season and distribute rewards
  endSeason(seasonId: string): {
    success: boolean;
    message: string;
    rewards?: Map<string, { dgn: bigint; stt: bigint; nft?: string }>;
  } {
    const season = this.seasons.get(seasonId);
    if (!season) {
      return { success: false, message: 'Season not found' };
    }

    if (season.status !== 'active') {
      return { success: false, message: 'Season already ended' };
    }

    season.status = 'ended';

    // Get final standings
    const leaderboard = this.leaderboards.get(season.type) || [];
    season.entries = [...leaderboard];

    // Distribute rewards
    const rewards = new Map<
      string,
      { dgn: bigint; stt: bigint; nft?: string; title?: string; badge?: string }
    >();

    season.rewards.forEach((reward) => {
      const entry = season.entries.find((e) => e.rank === reward.rank);
      if (entry) {
        rewards.set(entry.address, {
          dgn: reward.dgnReward,
          stt: reward.sttReward,
          nft: reward.nftReward,
          title: reward.title,
          badge: reward.badge,
        });

        // Add achievement
        if (reward.title) {
          entry.achievements.push(reward.title);
        }
      }
    });

    season.status = 'rewarded';

    // Create new season
    const durationDays = season.type === 'weekly' ? 7 : 30;
    this.createSeason(season.type, durationDays);

    return {
      success: true,
      message: 'Season ended and rewards distributed',
      rewards,
    };
  }

  // Get active seasons
  getActiveSeasons(): LeaderboardSeason[] {
    return Array.from(this.seasons.values()).filter((s) => s.status === 'active');
  }

  // Get season by ID
  getSeason(seasonId: string): LeaderboardSeason | undefined {
    return this.seasons.get(seasonId);
  }

  // Get user's all-time stats
  getUserStats(address: string): {
    totalScore: bigint;
    highestRank: number;
    seasonsParticipated: number;
    totalRewardsEarned: bigint;
    achievements: string[];
    currentStreak: number;
  } {
    const userEntries = this.userEntries.get(address);
    if (!userEntries) {
      return {
        totalScore: BigInt(0),
        highestRank: 0,
        seasonsParticipated: 0,
        totalRewardsEarned: BigInt(0),
        achievements: [],
        currentStreak: 0,
      };
    }

    let totalScore = BigInt(0);
    let highestRank = Infinity;
    let achievements: string[] = [];
    let currentStreak = 0;

    userEntries.forEach((entry) => {
      totalScore += entry.score;
      if (entry.rank > 0 && entry.rank < highestRank) {
        highestRank = entry.rank;
      }
      achievements = [...achievements, ...entry.achievements];
      if (entry.streak > currentStreak) {
        currentStreak = entry.streak;
      }
    });

    return {
      totalScore,
      highestRank: highestRank === Infinity ? 0 : highestRank,
      seasonsParticipated: userEntries.size,
      totalRewardsEarned: BigInt(0), // Would track from reward history
      achievements: [...new Set(achievements)],
      currentStreak,
    };
  }

  // Get top guilds
  getTopGuilds(limit: number = 10): Array<{
    guildId: string;
    guildName: string;
    totalScore: bigint;
    memberCount: number;
    avgScore: bigint;
  }> {
    const guildLeaderboard = this.leaderboards.get('guild') || [];
    const guildStats = new Map<
      string,
      {
        guildId: string;
        guildName: string;
        totalScore: bigint;
        memberCount: number;
      }
    >();

    guildLeaderboard.forEach((entry) => {
      if (entry.guildId && entry.guildName) {
        const existing = guildStats.get(entry.guildId);
        if (existing) {
          existing.totalScore += entry.score;
          existing.memberCount++;
        } else {
          guildStats.set(entry.guildId, {
            guildId: entry.guildId,
            guildName: entry.guildName,
            totalScore: entry.score,
            memberCount: 1,
          });
        }
      }
    });

    return Array.from(guildStats.values())
      .map((guild) => ({
        ...guild,
        avgScore: guild.totalScore / BigInt(guild.memberCount),
      }))
      .sort((a, b) => (a.totalScore > b.totalScore ? -1 : 1))
      .slice(0, limit);
  }

  // Get milestone rewards
  checkMilestones(address: string): Array<{
    milestone: string;
    reward: bigint;
    achieved: boolean;
  }> {
    const stats = this.getUserStats(address);
    const milestones = [
      {
        milestone: 'First Blood',
        requirement: BigInt(1000),
        reward: BigInt(100),
      },
      {
        milestone: 'Rising Star',
        requirement: BigInt(10000),
        reward: BigInt(500),
      },
      {
        milestone: 'Veteran',
        requirement: BigInt(50000),
        reward: BigInt(2000),
      },
      {
        milestone: 'Legend',
        requirement: BigInt(100000),
        reward: BigInt(5000),
      },
      {
        milestone: 'Mythic',
        requirement: BigInt(500000),
        reward: BigInt(25000),
      },
    ];

    return milestones.map((m) => ({
      milestone: m.milestone,
      reward: m.reward,
      achieved: stats.totalScore >= m.requirement,
    }));
  }
}

// Singleton instance
export const leaderboardManager = new LeaderboardManager();
