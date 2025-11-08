import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
// @ts-ignore - Type declarations may be missing in this version
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';
// @ts-ignore - Type declarations may be missing in this version
import { bcs } from '@mysten/sui/bcs';

export interface StoreArgs {
  id: string;
  totalScore: bigint;
  times: { startTime: bigint; endTime: bigint; round: bigint }[];
}

// OneChain Package ID - DEPLOYED!
const GAME_PACKAGE_ID = '0x3d16067dbdb2afe434f636d860fd02400ef57421def3b89ee424f9c3b354ec45';

export const useGameActions = () => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  const address = account?.address;
  const isDisconnected = !account;

  // Fetch profile data from OneChain blockchain by querying events
  const getProfileData = async () => {
    if (!address) return undefined;
    
    try {
      console.log("📊 Fetching game events for:", address);
      
      // Query GameCompleted events for this player
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${GAME_PACKAGE_ID}::shadow_stake_saga_game::GameCompleted`
        },
        limit: 50,
        order: 'descending'
      });
      
      console.log("📊 Found events:", events);
      
      // Filter events for this player and format them
      const playerGames = events.data
        .filter((event: any) => event.parsedJson?.player === address)
        .map((event: any, index: number) => ({
          id: `game-${index}`,
          record: {
            id: event.id.txDigest,
            // Use event.timestampMs which is in milliseconds
            timestamp: BigInt(event.timestampMs || (event.parsedJson.timestamp * 1000) || 0),
            totalRounds: BigInt(event.parsedJson.level || 0),
            totalScore: BigInt(event.parsedJson.score || 0),
          },
          times: [] // Events don't store round times
        }));
      
      console.log("📊 Player games:", playerGames);
      return playerGames;
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return [];
    }
  };

  // Always return the storeResult function, but check wallet inside it
  const storeResult = async (args: StoreArgs) => {
    console.log("🔍 Checking wallet connection...");
    console.log("Account object:", account);
    console.log("Address:", address);
    
    // Check wallet connection at call time, not hook initialization time
    if (!address || !account) {
      console.error("❌ No wallet connected!");
      console.error("Account:", account);
      console.error("Address:", address);
      throw new Error("Wallet not connected - please refresh the page and try again");
    }
    
    console.log("💾 Storing score to OneChain:", args.totalScore);
    console.log("📦 Package ID:", GAME_PACKAGE_ID);
    console.log("👤 Wallet address:", address);
    
    setIsLoadingClient(true);

    try {
      const tx = new Transaction();
      
      // Simple approach - use string which SDK will convert to vector<u8>
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Call Move function to store game score on OneChain
      tx.moveCall({
        target: `${GAME_PACKAGE_ID}::shadow_stake_saga_game::store_score`,
        arguments: [
          tx.pure.string(args.id),
          tx.pure.u64(Number(args.totalScore)),
          tx.pure.u64(args.times.length),
          tx.pure.u64(timestamp),
        ],
      });

      // Set gas budget and sender
      tx.setGasBudget(10000000); // 0.01 OCT
      tx.setSender(address);

      console.log("📝 Transaction created, waiting for signature...");
      console.log("🔍 Transaction details:", {
        target: `${GAME_PACKAGE_ID}::shadow_stake_saga_game::store_score`,
        gameId: args.id,
        score: Number(args.totalScore),
        rounds: args.times.length,
        timestamp: Date.now(),
      });
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: 'onechain:testnet',
      });

      console.log("✅ Score stored on OneChain:", result.digest);
      
      // Note: Token minting requires TreasuryCap - implement separately
      // await mintToken(args.totalScore);
      
      return result.digest;
    } catch (error) {
      console.error("❌ Failed to store score:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      alert(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsLoadingClient(false);
    }
  };

  const mintToken = async (score: bigint) => {
    try {
      setIsMinting(true);
      console.log("Minting $SSS tokens based on score:", score);

      const tx = new Transaction();
      
      // Call Move function to mint tokens
      tx.moveCall({
        target: `${GAME_PACKAGE_ID}::token::mint`,
        arguments: [
          tx.pure.address(address!),
          tx.pure.u64(Number(score)),
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log("✅ Minted", score.toString(), "$SSS tokens:", result.digest);
      return result.digest;
    } catch (error) {
      console.error("❌ Token minting failed:", error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  return { 
    storeResult, 
    isMinting, 
    isLoadingClient, 
    isDisconnected, 
    getProfileData, 
    profileData: undefined // Will be fetched on demand
  };
};

