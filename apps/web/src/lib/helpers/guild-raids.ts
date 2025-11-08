// Guild Raids System - Cooperative guild-based boss fights

import type { Guild } from './guilds';
import type { BossType } from './boss';

export interface GuildRaid {
  id: string;
  guildId: string;
  guildName: string;
  bossType: string;
  difficulty: 'normal' | 'hard' | 'nightmare' | 'hell' | 'mythic';
  status: 'preparing' | 'active' | 'completed' | 'failed';
  participants: RaidParticipant[];
  maxParticipants: number;
  bossHealth: bigint;
  bossMaxHealth: bigint;
  startTime?: number;
  endTime?: number;
  createdAt: number;
  rewards: RaidRewards;
  phases: RaidPhase[];
  currentPhase: number;
}

export interface RaidParticipant {
  address: string;
  name: string;
  role: 'tank' | 'dps' | 'healer' | 'support';
  isReady: boolean;
  isAlive: boolean;
  damageDealt: bigint;
  damageTaken: bigint;
  healingDone: bigint;
  deaths: number;
  contribution: number; // 0-100 score
}

export interface RaidPhase {
  phase: number;
  name: string;
  healthThreshold: number; // % of boss health
  mechanics: string[];
  completed: boolean;
}

export interface RaidRewards {
  baseDGN: bigint;
  baseSTT: bigint;
  bonusMultiplier: number;
  guildExperience: bigint;
  individualRewards: Map<string, RaidParticipantReward>;
  guildTreasuryShare: bigint;
  nftDrops: string[];
}

export interface RaidParticipantReward {
  dgn: bigint;
  stt: bigint;
  experience: bigint;
  nftDrop?: string;
  mvpBonus?: bigint;
}

export interface RaidSchedule {
  id: string;
  guildId: string;
  bossType: string;
  difficulty: GuildRaid['difficulty'];
  scheduledTime: number;
  participants: string[];
  status: 'scheduled' | 'started' | 'cancelled';
}

export class GuildRaidManager {
  private raids: Map<string, GuildRaid>;
  private schedules: Map<string, RaidSchedule>;
  private guildRaidHistory: Map<string, GuildRaid[]>; // guildId -> raids

  constructor() {
    this.raids = new Map();
    this.schedules = new Map();
    this.guildRaidHistory = new Map();
  }

  // Create a new raid
  createRaid(
    guildId: string,
    guildName: string,
    bossType: string,
    difficulty: GuildRaid['difficulty'],
    maxParticipants: number = 10
  ): {
    success: boolean;
    message: string;
    raid?: GuildRaid;
  } {
    if (maxParticipants < 3 || maxParticipants > 20) {
      return {
        success: false,
        message: 'Raid size must be between 3 and 20 players',
      };
    }

    const bossHealth = this.calculateBossHealth(bossType, difficulty, maxParticipants);

    const raid: GuildRaid = {
      id: `raid-${Date.now()}-${guildId}`,
      guildId,
      guildName,
      bossType,
      difficulty,
      status: 'preparing',
      participants: [],
      maxParticipants,
      bossHealth,
      bossMaxHealth: bossHealth,
      createdAt: Date.now(),
      rewards: {
        baseDGN: this.calculateBaseReward(difficulty, maxParticipants),
        baseSTT: this.calculateBaseReward(difficulty, maxParticipants) / BigInt(5),
        bonusMultiplier: 1.0,
        guildExperience: BigInt(maxParticipants * 1000),
        individualRewards: new Map(),
        guildTreasuryShare: BigInt(0),
        nftDrops: [],
      },
      phases: this.generateRaidPhases(bossType),
      currentPhase: 0,
    };

    this.raids.set(raid.id, raid);

    return {
      success: true,
      message: 'Raid created successfully',
      raid,
    };
  }

  private calculateBossHealth(
    bossType: string,
    difficulty: string,
    participants: number
  ): bigint {
    const baseHealth: Record<string, bigint> = {
      'skeleton-king': BigInt(10000),
      'shadow-lord': BigInt(20000),
      'elemental-titan': BigInt(30000),
      'necro-overlord': BigInt(50000),
    };

    const difficultyMultiplier: Record<string, number> = {
      normal: 1,
      hard: 2,
      nightmare: 4,
      hell: 8,
      mythic: 16,
    };

    const base = baseHealth[bossType] || BigInt(10000);
    const diffMult = difficultyMultiplier[difficulty] || 1;
    const participantMult = Math.sqrt(participants);

    return base * BigInt(diffMult) * BigInt(Math.floor(participantMult));
  }

