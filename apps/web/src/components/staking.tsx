import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { toast } from 'sonner';

// const STAKING_CONTRACT_ADDRESS = '';

// const STAKING_CONTRACT_ABI = [
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "_nativeTokenWrapper",
//         "type": "address"
//       }
//     ],
//     "stateMutability": "nonpayable",
//     "type": "constructor"
//   },
//   {
//     "inputs": [],
//     "name": "ContractMetadataUnauthorized",
//     "type": "error"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "expected",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "actual",
//         "type": "uint256"
//       }
//     ],
//     "name": "CurrencyTransferLibMismatchedValue",
//     "type": "error"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       },
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       }
//     ],
//     "name": "PermissionsAlreadyGranted",
//     "type": "error"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "expected",
//         "type": "address"
//       },
//       {
//         "internalType": "address",
//         "name": "actual",
//         "type": "address"
//       }
//     ],
//     "name": "PermissionsInvalidPermission",
//     "type": "error"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       },
//       {
//         "internalType": "bytes32",
//         "name": "neededRole",
//         "type": "bytes32"
//       }
//     ],
//     "name": "PermissionsUnauthorizedAccount",
//     "type": "error"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "string",
//         "name": "prevURI",
//         "type": "string"
//       },
//       {
//         "indexed": false,
//         "internalType": "string",
//         "name": "newURI",
//         "type": "string"
//       }
//     ],
//     "name": "ContractURIUpdated",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint8",
//         "name": "version",
//         "type": "uint8"
//       }
//     ],
//     "name": "Initialized",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "RewardTokensDepositedByAdmin",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "RewardTokensWithdrawnByAdmin",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "staker",
//         "type": "address"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "rewardAmount",
//         "type": "uint256"
//       }
//     ],
//     "name": "RewardsClaimed",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "indexed": true,
//         "internalType": "bytes32",
//         "name": "previousAdminRole",
//         "type": "bytes32"
//       },
//       {
//         "indexed": true,
//         "internalType": "bytes32",
//         "name": "newAdminRole",
//         "type": "bytes32"
//       }
//     ],
//     "name": "RoleAdminChanged",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       },
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "sender",
//         "type": "address"
//       }
//     ],
//     "name": "RoleGranted",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       },
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "sender",
//         "type": "address"
//       }
//     ],
//     "name": "RoleRevoked",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "staker",
//         "type": "address"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "TokensStaked",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": true,
//         "internalType": "address",
//         "name": "staker",
//         "type": "address"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "TokensWithdrawn",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "oldAmount",
//         "type": "uint256"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "newAmount",
//         "type": "uint256"
//       }
//     ],
//     "name": "UpdatedMinStakeAmount",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "oldNumerator",
//         "type": "uint256"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "newNumerator",
//         "type": "uint256"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "oldDenominator",
//         "type": "uint256"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "newDenominator",
//         "type": "uint256"
//       }
//     ],
//     "name": "UpdatedRewardRatio",
//     "type": "event"
//   },
//   {
//     "anonymous": false,
//     "inputs": [
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "oldTimeUnit",
//         "type": "uint256"
//       },
//       {
//         "indexed": false,
//         "internalType": "uint256",
//         "name": "newTimeUnit",
//         "type": "uint256"
//       }
//     ],
//     "name": "UpdatedTimeUnit",
//     "type": "event"
//   },
//   {
//     "inputs": [],
//     "name": "DEFAULT_ADMIN_ROLE",
//     "outputs": [
//       {
//         "internalType": "bytes32",
//         "name": "",
//         "type": "bytes32"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "claimRewards",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "contractType",
//     "outputs": [
//       {
//         "internalType": "bytes32",
//         "name": "",
//         "type": "bytes32"
//       }
//     ],
//     "stateMutability": "pure",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "contractURI",
//     "outputs": [
//       {
//         "internalType": "string",
//         "name": "",
//         "type": "string"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "contractVersion",
//     "outputs": [
//       {
//         "internalType": "uint8",
//         "name": "",
//         "type": "uint8"
//       }
//     ],
//     "stateMutability": "pure",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "depositRewardTokens",
//     "outputs": [],
//     "stateMutability": "payable",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "getRewardRatio",
//     "outputs": [
//       {
//         "internalType": "uint256",
//         "name": "_numerator",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "_denominator",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "getRewardTokenBalance",
//     "outputs": [
//       {
//         "internalType": "uint256",
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       }
//     ],
//     "name": "getRoleAdmin",
//     "outputs": [
//       {
//         "internalType": "bytes32",
//         "name": "",
//         "type": "bytes32"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "uint256",
//         "name": "index",
//         "type": "uint256"
//       }
//     ],
//     "name": "getRoleMember",
//     "outputs": [
//       {
//         "internalType": "address",
//         "name": "member",
//         "type": "address"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       }
//     ],
//     "name": "getRoleMemberCount",
//     "outputs": [
//       {
//         "internalType": "uint256",
//         "name": "count",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "_staker",
//         "type": "address"
//       }
//     ],
//     "name": "getStakeInfo",
//     "outputs": [
//       {
//         "internalType": "uint256",
//         "name": "_tokensStaked",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "_rewards",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "getTimeUnit",
//     "outputs": [
//       {
//         "internalType": "uint80",
//         "name": "_timeUnit",
//         "type": "uint80"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       }
//     ],
//     "name": "grantRole",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       }
//     ],
//     "name": "hasRole",
//     "outputs": [
//       {
//         "internalType": "bool",
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       }
//     ],
//     "name": "hasRoleWithSwitch",
//     "outputs": [
//       {
//         "internalType": "bool",
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "_defaultAdmin",
//         "type": "address"
//       },
//       {
//         "internalType": "string",
//         "name": "_contractURI",
//         "type": "string"
//       },
//       {
//         "internalType": "address[]",
//         "name": "_trustedForwarders",
//         "type": "address[]"
//       },
//       {
//         "internalType": "address",
//         "name": "_rewardToken",
//         "type": "address"
//       },
//       {
//         "internalType": "address",
//         "name": "_stakingToken",
//         "type": "address"
//       },
//       {
//         "internalType": "uint80",
//         "name": "_timeUnit",
//         "type": "uint80"
//       },
//       {
//         "internalType": "uint256",
//         "name": "_rewardRatioNumerator",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "_rewardRatioDenominator",
//         "type": "uint256"
//       }
//     ],
//     "name": "initialize",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "forwarder",
//         "type": "address"
//       }
//     ],
//     "name": "isTrustedForwarder",
//     "outputs": [
//       {
//         "internalType": "bool",
//         "name": "",
//         "type": "bool"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes[]",
//         "name": "data",
//         "type": "bytes[]"
//       }
//     ],
//     "name": "multicall",
//     "outputs": [
//       {
//         "internalType": "bytes[]",
//         "name": "results",
//         "type": "bytes[]"
//       }
//     ],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       }
//     ],
//     "name": "renounceRole",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "bytes32",
//         "name": "role",
//         "type": "bytes32"
//       },
//       {
//         "internalType": "address",
//         "name": "account",
//         "type": "address"
//       }
//     ],
//     "name": "revokeRole",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "rewardToken",
//     "outputs": [
//       {
//         "internalType": "address",
//         "name": "",
//         "type": "address"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "rewardTokenDecimals",
//     "outputs": [
//       {
//         "internalType": "uint16",
//         "name": "",
//         "type": "uint16"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "string",
//         "name": "_uri",
//         "type": "string"
//       }
//     ],
//     "name": "setContractURI",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "_numerator",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "_denominator",
//         "type": "uint256"
//       }
//     ],
//     "name": "setRewardRatio",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint80",
//         "name": "_timeUnit",
//         "type": "uint80"
//       }
//     ],
//     "name": "setTimeUnit",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "stake",
//     "outputs": [],
//     "stateMutability": "payable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "address",
//         "name": "",
//         "type": "address"
//       }
//     ],
//     "name": "stakers",
//     "outputs": [
//       {
//         "internalType": "uint128",
//         "name": "timeOfLastUpdate",
//         "type": "uint128"
//       },
//       {
//         "internalType": "uint64",
//         "name": "conditionIdOflastUpdate",
//         "type": "uint64"
//       },
//       {
//         "internalType": "uint256",
//         "name": "amountStaked",
//         "type": "uint256"
//       },
//       {
//         "internalType": "uint256",
//         "name": "unclaimedRewards",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "name": "stakersArray",
//     "outputs": [
//       {
//         "internalType": "address",
//         "name": "",
//         "type": "address"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "stakingToken",
//     "outputs": [
//       {
//         "internalType": "address",
//         "name": "",
//         "type": "address"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "stakingTokenBalance",
//     "outputs": [
//       {
//         "internalType": "uint256",
//         "name": "",
//         "type": "uint256"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [],
//     "name": "stakingTokenDecimals",
//     "outputs": [
//       {
//         "internalType": "uint16",
//         "name": "",
//         "type": "uint16"
//       }
//     ],
//     "stateMutability": "view",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "withdraw",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "inputs": [
//       {
//         "internalType": "uint256",
//         "name": "_amount",
//         "type": "uint256"
//       }
//     ],
//     "name": "withdrawRewardTokens",
//     "outputs": [],
//     "stateMutability": "nonpayable",
//     "type": "function"
//   },
//   {
//     "stateMutability": "payable",
//     "type": "receive"
//   }
// ]

