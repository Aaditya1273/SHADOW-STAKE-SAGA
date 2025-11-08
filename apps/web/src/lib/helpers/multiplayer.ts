// Multiplayer and Co-op System

export interface MultiplayerSession {
  id: string;
  hostAddress: string;
  hostName: string;
  mode: 'co-op' | 'pvp' | 'raid';
  maxPlayers: number;
  currentPlayers: Player[];
  difficulty: 'normal' | 'hard' | 'nightmare' | 'hell';
  level: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  isPrivate: boolean;
  password?: string;
  rewards: SessionRewards;
}

export interface Player {
  address: string;
  name: string;
  level: number;
  class: PlayerClass;
  stats: PlayerStats;
  isReady: boolean;
  isAlive: boolean;
  score: number;
  kills: number;
  deaths: number;
  damageDealt: bigint;
  damageTaken: bigint;
  healingDone: bigint;
}

export type PlayerClass = 'warrior' | 'mage' | 'ranger' | 'rogue' | 'cleric';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  damage: number;
  defense: number;
  speed: number;
  critChance: number;
}

export interface SessionRewards {
  baseReward: bigint;
  bonusMultiplier: number;
  totalReward: bigint;
  distribution: 'equal' | 'performance' | 'contribution';
  individualRewards: Map<string, bigint>;
}

