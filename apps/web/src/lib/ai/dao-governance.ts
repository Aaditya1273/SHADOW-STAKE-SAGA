// DAO Governance System for Shadow Stake Saga

export interface DAOProposal {
  id: string;
  proposer: string;
  title: string;
  description: string;
  type: ProposalType;
  data: any;
  votingPower: Map<string, bigint>;
  votes: {
    for: bigint;
    against: bigint;
    abstain: bigint;
  };
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'expired';
  createdAt: number;
  votingEnds: number;
  executionDelay: number;
  quorumRequired: bigint;
  passingThreshold: number; // Percentage
}

export type ProposalType =
  | 'game_balance'
  | 'tokenomics'
  | 'feature_addition'
  | 'treasury_spend'
  | 'contract_upgrade'
  | 'parameter_change';

export interface Vote {
  proposalId: string;
  voter: string;
  choice: 'for' | 'against' | 'abstain';
  votingPower: bigint;
  reason?: string;
  timestamp: number;
}

export interface DAOTreasury {
  dgnBalance: bigint;
  sttBalance: bigint;
  usdoBalance: bigint;
  nftAssets: string[];
  transactions: TreasuryTransaction[];
}

export interface TreasuryTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'grant';
  amount: bigint;
  currency: string;
  recipient?: string;
  proposalId?: string;
  timestamp: number;
  txHash?: string;
}

export interface DAOMember {
  address: string;
  votingPower: bigint;
  delegatedTo?: string;
  delegatedFrom: string[];
  proposalsCreated: number;
  proposalsVoted: number;
  reputation: number;
}

export class DAOGovernance {
  private proposals: Map<string, DAOProposal>;
  private votes: Map<string, Vote[]>; // proposalId -> votes
  private members: Map<string, DAOMember>;
  private treasury: DAOTreasury;
  private totalVotingPower: bigint;

  // Governance parameters
  private proposalThreshold: bigint; // Min tokens to create proposal
  private quorumPercentage: number; // % of total supply needed
  private votingPeriod: number; // milliseconds
  private executionDelay: number; // milliseconds

  constructor() {
    this.proposals = new Map();
    this.votes = new Map();
    this.members = new Map();
    this.treasury = {
      dgnBalance: BigInt(10000000) * BigInt(1e18), // 10M DGN
      sttBalance: BigInt(1000000) * BigInt(1e18), // 1M STT
      usdoBalance: BigInt(100000) * BigInt(1e18), // 100K USDO
      nftAssets: [],
      transactions: [],
    };
    this.totalVotingPower = BigInt(0);

    // Default parameters
    this.proposalThreshold = BigInt(100000) * BigInt(1e18); // 100K DGN
    this.quorumPercentage = 10; // 10% quorum
    this.votingPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.executionDelay = 2 * 24 * 60 * 60 * 1000; // 2 days
  }

  // Register DAO member
  registerMember(address: string, votingPower: bigint) {
    const existing = this.members.get(address);

    if (existing) {
      existing.votingPower = votingPower;
    } else {
      this.members.set(address, {
        address,
        votingPower,
        delegatedFrom: [],
        proposalsCreated: 0,
        proposalsVoted: 0,
        reputation: 0,
      });
    }

    this.recalculateTotalVotingPower();
  }

  // Create proposal
  createProposal(
    proposer: string,
    title: string,
    description: string,
    type: ProposalType,
    data: any
  ): {
    success: boolean;
    proposal?: DAOProposal;
    message?: string;
  } {
    const member = this.members.get(proposer);

    if (!member) {
      return { success: false, message: 'Not a DAO member' };
    }

    if (member.votingPower < this.proposalThreshold) {
      return {
        success: false,
        message: `Need ${this.proposalThreshold} voting power to create proposal`,
      };
    }

    const quorumRequired =
      (this.totalVotingPower * BigInt(this.quorumPercentage)) / BigInt(100);

    const proposal: DAOProposal = {
      id: `prop-${Date.now()}-${Math.random()}`,
      proposer,
      title,
      description,
      type,
      data,
      votingPower: new Map(),
      votes: {
        for: BigInt(0),
        against: BigInt(0),
        abstain: BigInt(0),
      },
      status: 'active',
      createdAt: Date.now(),
      votingEnds: Date.now() + this.votingPeriod,
      executionDelay: this.executionDelay,
      quorumRequired,
      passingThreshold: 50, // 50% of votes
    };

    this.proposals.set(proposal.id, proposal);
    member.proposalsCreated++;

    return {
      success: true,
      proposal,
    };
  }