export const StakingPage = () => {
  const account = useCurrentAccount();
  const [amount, setAmount] = useState('');
  const [stats, setStats] = useState({
    totalStaked: '0',
    userStaked: '0',
    availableRewards: '0',
    stakingPeriod: 30,
  });

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const isConnected = !!account;

  const fetchStats = async () => {
    if (!account) return;

    try {
      // TODO: Fetch from Sui blockchain
      // For now, use mock data
      setStats({
        totalStaked: '10000',
        userStaked: '100',
        availableRewards: '5.5',
        stakingPeriod: 30,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [account]);

  const handleStake = async () => {
    if (!isConnected) return toast.error('Connect OneChain wallet first');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Invalid amount');

    try {
      setIsStaking(true);
      // TODO: Implement Sui staking transaction
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      toast.success(`Successfully staked ${amount} $SSS tokens!`);
      setAmount('');
      fetchStats();
    } catch (err) {
      toast.error('Failed to stake tokens');
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected) return toast.error('Connect OneChain wallet first');

    try {
      setIsUnstaking(true);
      // TODO: Implement Sui unstaking transaction
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      toast.success('Successfully unstaked tokens!');
      fetchStats();
    } catch (err) {
      toast.error('Failed to unstake tokens');
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected) return toast.error('Connect OneChain wallet first');

    try {
      setIsClaiming(true);
      // TODO: Implement Sui claim rewards transaction
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      toast.success(`Successfully claimed ${stats.availableRewards} $SSS rewards!`);
      fetchStats();
    } catch (err) {
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="absolute top-24 right-1/2 mx-auto w-full max-w-screen-xl translate-x-1/2 rounded-xl bg-[#0b171dd0] px-8 py-10">
        <div className="font-golondrina text-4xl text-center text-red-400">
          Please connect your OneChain wallet to access staking
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-24 right-1/2 mx-auto w-full max-w-screen-xl translate-x-1/2 rounded-xl bg-[#0b171dd0] px-8 py-10">
      <div className="font-golondrina text-7xl mb-10">Stake Your $SSS Tokens</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="p-6 bg-[#0b171d] border-[#1a2a35]">
          <h3 className="text-sm text-gray-400 mb-3">Total Staked</h3>
          <p className="text-2xl font-semibold text-yellow-400">{stats.totalStaked} $SSS</p>
        </Card>

        <Card className="p-6 bg-[#0b171d] border-[#1a2a35]">
          <h3 className="text-sm text-gray-400 mb-3">Your Stake</h3>
          <p className="text-2xl font-semibold text-green-400">{stats.userStaked} $SSS</p>
        </Card>

        <Card className="p-6 bg-[#0b171d] border-[#1a2a35]">
          <h3 className="text-sm text-gray-400 mb-3">Available Rewards</h3>
          <p className="text-2xl font-semibold text-blue-400">{stats.availableRewards} $SSS</p>
        </Card>

        <Card className="p-6 bg-[#0b171d] border-[#1a2a35]">
          <h3 className="text-sm text-gray-400 mb-3">APY</h3>
          <p className="text-2xl font-semibold text-purple-400">20%</p>
        </Card>
      </div>

      <Card className="max-w-xl mx-auto p-8 bg-[#0b171d] border-[#1a2a35]">
        <div className="space-y-8">
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to stake"
              className="pr-20 bg-[#0b171d] border-[#1a2a35] text-white h-12"
              disabled={isStaking || isUnstaking || isClaiming}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 font-medium">$SSS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Button
              onClick={handleStake}
              disabled={isStaking || isUnstaking || isClaiming || !amount}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isStaking ? 'Staking...' : 'Stake Tokens'}
            </Button>

            <Button
              onClick={handleUnstake}
              disabled={isStaking || isUnstaking || isClaiming || stats.userStaked === '0'}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 h-12"
            >
              {isUnstaking ? 'Unstaking...' : 'Unstake Tokens'}
            </Button>

            <Button
              onClick={handleClaimRewards}
              disabled={isStaking || isUnstaking || isClaiming || stats.availableRewards === '0'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              {isClaiming ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400 mt-4">
            <p> Staking on OneChain Blockchain</p>
            <p className="mt-2">Earn 20% APY by staking your $SSS tokens!</p>
          </div>
        </div>
      </Card>
    </div>
  );
};