  private calculateBaseReward(
    difficulty: string,
    participants: number
  ): bigint {
    const baseRewards: Record<string, bigint> = {
      normal: BigInt(5000),
      hard: BigInt(15000),
      nightmare: BigInt(40000),
      hell: BigInt(100000),
      mythic: BigInt(250000),
    };

    return (baseRewards[difficulty] || BigInt(5000)) * BigInt(participants);
  }

  private generateRaidPhases(bossType: string): RaidPhase[] {
    const phases: Record<string, RaidPhase[]> = {
      'skeleton-king': [
        {
          phase: 1,
          name: 'The Awakening',
          healthThreshold: 100,
          mechanics: ['Summon Skeletons', 'Ground Slam'],
          completed: false,
        },
        {
          phase: 2,
          name: 'Royal Fury',
          healthThreshold: 50,
          mechanics: ['Summon Archers', 'Whirlwind Attack', 'Shield Wall'],
          completed: false,
        },
        {
          phase: 3,
          name: 'Last Stand',
          healthThreshold: 25,
          mechanics: [
            'Summon All Minions',
            'Enrage',
            'Death Grip',
            'Execute',
          ],
          completed: false,
        },
      ],
      'shadow-lord': [
        {
          phase: 1,
          name: 'Shadow Realm',
          healthThreshold: 100,
          mechanics: ['Shadow Step', 'Dark Bolt'],
          completed: false,
        },
        {
          phase: 2,
          name: 'Void Corruption',
          healthThreshold: 60,
          mechanics: ['Void Zone', 'Shadow Clone', 'Darkness'],
          completed: false,
        },
        {
          phase: 3,
          name: 'Eternal Night',
          healthThreshold: 30,
          mechanics: ['Mass Teleport', 'Shadow Nova', 'Void Collapse'],
          completed: false,
        },
      ],
      'elemental-titan': [
        {
          phase: 1,
          name: 'Elemental Wrath',
          healthThreshold: 100,
          mechanics: ['Fire Blast', 'Ice Spike', 'Lightning Strike'],
          completed: false,
        },
        {
          phase: 2,
          name: 'Primal Fury',
          healthThreshold: 66,
          mechanics: ['Elemental Shield', 'Storm', 'Earthquake'],
          completed: false,
        },
        {
          phase: 3,
          name: 'Cataclysm',
          healthThreshold: 33,
          mechanics: ['Meteor', 'Tsunami', 'Tornado', 'Volcanic Eruption'],
          completed: false,
        },
      ],
      'necro-overlord': [
        {
          phase: 1,
          name: 'Death\'s Herald',
          healthThreshold: 100,
          mechanics: ['Raise Dead', 'Life Drain', 'Curse'],
          completed: false,
        },
        {
          phase: 2,
          name: 'Undead Legion',
          healthThreshold: 75,
          mechanics: ['Mass Resurrection', 'Plague', 'Soul Harvest'],
          completed: false,
        },
        {
          phase: 3,
          name: 'Veil Shatter',
          healthThreshold: 50,
          mechanics: ['Reality Break', 'Death Coil', 'Lich Form'],
          completed: false,
        },
        {
          phase: 4,
          name: 'Apocalypse',
          healthThreshold: 25,
          mechanics: [
            'Summon All Undead',
            'Death and Decay',
            'Soul Explosion',
            'Final Curse',
          ],
          completed: false,
        },
      ],
    };

    return phases[bossType] || phases['skeleton-king']!;
  }