export interface CoOpAction {
  id: string;
  sessionId: string;
  playerAddress: string;
  type: 'move' | 'attack' | 'heal' | 'revive' | 'use_ability' | 'chat';
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface ReviveRequest {
  id: string;
  sessionId: string;
  deadPlayer: string;
  revivedBy?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export class MultiplayerManager {
  private sessions: Map<string, MultiplayerSession>;
  private playerSessions: Map<string, string>; // playerAddress -> sessionId
  private actions: Map<string, CoOpAction[]>; // sessionId -> actions
  private reviveRequests: Map<string, ReviveRequest[]>;

  constructor() {
    this.sessions = new Map();
    this.playerSessions = new Map();
    this.actions = new Map();
    this.reviveRequests = new Map();
  }

  // Create a new multiplayer session
  createSession(
    hostAddress: string,
    hostName: string,
    mode: MultiplayerSession['mode'],
    maxPlayers: number = 4,
    difficulty: MultiplayerSession['difficulty'] = 'normal',
    isPrivate: boolean = false,
    password?: string
  ): {
    success: boolean;
    message: string;
    session?: MultiplayerSession;
  } {
    if (this.playerSessions.has(hostAddress)) {
      return { success: false, message: 'Already in a session' };
    }

    if (maxPlayers < 2 || maxPlayers > 8) {
      return { success: false, message: 'Max players must be between 2 and 8' };
    }

    const host: Player = {
      address: hostAddress,
      name: hostName,
      level: 1,
      class: 'warrior',
      stats: {
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        damage: 30,
        defense: 10,
        speed: 100,
        critChance: 5,
      },
      isReady: true,
      isAlive: true,
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: BigInt(0),
      damageTaken: BigInt(0),
      healingDone: BigInt(0),
    };

    const session: MultiplayerSession = {
      id: `session-${Date.now()}-${Math.random()}`,
      hostAddress,
      hostName,
      mode,
      maxPlayers,
      currentPlayers: [host],
      difficulty,
      level: 1,
      status: 'waiting',
      createdAt: Date.now(),
      isPrivate,
      password,
      rewards: {
        baseReward: BigInt(1000),
        bonusMultiplier: 1.0,
        totalReward: BigInt(0),
        distribution: 'equal',
        individualRewards: new Map(),
      },
    };

    this.sessions.set(session.id, session);
    this.playerSessions.set(hostAddress, session.id);

    return {
      success: true,
      message: 'Session created successfully',
      session,
    };
  }

  // Join an existing session
  joinSession(
    playerAddress: string,
    playerName: string,
    sessionId: string,
    password?: string
  ): {
    success: boolean;
    message: string;
    session?: MultiplayerSession;
  } {
    if (this.playerSessions.has(playerAddress)) {
      return { success: false, message: 'Already in a session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.status !== 'waiting') {
      return { success: false, message: 'Session already started' };
    }

    if (session.currentPlayers.length >= session.maxPlayers) {
      return { success: false, message: 'Session is full' };
    }

    if (session.isPrivate && session.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    const player: Player = {
      address: playerAddress,
      name: playerName,
      level: 1,
      class: 'warrior',
      stats: {
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        damage: 30,
        defense: 10,
        speed: 100,
        critChance: 5,
      },
      isReady: false,
      isAlive: true,
      score: 0,
      kills: 0,
      deaths: 0,
      damageDealt: BigInt(0),
      damageTaken: BigInt(0),
      healingDone: BigInt(0),
    };

    session.currentPlayers.push(player);
    this.playerSessions.set(playerAddress, sessionId);

    return {
      success: true,
      message: 'Joined session successfully',
      session,
    };
  }

  // Leave session
  leaveSession(
    playerAddress: string
  ): {
    success: boolean;
    message: string;
  } {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) {
      return { success: false, message: 'Not in a session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    // Remove player
    session.currentPlayers = session.currentPlayers.filter(
      (p) => p.address !== playerAddress
    );
    this.playerSessions.delete(playerAddress);

    // If host leaves, transfer to another player or close session
    if (session.hostAddress === playerAddress) {
      if (session.currentPlayers.length > 0) {
        session.hostAddress = session.currentPlayers[0]!.address;
        session.hostName = session.currentPlayers[0]!.name;
      } else {
        // No players left, delete session
        this.sessions.delete(sessionId);
        return { success: true, message: 'Session closed' };
      }
    }

    return { success: true, message: 'Left session successfully' };
  }

  // Toggle player ready status
  toggleReady(
    playerAddress: string
  ): {
    success: boolean;
    message: string;
    allReady?: boolean;
  } {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) {
      return { success: false, message: 'Not in a session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    const player = session.currentPlayers.find((p) => p.address === playerAddress);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    player.isReady = !player.isReady;

    // Check if all players are ready
    const allReady = session.currentPlayers.every((p) => p.isReady);

    return {
      success: true,
      message: player.isReady ? 'Ready!' : 'Not ready',
      allReady,
    };
  }

  // Start session
  startSession(
    hostAddress: string
  ): {
    success: boolean;
    message: string;
  } {
    const sessionId = this.playerSessions.get(hostAddress);
    if (!sessionId) {
      return { success: false, message: 'Not in a session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.hostAddress !== hostAddress) {
      return { success: false, message: 'Only host can start session' };
    }

    if (session.currentPlayers.length < 2) {
      return { success: false, message: 'Need at least 2 players' };
    }

    const allReady = session.currentPlayers.every((p) => p.isReady);
    if (!allReady) {
      return { success: false, message: 'Not all players are ready' };
    }

    session.status = 'in-progress';
    session.startedAt = Date.now();

    return { success: true, message: 'Session started!' };
  }

  // Record player action
  recordAction(
    playerAddress: string,
    type: CoOpAction['type'],
    data: any
  ): CoOpAction | null {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) return null;

    const action: CoOpAction = {
      id: `action-${Date.now()}-${Math.random()}`,
      sessionId,
      playerAddress,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    const sessionActions = this.actions.get(sessionId) || [];
    sessionActions.push(action);
    this.actions.set(sessionId, sessionActions);

    return action;
  }

  // Get session actions (for syncing)
  getSessionActions(
    sessionId: string,
    since?: number
  ): CoOpAction[] {
    const actions = this.actions.get(sessionId) || [];
    if (since) {
      return actions.filter((a) => a.timestamp > since);
    }
    return actions;
  }

  // Request revive
  requestRevive(
    deadPlayer: string,
    revivedBy: string
  ): {
    success: boolean;
    message: string;
    request?: ReviveRequest;
  } {
    const sessionId = this.playerSessions.get(deadPlayer);
    if (!sessionId) {
      return { success: false, message: 'Not in a session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    const player = session.currentPlayers.find((p) => p.address === deadPlayer);
    if (!player || player.isAlive) {
      return { success: false, message: 'Player is not dead' };
    }

    const request: ReviveRequest = {
      id: `revive-${Date.now()}-${Math.random()}`,
      sessionId,
      deadPlayer,
      revivedBy,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30000, // 30 seconds
    };

    const requests = this.reviveRequests.get(sessionId) || [];
    requests.push(request);
    this.reviveRequests.set(sessionId, requests);

    return {
      success: true,
      message: 'Revive request sent',
      request,
    };
  }

  // Accept revive
  acceptRevive(
    requestId: string
  ): {
    success: boolean;
    message: string;
  } {
    let targetRequest: ReviveRequest | undefined;
    let session: MultiplayerSession | undefined;

    this.reviveRequests.forEach((requests, sessionId) => {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        targetRequest = request;
        session = this.sessions.get(sessionId);
      }
    });

    if (!targetRequest || !session) {
      return { success: false, message: 'Request not found' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, message: 'Request already processed' };
    }

    if (Date.now() > targetRequest.expiresAt) {
      targetRequest.status = 'expired';
      return { success: false, message: 'Request expired' };
    }

    const player = session.currentPlayers.find(
      (p) => p.address === targetRequest!.deadPlayer
    );
    if (player) {
      player.isAlive = true;
      player.stats.health = player.stats.maxHealth * 0.5; // Revive at 50% HP
      targetRequest.status = 'accepted';
    }

    return { success: true, message: 'Player revived!' };
  }

  // Update player stats
  updatePlayerStats(
    playerAddress: string,
    stats: Partial<PlayerStats>
  ) {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.currentPlayers.find((p) => p.address === playerAddress);
    if (player) {
      player.stats = { ...player.stats, ...stats };
    }
  }

  // Record player death
  recordDeath(playerAddress: string) {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.currentPlayers.find((p) => p.address === playerAddress);
    if (player) {
      player.isAlive = false;
      player.deaths++;
    }
  }

  // Record kill
  recordKill(playerAddress: string) {
    const sessionId = this.playerSessions.get(playerAddress);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.currentPlayers.find((p) => p.address === playerAddress);
    if (player) {
      player.kills++;
      player.score += 100;
    }
  }

  // Complete session
  completeSession(
    sessionId: string,
    success: boolean
  ): {
    success: boolean;
    message: string;
    rewards?: Map<string, bigint>;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    session.status = success ? 'completed' : 'failed';
    session.completedAt = Date.now();

    if (success) {
      // Calculate rewards
      const rewards = this.calculateRewards(session);
      session.rewards.individualRewards = rewards;

      return {
        success: true,
        message: 'Session completed!',
        rewards,
      };
    }

    return { success: true, message: 'Session failed' };
  }

  private calculateRewards(session: MultiplayerSession): Map<string, bigint> {
    const rewards = new Map<string, bigint>();
    const baseReward = session.rewards.baseReward;
    const multiplier = session.rewards.bonusMultiplier;

    if (session.rewards.distribution === 'equal') {
      const rewardPerPlayer =
        (baseReward * BigInt(Math.floor(multiplier * 100))) /
        BigInt(100 * session.currentPlayers.length);

      session.currentPlayers.forEach((player) => {
        rewards.set(player.address, rewardPerPlayer);
      });
    } else if (session.rewards.distribution === 'performance') {
      const totalScore = session.currentPlayers.reduce(
        (sum, p) => sum + p.score,
        0
      );

      session.currentPlayers.forEach((player) => {
        const playerShare = player.score / totalScore;
        const reward =
          (baseReward * BigInt(Math.floor(playerShare * multiplier * 100))) /
          BigInt(100);
        rewards.set(player.address, reward);
      });
    }

    return rewards;
  }

  // Get session
  getSession(sessionId: string): MultiplayerSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get player's current session
  getPlayerSession(playerAddress: string): MultiplayerSession | undefined {
    const sessionId = this.playerSessions.get(playerAddress);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  // Get all active sessions
  getActiveSessions(mode?: MultiplayerSession['mode']): MultiplayerSession[] {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.status === 'waiting' && !s.isPrivate
    );

    if (mode) {
      return sessions.filter((s) => s.mode === mode);
    }

    return sessions;
  }

  // Get session statistics
  getSessionStats(sessionId: string): {
    totalKills: number;
    totalDeaths: number;
    totalDamage: bigint;
    totalHealing: bigint;
    duration: number;
    mvp?: Player;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalKills = session.currentPlayers.reduce((sum, p) => sum + p.kills, 0);
    const totalDeaths = session.currentPlayers.reduce(
      (sum, p) => sum + p.deaths,
      0
    );
    const totalDamage = session.currentPlayers.reduce(
      (sum, p) => sum + p.damageDealt,
      BigInt(0)
    );
    const totalHealing = session.currentPlayers.reduce(
      (sum, p) => sum + p.healingDone,
      BigInt(0)
    );

    const duration = session.completedAt
      ? session.completedAt - (session.startedAt || session.createdAt)
      : Date.now() - (session.startedAt || session.createdAt);

    // MVP is player with highest score
    const mvp = session.currentPlayers.reduce((best, player) =>
      player.score > best.score ? player : best
    );

    return {
      totalKills,
      totalDeaths,
      totalDamage,
      totalHealing,
      duration,
      mvp,
    };
  }
}

// Singleton instance
export const multiplayerManager = new MultiplayerManager();
