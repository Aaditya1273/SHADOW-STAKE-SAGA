// Guild and Treasury System

import { tokenBurnManager } from './tokenomics';

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-5 character guild tag
  description: string;
  founder: string;
  officers: string[];
  members: string[];
  createdAt: number;
  level: number;
  experience: bigint;
  treasury: GuildTreasury;
  stats: GuildStats;
  settings: GuildSettings;
}

export interface GuildTreasury {
  dgnBalance: bigint;
  sttBalance: bigint;
  usdoBalance: bigint;
  nftRelics: string[]; // Relic IDs
  transactions: TreasuryTransaction[];
}

export interface TreasuryTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'expense';
  amount: bigint;
  currency: 'DGN' | 'STT' | 'USDO';
  from?: string;
  to?: string;
  reason: string;
  timestamp: number;
  approvedBy?: string;
}

export interface GuildStats {
  totalMembers: number;
  totalBossesDefeated: number;
  totalDungeonsCleared: number;
  highestLevel: number;
  totalScore: bigint;
  weeklyActivity: number;
}

export interface GuildSettings {
  isPublic: boolean;
  minLevel: number;
  requiresApproval: boolean;
  taxRate: number; // Percentage of member earnings that go to treasury
  votingThreshold: number; // Percentage of votes needed for decisions
}

export interface GuildMembershipRequest {
  id: string;
  guildId: string;
  applicant: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface GuildProposal {
  id: string;
  guildId: string;
  proposer: string;
  type: 'treasury_withdrawal' | 'member_promotion' | 'member_kick' | 'settings_change';
  title: string;
  description: string;
  data: any; // Proposal-specific data
  votes: {
    for: string[];
    against: string[];
  };
  status: 'active' | 'passed' | 'rejected' | 'executed';
  createdAt: number;
  expiresAt: number;
}

export class GuildManager {
  private guilds: Map<string, Guild>;
  private membershipRequests: Map<string, GuildMembershipRequest[]>;
  private proposals: Map<string, GuildProposal[]>;
  private userGuilds: Map<string, string>; // userAddress -> guildId
  private guildCreationCost = BigInt(5000); // DGN cost to create guild

  constructor() {
    this.guilds = new Map();
    this.membershipRequests = new Map();
    this.proposals = new Map();
    this.userGuilds = new Map();
  }

  // Create a new guild
  createGuild(
    founder: string,
    name: string,
    tag: string,
    description: string,
    settings: Partial<GuildSettings> = {}
  ): {
    success: boolean;
    message: string;
    guild?: Guild;
  } {
    // Validate tag
    if (tag.length < 3 || tag.length > 5) {
      return { success: false, message: 'Guild tag must be 3-5 characters' };
    }

    // Check if user already in a guild
    if (this.userGuilds.has(founder)) {
      return { success: false, message: 'Already in a guild' };
    }

    // Check if tag is taken
    const existingGuild = Array.from(this.guilds.values()).find(
      (g) => g.tag.toLowerCase() === tag.toLowerCase()
    );
    if (existingGuild) {
      return { success: false, message: 'Guild tag already taken' };
    }

    // Burn DGN for guild creation
    tokenBurnManager.recordBurn('guild_creation', this.guildCreationCost);

    const guild: Guild = {
      id: `guild-${Date.now()}-${Math.random()}`,
      name,
      tag: tag.toUpperCase(),
      description,
      founder,
      officers: [founder],
      members: [founder],
      createdAt: Date.now(),
      level: 1,
      experience: BigInt(0),
      treasury: {
        dgnBalance: BigInt(0),
        sttBalance: BigInt(0),
        usdoBalance: BigInt(0),
        nftRelics: [],
        transactions: [],
      },
      stats: {
        totalMembers: 1,
        totalBossesDefeated: 0,
        totalDungeonsCleared: 0,
        highestLevel: 0,
        totalScore: BigInt(0),
        weeklyActivity: 0,
      },
      settings: {
        isPublic: settings.isPublic ?? true,
        minLevel: settings.minLevel ?? 1,
        requiresApproval: settings.requiresApproval ?? false,
        taxRate: settings.taxRate ?? 10,
        votingThreshold: settings.votingThreshold ?? 50,
      },
    };

    this.guilds.set(guild.id, guild);
    this.userGuilds.set(founder, guild.id);

    return {
      success: true,
      message: `Guild created! ${this.guildCreationCost} DGN burned.`,
      guild,
    };
  }

