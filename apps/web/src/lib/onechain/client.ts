// OneChain Client Integration
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// OneChain Network Configuration
export const ONECHAIN_CONFIG = {
  MAINNET: 'https://rpc-mainnet.onelabs.cc:443',
  TESTNET: 'https://rpc-testnet.onelabs.cc:443',
  DEVNET: 'https://rpc-devnet.onelabs.cc:443',
  FAUCET_TESTNET: 'https://faucet-testnet.onelabs.cc/v1/gas',
  FAUCET_DEVNET: 'https://faucet-devnet.onelabs.cc/v1/gas',
};

// Contract Addresses (update after deployment)
export const CONTRACTS = {
  GAME_PACKAGE: process.env.NEXT_PUBLIC_GAME_PACKAGE || '0x0',
  GAME_REGISTRY: process.env.NEXT_PUBLIC_GAME_REGISTRY || '0x0',
  DGN_TREASURY: process.env.NEXT_PUBLIC_DGN_TREASURY || '0x0',
};

// Initialize OneChain client
export const onechainClient = new SuiClient({
  url: ONECHAIN_CONFIG.TESTNET,
});

// Request test OCT from faucet
export async function requestFaucet(address: string): Promise<any> {
  try {
    const response = await fetch(ONECHAIN_CONFIG.FAUCET_TESTNET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        FixedAmountRequest: {
          recipient: address,
        },
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Faucet request failed:', error);
    throw error;
  }
}

// Get account balance
export async function getBalance(address: string): Promise<string> {
  try {
    const balance = await onechainClient.getBalance({
      owner: address,
    });
    return balance.totalBalance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';
  }
}

// Get all objects owned by address
export async function getOwnedObjects(address: string) {
  try {
    const objects = await onechainClient.getOwnedObjects({
      owner: address,
    });
    return objects.data;
  } catch (error) {
    console.error('Failed to get owned objects:', error);
    return [];
  }
}

// Create player profile
export async function createPlayerProfile(
  keypair: Ed25519Keypair
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::shadow_stake_saga_game::create_profile`,
    arguments: [],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to create profile:', error);
    throw error;
  }
}

// Start game session
export async function startGameSession(
  keypair: Ed25519Keypair
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::shadow_stake_saga_game::start_game`,
    arguments: [tx.object(CONTRACTS.GAME_REGISTRY)],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to start game:', error);
    throw error;
  }
}

// Complete game session
export async function completeGameSession(
  keypair: Ed25519Keypair,
  profileId: string,
  sessionId: string
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::shadow_stake_saga_game::complete_game`,
    arguments: [
      tx.object(profileId),
      tx.object(CONTRACTS.GAME_REGISTRY),
      tx.object(sessionId),
    ],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to complete game:', error);
    throw error;
  }
}

// Mint DGN tokens
export async function mintDGNTokens(
  keypair: Ed25519Keypair,
  amount: number,
  recipient: string
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::dgn_token::mint`,
    arguments: [
      tx.object(CONTRACTS.DGN_TREASURY),
      tx.pure(amount),
      tx.pure(recipient),
    ],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to mint DGN:', error);
    throw error;
  }
}

// Mint weapon NFT
export async function mintWeaponNFT(
  keypair: Ed25519Keypair,
  name: string,
  weaponType: string,
  damage: number,
  rarity: string,
  imageUrl: string
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::nft_items::mint_weapon`,
    arguments: [
      tx.pure(Array.from(new TextEncoder().encode(name))),
      tx.pure(Array.from(new TextEncoder().encode(weaponType))),
      tx.pure(damage),
      tx.pure(Array.from(new TextEncoder().encode(rarity))),
      tx.pure(Array.from(new TextEncoder().encode(imageUrl))),
    ],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to mint weapon NFT:', error);
    throw error;
  }
}

// Mint boss trophy NFT
export async function mintBossTrophyNFT(
  keypair: Ed25519Keypair,
  bossName: string,
  difficulty: number,
  imageUrl: string
): Promise<any> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACTS.GAME_PACKAGE}::nft_items::mint_boss_trophy`,
    arguments: [
      tx.pure(Array.from(new TextEncoder().encode(bossName))),
      tx.pure(difficulty),
      tx.pure(Array.from(new TextEncoder().encode(imageUrl))),
    ],
  });

  try {
    const result = await onechainClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to mint boss trophy:', error);
    throw error;
  }
}

// Get player profile
export async function getPlayerProfile(profileId: string): Promise<any> {
  try {
    const object = await onechainClient.getObject({
      id: profileId,
      options: {
        showContent: true,
      },
    });

    return object.data;
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

// Get game session
export async function getGameSession(sessionId: string): Promise<any> {
  try {
    const object = await onechainClient.getObject({
      id: sessionId,
      options: {
        showContent: true,
      },
    });

    return object.data;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// Get transaction events
export async function getTransactionEvents(digest: string): Promise<any> {
  try {
    const events = await onechainClient.queryEvents({
      query: { Transaction: digest },
    });

    return events.data;
  } catch (error) {
    console.error('Failed to get events:', error);
    return [];
  }
}
