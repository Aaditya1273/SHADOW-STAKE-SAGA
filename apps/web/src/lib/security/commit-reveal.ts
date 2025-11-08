// Commit-Reveal Scheme for Score Submission

export interface Commitment {
  commitmentId: string;
  playerAddress: string;
  commitHash: string;
  timestamp: number;
  revealed: boolean;
  revealDeadline: number;
}

export interface Reveal {
  commitmentId: string;
  score: number;
  nonce: string;
  sessionData: string;
  timestamp: number;
}

export interface CommitRevealResult {
  valid: boolean;
  score: number;
  reason?: string;
}

export class CommitRevealScheme {
  private commitments: Map<string, Commitment>;
  private reveals: Map<string, Reveal>;
  private readonly REVEAL_WINDOW = 300000; // 5 minutes

  constructor() {
    this.commitments = new Map();
    this.reveals = new Map();
  }

  // Phase 1: Commit score hash
  commit(
    playerAddress: string,
    commitHash: string
  ): {
    success: boolean;
    commitmentId?: string;
    message?: string;
  } {
    // Validate hash format
    if (!this.isValidHash(commitHash)) {
      return {
        success: false,
        message: 'Invalid hash format',
      };
    }

    const commitmentId = this.generateCommitmentId();

    const commitment: Commitment = {
      commitmentId,
      playerAddress,
      commitHash,
      timestamp: Date.now(),
      revealed: false,
      revealDeadline: Date.now() + this.REVEAL_WINDOW,
    };

    this.commitments.set(commitmentId, commitment);

    return {
      success: true,
      commitmentId,
    };
  }

  // Phase 2: Reveal score
  reveal(
    commitmentId: string,
    score: number,
    nonce: string,
    sessionData: string
  ): CommitRevealResult {
    const commitment = this.commitments.get(commitmentId);

    if (!commitment) {
      return {
        valid: false,
        score: 0,
        reason: 'Commitment not found',
      };
    }

    if (commitment.revealed) {
      return {
        valid: false,
        score: 0,
        reason: 'Already revealed',
      };
    }

    // Check reveal deadline
    if (Date.now() > commitment.revealDeadline) {
      return {
        valid: false,
        score: 0,
        reason: 'Reveal deadline passed',
      };
    }

    // Verify commitment
    const computedHash = this.hashCommitment(score, nonce, sessionData);

    if (computedHash !== commitment.commitHash) {
      return {
        valid: false,
        score: 0,
        reason: 'Hash mismatch - possible tampering',
      };
    }

    // Store reveal
    const reveal: Reveal = {
      commitmentId,
      score,
      nonce,
      sessionData,
      timestamp: Date.now(),
    };

    this.reveals.set(commitmentId, reveal);
    commitment.revealed = true;

    return {
      valid: true,
      score,
    };
  }

  // Generate commitment hash (client-side)
  generateCommitmentHash(
    score: number,
    nonce: string,
    sessionData: string
  ): string {
    return this.hashCommitment(score, nonce, sessionData);
  }

  // Hash commitment data
  private hashCommitment(
    score: number,
    nonce: string,
    sessionData: string
  ): string {
    const data = `${score}:${nonce}:${sessionData}`;
    return this.sha256(data);
  }

  // Simple SHA-256 implementation (in production, use crypto library)
  private sha256(input: string): string {
    // Simplified hash for demo
    // In production, use: crypto.createHash('sha256').update(input).digest('hex')
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    // Convert to hex and pad
    const hex = Math.abs(hash).toString(16);
    return hex.padStart(64, '0').substring(0, 64);
  }

  // Validate hash format
  private isValidHash(hash: string): boolean {
    return /^[0-9a-f]{64}$/i.test(hash);
  }

  // Generate commitment ID
  private generateCommitmentId(): string {
    return `commit-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  // Generate random nonce
  generateNonce(): string {
    return Math.random().toString(36).substring(2) +
           Math.random().toString(36).substring(2) +
           Date.now().toString(36);
  }

  // Get commitment
  getCommitment(commitmentId: string): Commitment | undefined {
    return this.commitments.get(commitmentId);
  }

  // Get reveal
  getReveal(commitmentId: string): Reveal | undefined {
    return this.reveals.get(commitmentId);
  }

  // Get player commitments
  getPlayerCommitments(playerAddress: string): Commitment[] {
    return Array.from(this.commitments.values()).filter(
      (c) => c.playerAddress === playerAddress
    );
  }

  // Clean up expired commitments
  cleanupExpired() {
    const now = Date.now();
    const expired: string[] = [];

    this.commitments.forEach((commitment, id) => {
      if (!commitment.revealed && now > commitment.revealDeadline) {
        expired.push(id);
      }
    });

    expired.forEach((id) => {
      this.commitments.delete(id);
    });

    return expired.length;
  }

  // Get statistics
  getStats(): {
    totalCommitments: number;
    revealedCommitments: number;
    expiredCommitments: number;
    pendingCommitments: number;
  } {
    const commitments = Array.from(this.commitments.values());
    const now = Date.now();

    const revealed = commitments.filter((c) => c.revealed).length;
    const expired = commitments.filter(
      (c) => !c.revealed && now > c.revealDeadline
    ).length;
    const pending = commitments.filter(
      (c) => !c.revealed && now <= c.revealDeadline
    ).length;

    return {
      totalCommitments: commitments.length,
      revealedCommitments: revealed,
      expiredCommitments: expired,
      pendingCommitments: pending,
    };
  }
}

export const commitRevealScheme = new CommitRevealScheme();

// Helper function for client-side usage
export function prepareScoreCommitment(
  score: number,
  sessionData: string
): {
  commitHash: string;
  nonce: string;
} {
  const nonce = commitRevealScheme.generateNonce();
  const commitHash = commitRevealScheme.generateCommitmentHash(
    score,
    nonce,
    sessionData
  );

  return { commitHash, nonce };
}
