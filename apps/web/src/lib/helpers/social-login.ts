// Social Login Integration - Web3 + Web2 Authentication

export interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  type: 'web2' | 'web3';
}

export const socialProviders: SocialProvider[] = [
  // Web3 Providers
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    type: 'web3',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    type: 'web3',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '💼',
    type: 'web3',
  },
  {
    id: 'onewallet',
    name: 'OneWallet',
    icon: '1️⃣',
    type: 'web3',
  },

  // Web2 Providers
  {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    type: 'web2',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    type: 'web2',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    type: 'web2',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    type: 'web2',
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    type: 'web2',
  },
];

export interface UserProfile {
  id: string;
  address?: string; // Web3 address
  email?: string; // Web2 email
  username: string;
  displayName: string;
  avatar?: string;
  provider: string;
  providerType: 'web2' | 'web3';
  linkedAccounts: LinkedAccount[];
  createdAt: number;
  lastLogin: number;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface LinkedAccount {
  provider: string;
  providerId: string;
  username: string;
  linkedAt: number;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    discord: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    showGuild: boolean;
  };
  gameplay: {
    autoSave: boolean;
    difficulty: 'normal' | 'hard' | 'nightmare' | 'hell';
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

export interface UserStats {
  gamesPlayed: number;
  totalScore: bigint;
  highestLevel: number;
  totalPlayTime: number; // in seconds
  achievements: string[];
  friends: string[];
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: number;
  refreshToken: string;
}

export class SocialLoginManager {
  private users: Map<string, UserProfile>;
  private sessions: Map<string, AuthSession>;
  private addressToUserId: Map<string, string>; // Web3 address -> userId
  private emailToUserId: Map<string, string>; // Email -> userId

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.addressToUserId = new Map();
    this.emailToUserId = new Map();
  }

  // Web3 Login (MetaMask, WalletConnect, etc.)
  async loginWithWeb3(
    provider: string,
    address: string,
    signature: string
  ): Promise<{
    success: boolean;
    message: string;
    profile?: UserProfile;
    session?: AuthSession;
  }> {
    // Verify signature (simplified - in production, verify with message)
    if (!signature || signature.length < 10) {
      return { success: false, message: 'Invalid signature' };
    }

    // Check if user exists
    let userId = this.addressToUserId.get(address.toLowerCase());
    let profile: UserProfile;

    if (userId) {
      // Existing user
      profile = this.users.get(userId)!;
      profile.lastLogin = Date.now();
    } else {
      // New user
      profile = this.createProfile({
        address,
        username: `user_${address.slice(0, 8)}`,
        displayName: `Player ${address.slice(0, 6)}`,
        provider,
        providerType: 'web3',
      });
      this.addressToUserId.set(address.toLowerCase(), profile.id);
    }

    // Create session
    const session = this.createSession(profile.id);

    return {
      success: true,
      message: 'Logged in successfully',
      profile,
      session,
    };
  }

  // Web2 Login (Google, Twitter, Discord, etc.)
  async loginWithWeb2(
    provider: string,
    email: string,
    oauthToken: string,
    userData: {
      username?: string;
      displayName?: string;
      avatar?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    profile?: UserProfile;
    session?: AuthSession;
  }> {
    // Verify OAuth token (simplified - in production, verify with provider)
    if (!oauthToken || oauthToken.length < 10) {
      return { success: false, message: 'Invalid OAuth token' };
    }

    // Check if user exists
    let userId = this.emailToUserId.get(email.toLowerCase());
    let profile: UserProfile;

    if (userId) {
      // Existing user
      profile = this.users.get(userId)!;
      profile.lastLogin = Date.now();
    } else {
      // New user
      profile = this.createProfile({
        email,
        username: userData.username || `user_${Date.now()}`,
        displayName: userData.displayName || 'New Player',
        avatar: userData.avatar,
        provider,
        providerType: 'web2',
      });
      this.emailToUserId.set(email.toLowerCase(), profile.id);
    }

    // Create session
    const session = this.createSession(profile.id);

    return {
      success: true,
      message: 'Logged in successfully',
      profile,
      session,
    };
  }

  // Email/Password Login
  async loginWithEmail(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    profile?: UserProfile;
    session?: AuthSession;
  }> {
    // Simplified password check (in production, use proper hashing)
    if (!password || password.length < 6) {
      return { success: false, message: 'Invalid password' };
    }

    let userId = this.emailToUserId.get(email.toLowerCase());
    let profile: UserProfile;

    if (userId) {
      profile = this.users.get(userId)!;
      profile.lastLogin = Date.now();
    } else {
      // New user registration
      profile = this.createProfile({
        email,
        username: email.split('@')[0] || 'user',
        displayName: email.split('@')[0] || 'Player',
        provider: 'email',
        providerType: 'web2',
      });
      this.emailToUserId.set(email.toLowerCase(), profile.id);
    }

    const session = this.createSession(profile.id);

    return {
      success: true,
      message: 'Logged in successfully',
      profile,
      session,
    };
  }

  // Create user profile
  private createProfile(data: {
    address?: string;
    email?: string;
    username: string;
    displayName: string;
    avatar?: string;
    provider: string;
    providerType: 'web2' | 'web3';
  }): UserProfile {
    const profile: UserProfile = {
      id: `user-${Date.now()}-${Math.random()}`,
      address: data.address,
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      avatar: data.avatar,
      provider: data.provider,
      providerType: data.providerType,
      linkedAccounts: [],
      createdAt: Date.now(),
      lastLogin: Date.now(),
      preferences: {
        notifications: {
          email: true,
          push: true,
          discord: false,
        },
        privacy: {
          showProfile: true,
          showStats: true,
          showGuild: true,
        },
        gameplay: {
          autoSave: true,
          difficulty: 'normal',
          soundEnabled: true,
          musicEnabled: true,
        },
      },
      stats: {
        gamesPlayed: 0,
        totalScore: BigInt(0),
        highestLevel: 0,
        totalPlayTime: 0,
        achievements: [],
        friends: [],
      },
    };

    this.users.set(profile.id, profile);
    return profile;
  }

  // Create session
  private createSession(userId: string): AuthSession {
    const session: AuthSession = {
      userId,
      token: this.generateToken(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      refreshToken: this.generateToken(),
    };

    this.sessions.set(session.token, session);
    return session;
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Link account
  linkAccount(
    userId: string,
    provider: string,
    providerId: string,
    username: string
  ): {
    success: boolean;
    message: string;
  } {
    const profile = this.users.get(userId);
    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    // Check if already linked
    const existing = profile.linkedAccounts.find((a) => a.provider === provider);
    if (existing) {
      return { success: false, message: 'Account already linked' };
    }

    profile.linkedAccounts.push({
      provider,
      providerId,
      username,
      linkedAt: Date.now(),
    });

    return { success: true, message: 'Account linked successfully' };
  }

  // Unlink account
  unlinkAccount(
    userId: string,
    provider: string
  ): {
    success: boolean;
    message: string;
  } {
    const profile = this.users.get(userId);
    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    profile.linkedAccounts = profile.linkedAccounts.filter(
      (a) => a.provider !== provider
    );

    return { success: true, message: 'Account unlinked successfully' };
  }

  // Verify session
  verifySession(token: string): UserProfile | null {
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return this.users.get(session.userId) || null;
  }

  // Refresh session
  refreshSession(refreshToken: string): AuthSession | null {
    // Find session by refresh token
    for (const [token, session] of this.sessions.entries()) {
      if (session.refreshToken === refreshToken) {
        // Create new session
        const newSession = this.createSession(session.userId);
        this.sessions.delete(token);
        return newSession;
      }
    }
    return null;
  }

  // Logout
  logout(token: string): { success: boolean; message: string } {
    const session = this.sessions.get(token);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    this.sessions.delete(token);
    return { success: true, message: 'Logged out successfully' };
  }

  // Get user profile
  getProfile(userId: string): UserProfile | undefined {
    return this.users.get(userId);
  }

  // Update profile
  updateProfile(
    userId: string,
    updates: Partial<{
      username: string;
      displayName: string;
      avatar: string;
      preferences: Partial<UserPreferences>;
    }>
  ): { success: boolean; message: string; profile?: UserProfile } {
    const profile = this.users.get(userId);
    if (!profile) {
      return { success: false, message: 'User not found' };
    }

    if (updates.username) profile.username = updates.username;
    if (updates.displayName) profile.displayName = updates.displayName;
    if (updates.avatar) profile.avatar = updates.avatar;
    if (updates.preferences) {
      profile.preferences = {
        ...profile.preferences,
        ...updates.preferences,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      profile,
    };
  }

  // Add friend
  addFriend(
    userId: string,
    friendId: string
  ): { success: boolean; message: string } {
    const profile = this.users.get(userId);
    const friend = this.users.get(friendId);

    if (!profile || !friend) {
      return { success: false, message: 'User not found' };
    }

    if (profile.stats.friends.includes(friendId)) {
      return { success: false, message: 'Already friends' };
    }

    profile.stats.friends.push(friendId);
    friend.stats.friends.push(userId);

    return { success: true, message: 'Friend added successfully' };
  }

  // Remove friend
  removeFriend(
    userId: string,
    friendId: string
  ): { success: boolean; message: string } {
    const profile = this.users.get(userId);
    const friend = this.users.get(friendId);

    if (!profile || !friend) {
      return { success: false, message: 'User not found' };
    }

    profile.stats.friends = profile.stats.friends.filter((id) => id !== friendId);
    friend.stats.friends = friend.stats.friends.filter((id) => id !== userId);

    return { success: true, message: 'Friend removed successfully' };
  }

  // Get friends
  getFriends(userId: string): UserProfile[] {
    const profile = this.users.get(userId);
    if (!profile) return [];

    return profile.stats.friends
      .map((id) => this.users.get(id))
      .filter((p) => p !== undefined) as UserProfile[];
  }

  // Search users
  searchUsers(query: string, limit: number = 20): UserProfile[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(
        (user) =>
          user.username.toLowerCase().includes(lowerQuery) ||
          user.displayName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }

  // Get user by address
  getUserByAddress(address: string): UserProfile | undefined {
    const userId = this.addressToUserId.get(address.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }

  // Get user by email
  getUserByEmail(email: string): UserProfile | undefined {
    const userId = this.emailToUserId.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }
}

// Singleton instance
export const socialLoginManager = new SocialLoginManager();