  // Request to join guild
  requestJoinGuild(
    applicant: string,
    guildId: string,
    message: string = ''
  ): {
    success: boolean;
    message: string;
  } {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, message: 'Guild not found' };
    }

    if (this.userGuilds.has(applicant)) {
      return { success: false, message: 'Already in a guild' };
    }

    if (!guild.settings.isPublic) {
      return { success: false, message: 'Guild is private' };
    }

    const request: GuildMembershipRequest = {
      id: `request-${Date.now()}-${Math.random()}`,
      guildId,
      applicant,
      message,
      status: 'pending',
      createdAt: Date.now(),
    };

    const requests = this.membershipRequests.get(guildId) || [];
    requests.push(request);
    this.membershipRequests.set(guildId, requests);

    // Auto-approve if no approval required
    if (!guild.settings.requiresApproval) {
      return this.approveJoinRequest(guild.founder, request.id);
    }

    return {
      success: true,
      message: 'Join request submitted',
    };
  }

  // Approve join request
  approveJoinRequest(
    officer: string,
    requestId: string
  ): {
    success: boolean;
    message: string;
  } {
    let targetRequest: GuildMembershipRequest | undefined;
    let guild: Guild | undefined;

    this.membershipRequests.forEach((requests, guildId) => {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        targetRequest = request;
        guild = this.guilds.get(guildId);
      }
    });

    if (!targetRequest || !guild) {
      return { success: false, message: 'Request not found' };
    }

    if (!guild.officers.includes(officer)) {
      return { success: false, message: 'Only officers can approve requests' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, message: 'Request already processed' };
    }

    // Add member to guild
    guild.members.push(targetRequest.applicant);
    guild.stats.totalMembers++;
    this.userGuilds.set(targetRequest.applicant, guild.id);

    targetRequest.status = 'approved';

    return {
      success: true,
      message: 'Member added to guild',
    };
  }

  // Leave guild
  leaveGuild(
    member: string
  ): {
    success: boolean;
    message: string;
  } {
    const guildId = this.userGuilds.get(member);
    if (!guildId) {
      return { success: false, message: 'Not in a guild' };
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, message: 'Guild not found' };
    }

    if (guild.founder === member) {
      return {
        success: false,
        message: 'Founder cannot leave. Transfer leadership or disband guild.',
      };
    }

    // Remove from members and officers
    guild.members = guild.members.filter((m) => m !== member);
    guild.officers = guild.officers.filter((o) => o !== member);
    guild.stats.totalMembers--;

    this.userGuilds.delete(member);

    return {
      success: true,
      message: 'Left guild successfully',
    };
  }

  // Deposit to guild treasury
  depositToTreasury(
    member: string,
    amount: bigint,
    currency: 'DGN' | 'STT' | 'USDO' = 'DGN'
  ): {
    success: boolean;
    message: string;
  } {
    const guildId = this.userGuilds.get(member);
    if (!guildId) {
      return { success: false, message: 'Not in a guild' };
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, message: 'Guild not found' };
    }

    // Add to treasury
    if (currency === 'DGN') {
      guild.treasury.dgnBalance += amount;
    } else if (currency === 'STT') {
      guild.treasury.sttBalance += amount;
    } else {
      guild.treasury.usdoBalance += amount;
    }

    // Record transaction
    const transaction: TreasuryTransaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      type: 'deposit',
      amount,
      currency,
      from: member,
      reason: 'Member deposit',
      timestamp: Date.now(),
    };

    guild.treasury.transactions.push(transaction);

    return {
      success: true,
      message: `Deposited ${amount} ${currency} to guild treasury`,
    };
  }

  // Create treasury withdrawal proposal
  createWithdrawalProposal(
    proposer: string,
    amount: bigint,
    currency: 'DGN' | 'STT' | 'USDO',
    recipient: string,
    reason: string
  ): {
    success: boolean;
    message: string;
    proposal?: GuildProposal;
  } {
    const guildId = this.userGuilds.get(proposer);
    if (!guildId) {
      return { success: false, message: 'Not in a guild' };
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, message: 'Guild not found' };
    }

    if (!guild.officers.includes(proposer)) {
      return { success: false, message: 'Only officers can create proposals' };
    }

    const proposal: GuildProposal = {
      id: `proposal-${Date.now()}-${Math.random()}`,
      guildId,
      proposer,
      type: 'treasury_withdrawal',
      title: `Withdraw ${amount} ${currency}`,
      description: reason,
      data: { amount, currency, recipient },
      votes: { for: [], against: [] },
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const proposals = this.proposals.get(guildId) || [];
    proposals.push(proposal);
    this.proposals.set(guildId, proposals);

    return {
      success: true,
      message: 'Proposal created',
      proposal,
    };
  }

  // Vote on proposal
  voteOnProposal(
    voter: string,
    proposalId: string,
    vote: 'for' | 'against'
  ): {
    success: boolean;
    message: string;
  } {
    const guildId = this.userGuilds.get(voter);
    if (!guildId) {
      return { success: false, message: 'Not in a guild' };
    }

    const proposals = this.proposals.get(guildId);
    const proposal = proposals?.find((p) => p.id === proposalId);

    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'active') {
      return { success: false, message: 'Proposal is not active' };
    }

    if (Date.now() > proposal.expiresAt) {
      proposal.status = 'rejected';
      return { success: false, message: 'Proposal has expired' };
    }

    // Remove previous vote if exists
    proposal.votes.for = proposal.votes.for.filter((v) => v !== voter);
    proposal.votes.against = proposal.votes.against.filter((v) => v !== voter);

    // Add new vote
    if (vote === 'for') {
      proposal.votes.for.push(voter);
    } else {
      proposal.votes.against.push(voter);
    }

    // Check if proposal passes
    const guild = this.guilds.get(guildId);
    if (guild) {
      const totalVotes = proposal.votes.for.length + proposal.votes.against.length;
      const forPercentage = (proposal.votes.for.length / guild.stats.totalMembers) * 100;

      if (forPercentage >= guild.settings.votingThreshold) {
        proposal.status = 'passed';
        this.executeProposal(proposal, guild);
      }
    }

    return {
      success: true,
      message: 'Vote recorded',
    };
  }

  private executeProposal(proposal: GuildProposal, guild: Guild) {
    if (proposal.type === 'treasury_withdrawal') {
      const { amount, currency, recipient } = proposal.data;

      // Deduct from treasury
      if (currency === 'DGN') {
        guild.treasury.dgnBalance -= amount;
      } else if (currency === 'STT') {
        guild.treasury.sttBalance -= amount;
      } else {
        guild.treasury.usdoBalance -= amount;
      }

      // Record transaction
      const transaction: TreasuryTransaction = {
        id: `tx-${Date.now()}-${Math.random()}`,
        type: 'withdrawal',
        amount,
        currency,
        to: recipient,
        reason: proposal.description,
        timestamp: Date.now(),
        approvedBy: proposal.proposer,
      };

      guild.treasury.transactions.push(transaction);
    }

    proposal.status = 'executed';
  }

  // Record guild activity (boss defeat, dungeon clear, etc.)
  recordGuildActivity(
    member: string,
    activityType: 'boss_defeat' | 'dungeon_clear' | 'score',
    value: number | bigint
  ) {
    const guildId = this.userGuilds.get(member);
    if (!guildId) return;

    const guild = this.guilds.get(guildId);
    if (!guild) return;

    switch (activityType) {
      case 'boss_defeat':
        guild.stats.totalBossesDefeated++;
        guild.experience += BigInt(1000);
        break;
      case 'dungeon_clear':
        guild.stats.totalDungeonsCleared++;
        guild.experience += BigInt(500);
        break;
      case 'score':
        guild.stats.totalScore += BigInt(value);
        guild.experience += BigInt(value) / BigInt(10);
        break;
    }

    // Level up guild
    const expForNextLevel = BigInt(guild.level * 10000);
    if (guild.experience >= expForNextLevel) {
      guild.level++;
      guild.experience -= expForNextLevel;
    }
  }

  // Get guild by ID
  getGuild(guildId: string): Guild | undefined {
    return this.guilds.get(guildId);
  }

  // Get user's guild
  getUserGuild(userAddress: string): Guild | undefined {
    const guildId = this.userGuilds.get(userAddress);
    return guildId ? this.guilds.get(guildId) : undefined;
  }

  // Get all guilds
  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  // Get top guilds by level
  getTopGuilds(limit: number = 10): Guild[] {
    return Array.from(this.guilds.values())
      .sort((a, b) => b.level - a.level || Number(b.experience - a.experience))
      .slice(0, limit);
  }

  // Get guild proposals
  getGuildProposals(guildId: string): GuildProposal[] {
    return this.proposals.get(guildId) || [];
  }

  // Get pending membership requests
  getPendingRequests(guildId: string): GuildMembershipRequest[] {
    const requests = this.membershipRequests.get(guildId) || [];
    return requests.filter((r) => r.status === 'pending');
  }
}

// Singleton instance
export const guildManager = new GuildManager();