  // Cast vote
  castVote(
    proposalId: string,
    voter: string,
    choice: Vote['choice'],
    reason?: string
  ): {
    success: boolean;
    message?: string;
  } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'active') {
      return { success: false, message: 'Proposal not active' };
    }

    if (Date.now() > proposal.votingEnds) {
      proposal.status = 'expired';
      return { success: false, message: 'Voting period ended' };
    }

    const member = this.members.get(voter);
    if (!member) {
      return { success: false, message: 'Not a DAO member' };
    }

    // Check if already voted
    if (proposal.votingPower.has(voter)) {
      return { success: false, message: 'Already voted' };
    }

    // Get voting power (including delegated)
    const votingPower = this.getEffectiveVotingPower(voter);

    // Record vote
    const vote: Vote = {
      proposalId,
      voter,
      choice,
      votingPower,
      reason,
      timestamp: Date.now(),
    };

    const proposalVotes = this.votes.get(proposalId) || [];
    proposalVotes.push(vote);
    this.votes.set(proposalId, proposalVotes);

    // Update proposal votes
    proposal.votingPower.set(voter, votingPower);

    switch (choice) {
      case 'for':
        proposal.votes.for += votingPower;
        break;
      case 'against':
        proposal.votes.against += votingPower;
        break;
      case 'abstain':
        proposal.votes.abstain += votingPower;
        break;
    }

    member.proposalsVoted++;
    member.reputation += 1;

    return {
      success: true,
      message: 'Vote recorded',
    };
  }

  // Delegate voting power
  delegateVotingPower(
    delegator: string,
    delegatee: string
  ): {
    success: boolean;
    message?: string;
  } {
    const delegatorMember = this.members.get(delegator);
    const delegateeMember = this.members.get(delegatee);

    if (!delegatorMember || !delegateeMember) {
      return { success: false, message: 'Invalid addresses' };
    }

    if (delegator === delegatee) {
      return { success: false, message: 'Cannot delegate to self' };
    }

    // Remove previous delegation
    if (delegatorMember.delegatedTo) {
      const prevDelegatee = this.members.get(delegatorMember.delegatedTo);
      if (prevDelegatee) {
        prevDelegatee.delegatedFrom = prevDelegatee.delegatedFrom.filter(
          (addr) => addr !== delegator
        );
      }
    }

    // Set new delegation
    delegatorMember.delegatedTo = delegatee;
    delegateeMember.delegatedFrom.push(delegator);

    return {
      success: true,
      message: 'Voting power delegated',
    };
  }

  // Get effective voting power (including delegations)
  private getEffectiveVotingPower(address: string): bigint {
    const member = this.members.get(address);
    if (!member) return BigInt(0);

    let power = member.votingPower;

    // Add delegated power
    member.delegatedFrom.forEach((delegator) => {
      const delegatorMember = this.members.get(delegator);
      if (delegatorMember) {
        power += delegatorMember.votingPower;
      }
    });

    return power;
  }

  // Finalize proposal
  finalizeProposal(proposalId: string): {
    success: boolean;
    message?: string;
    executed?: boolean;
  } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'active') {
      return { success: false, message: 'Proposal already finalized' };
    }

    if (Date.now() < proposal.votingEnds) {
      return { success: false, message: 'Voting period not ended' };
    }

    // Check quorum
    const totalVotes =
      proposal.votes.for + proposal.votes.against + proposal.votes.abstain;

    if (totalVotes < proposal.quorumRequired) {
      proposal.status = 'rejected';
      return {
        success: true,
        message: 'Proposal rejected: Quorum not met',
        executed: false,
      };
    }

    // Check passing threshold
    const forPercentage =
      Number((proposal.votes.for * BigInt(100)) / totalVotes);

    if (forPercentage >= proposal.passingThreshold) {
      proposal.status = 'passed';

      // Execute after delay
      setTimeout(() => {
        this.executeProposal(proposalId);
      }, proposal.executionDelay);

      return {
        success: true,
        message: `Proposal passed! Executing in ${proposal.executionDelay / 1000}s`,
        executed: false,
      };
    } else {
      proposal.status = 'rejected';
      return {
        success: true,
        message: 'Proposal rejected: Not enough votes',
        executed: false,
      };
    }
  }

  // Execute proposal
  private executeProposal(proposalId: string) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'passed') return;

    // Execute based on type
    switch (proposal.type) {
      case 'treasury_spend':
        this.executeTreasurySpend(proposal);
        break;

      case 'game_balance':
        this.executeGameBalance(proposal);
        break;

      case 'tokenomics':
        this.executeTokenomics(proposal);
        break;

      case 'parameter_change':
        this.executeParameterChange(proposal);
        break;

      default:
        console.log(`Executing ${proposal.type} proposal:`, proposal.data);
    }

    proposal.status = 'executed';
  }

  private executeTreasurySpend(proposal: DAOProposal) {
    const { recipient, amount, currency } = proposal.data;

    const transaction: TreasuryTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amount: BigInt(amount),
      currency,
      recipient,
      proposalId: proposal.id,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2)}`,
    };

    // Deduct from treasury
    if (currency === 'DGN') {
      this.treasury.dgnBalance -= BigInt(amount);
    } else if (currency === 'STT') {
      this.treasury.sttBalance -= BigInt(amount);
    } else if (currency === 'USDO') {
      this.treasury.usdoBalance -= BigInt(amount);
    }

    this.treasury.transactions.push(transaction);
  }

  private executeGameBalance(proposal: DAOProposal) {
    // Would update game parameters
    console.log('Executing game balance changes:', proposal.data);
  }

  private executeTokenomics(proposal: DAOProposal) {
    // Would update tokenomics parameters
    console.log('Executing tokenomics changes:', proposal.data);
  }

  private executeParameterChange(proposal: DAOProposal) {
    const { parameter, value } = proposal.data;

    switch (parameter) {
      case 'proposalThreshold':
        this.proposalThreshold = BigInt(value);
        break;
      case 'quorumPercentage':
        this.quorumPercentage = value;
        break;
      case 'votingPeriod':
        this.votingPeriod = value;
        break;
      case 'executionDelay':
        this.executionDelay = value;
        break;
    }
  }

  // Get proposal
  getProposal(proposalId: string): DAOProposal | undefined {
    return this.proposals.get(proposalId);
  }

  // Get all proposals
  getAllProposals(): DAOProposal[] {
    return Array.from(this.proposals.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  // Get active proposals
  getActiveProposals(): DAOProposal[] {
    return this.getAllProposals().filter((p) => p.status === 'active');
  }

  // Get proposal votes
  getProposalVotes(proposalId: string): Vote[] {
    return this.votes.get(proposalId) || [];
  }

  // Get member info
  getMember(address: string): DAOMember | undefined {
    return this.members.get(address);
  }

  // Get treasury info
  getTreasury(): DAOTreasury {
    return { ...this.treasury };
  }

  // Get DAO statistics
  getDAOStats(): {
    totalMembers: number;
    totalVotingPower: bigint;
    totalProposals: number;
    activeProposals: number;
    passedProposals: number;
    treasuryValue: bigint;
  } {
    const proposals = Array.from(this.proposals.values());

    return {
      totalMembers: this.members.size,
      totalVotingPower: this.totalVotingPower,
      totalProposals: proposals.length,
      activeProposals: proposals.filter((p) => p.status === 'active').length,
      passedProposals: proposals.filter((p) => p.status === 'passed' || p.status === 'executed').length,
      treasuryValue:
        this.treasury.dgnBalance +
        this.treasury.sttBalance +
        this.treasury.usdoBalance,
    };
  }

  private recalculateTotalVotingPower() {
    this.totalVotingPower = Array.from(this.members.values()).reduce(
      (sum, member) => sum + member.votingPower,
      BigInt(0)
    );
  }
}

export const daoGovernance = new DAOGovernance();