  // Join raid
  joinRaid(
    raidId: string,
    playerAddress: string,
    playerName: string,
    role: RaidParticipant['role']
  ): {
    success: boolean;
    message: string;
  } {
    const raid = this.raids.get(raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found' };
    }

    if (raid.status !== 'preparing') {
      return { success: false, message: 'Raid already started' };
    }

    if (raid.participants.length >= raid.maxParticipants) {
      return { success: false, message: 'Raid is full' };
    }

    const existing = raid.participants.find((p) => p.address === playerAddress);
    if (existing) {
      return { success: false, message: 'Already in raid' };
    }

    const participant: RaidParticipant = {
      address: playerAddress,
      name: playerName,
      role,
      isReady: false,
      isAlive: true,
      damageDealt: BigInt(0),
      damageTaken: BigInt(0),
      healingDone: BigInt(0),
      deaths: 0,
      contribution: 0,
    };

    raid.participants.push(participant);

    return { success: true, message: 'Joined raid successfully' };
  }

  // Leave raid
  leaveRaid(
    raidId: string,
    playerAddress: string
  ): {
    success: boolean;
    message: string;
  } {
    const raid = this.raids.get(raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found' };
    }

    if (raid.status !== 'preparing') {
      return { success: false, message: 'Cannot leave active raid' };
    }

    raid.participants = raid.participants.filter(
      (p) => p.address !== playerAddress
    );

    return { success: true, message: 'Left raid successfully' };
  }

  // Toggle ready
  toggleReady(
    raidId: string,
    playerAddress: string
  ): {
    success: boolean;
    message: string;
    allReady?: boolean;
  } {
    const raid = this.raids.get(raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found' };
    }

    const participant = raid.participants.find((p) => p.address === playerAddress);
    if (!participant) {
      return { success: false, message: 'Not in raid' };
    }

    participant.isReady = !participant.isReady;

    const allReady = raid.participants.every((p) => p.isReady);

    return {
      success: true,
      message: participant.isReady ? 'Ready!' : 'Not ready',
      allReady,
    };
  }

  // Start raid
  startRaid(raidId: string): {
    success: boolean;
    message: string;
  } {
    const raid = this.raids.get(raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found' };
    }

    if (raid.status !== 'preparing') {
      return { success: false, message: 'Raid already started' };
    }

    if (raid.participants.length < 3) {
      return { success: false, message: 'Need at least 3 participants' };
    }

    const allReady = raid.participants.every((p) => p.isReady);
    if (!allReady) {
      return { success: false, message: 'Not all participants are ready' };
    }

    raid.status = 'active';
    raid.startTime = Date.now();

    return { success: true, message: 'Raid started!' };
  }

  // Deal damage to boss
  dealDamage(
    raidId: string,
    playerAddress: string,
    damage: bigint
  ): {
    success: boolean;
    message: string;
    phaseChanged?: boolean;
    newPhase?: number;
  } {
    const raid = this.raids.get(raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found' };
    }

    if (raid.status !== 'active') {
      return { success: false, message: 'Raid not active' };
    }

    const participant = raid.participants.find((p) => p.address === playerAddress);
    if (!participant || !participant.isAlive) {
      return { success: false, message: 'Cannot deal damage' };
    }

    // Apply damage
    raid.bossHealth = raid.bossHealth > damage ? raid.bossHealth - damage : BigInt(0);
    participant.damageDealt += damage;

    // Check for phase transition
    const healthPercent =
      (Number(raid.bossHealth) / Number(raid.bossMaxHealth)) * 100;
    let phaseChanged = false;
    let newPhase = raid.currentPhase;

    for (let i = raid.currentPhase; i < raid.phases.length; i++) {
      const phase = raid.phases[i]!;
      if (healthPercent <= phase.healthThreshold && !phase.completed) {
        phase.completed = true;
        raid.currentPhase = i + 1;
        phaseChanged = true;
        newPhase = i + 1;
        break;
      }
    }

    // Check if boss defeated
    if (raid.bossHealth === BigInt(0)) {
      this.completeRaid(raidId, true);
    }

    return {
      success: true,
      message: 'Damage dealt',
      phaseChanged,
      newPhase: phaseChanged ? newPhase : undefined,
    };
  }

  // Record participant death
  recordDeath(raidId: string, playerAddress: string) {
    const raid = this.raids.get(raidId);
    if (!raid) return;

    const participant = raid.participants.find((p) => p.address === playerAddress);
    if (participant) {
      participant.isAlive = false;
      participant.deaths++;
    }

    // Check if all participants dead
    const allDead = raid.participants.every((p) => !p.isAlive);
    if (allDead) {
      this.completeRaid(raidId, false);
    }
  }

  // Revive participant
  reviveParticipant(raidId: string, playerAddress: string) {
    const raid = this.raids.get(raidId);
    if (!raid) return;

    const participant = raid.participants.find((p) => p.address === playerAddress);
    if (participant) {
      participant.isAlive = true;
    }
  }

  // Complete raid
  private completeRaid(raidId: string, success: boolean) {
    const raid = this.raids.get(raidId);
    if (!raid) return;

    raid.status = success ? 'completed' : 'failed';
    raid.endTime = Date.now();

    if (success) {
      // Calculate rewards
      this.calculateRaidRewards(raid);

      // Add to guild history
      const history = this.guildRaidHistory.get(raid.guildId) || [];
      history.push(raid);
      this.guildRaidHistory.set(raid.guildId, history);
    }
  }

  private calculateRaidRewards(raid: GuildRaid) {
    const totalDamage = raid.participants.reduce(
      (sum, p) => sum + p.damageDealt,
      BigInt(0)
    );

    // Calculate contribution scores
    raid.participants.forEach((participant) => {
      const damageContribution =
        Number(participant.damageDealt) / Number(totalDamage);
      const healingContribution =
        Number(participant.healingDone) / Number(totalDamage);
      const survivalBonus = participant.deaths === 0 ? 0.1 : 0;

      participant.contribution = Math.floor(
        (damageContribution + healingContribution + survivalBonus) * 100
      );
    });

    // Distribute rewards
    const totalDGN = raid.rewards.baseDGN * BigInt(Math.floor(raid.rewards.bonusMultiplier * 100)) / BigInt(100);
    const totalSTT = raid.rewards.baseSTT * BigInt(Math.floor(raid.rewards.bonusMultiplier * 100)) / BigInt(100);

    // 20% to guild treasury
    raid.rewards.guildTreasuryShare = totalDGN / BigInt(5);
    const playerPool = totalDGN - raid.rewards.guildTreasuryShare;

    // Find MVP
    const mvp = raid.participants.reduce((best, p) =>
      p.contribution > best.contribution ? p : best
    );

    raid.participants.forEach((participant) => {
      const share = participant.contribution / 100;
      const dgnReward = BigInt(Math.floor(Number(playerPool) * share));
      const sttReward = BigInt(Math.floor(Number(totalSTT) * share));
      const mvpBonus = participant.address === mvp.address ? dgnReward / BigInt(10) : undefined;

      raid.rewards.individualRewards.set(participant.address, {
        dgn: dgnReward + (mvpBonus || BigInt(0)),
        stt: sttReward,
        experience: BigInt(participant.contribution * 100),
        mvpBonus,
      });
    });
  }

  // Get raid
  getRaid(raidId: string): GuildRaid | undefined {
    return this.raids.get(raidId);
  }

  // Get guild raids
  getGuildRaids(guildId: string): GuildRaid[] {
    return Array.from(this.raids.values()).filter((r) => r.guildId === guildId);
  }

  // Get guild raid history
  getGuildRaidHistory(guildId: string): GuildRaid[] {
    return this.guildRaidHistory.get(guildId) || [];
  }

  // Schedule raid
  scheduleRaid(
    guildId: string,
    bossType: string,
    difficulty: GuildRaid['difficulty'],
    scheduledTime: number
  ): {
    success: boolean;
    message: string;
    schedule?: RaidSchedule;
  } {
    const schedule: RaidSchedule = {
      id: `schedule-${Date.now()}-${guildId}`,
      guildId,
      bossType,
      difficulty,
      scheduledTime,
      participants: [],
      status: 'scheduled',
    };

    this.schedules.set(schedule.id, schedule);

    return {
      success: true,
      message: 'Raid scheduled successfully',
      schedule,
    };
  }

  // Get scheduled raids
  getScheduledRaids(guildId: string): RaidSchedule[] {
    return Array.from(this.schedules.values()).filter(
      (s) => s.guildId === guildId && s.status === 'scheduled'
    );
  }
}

// Singleton instance
export const guildRaidManager = new GuildRaidManager();
