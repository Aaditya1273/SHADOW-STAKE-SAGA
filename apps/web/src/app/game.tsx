import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useCallback, useState } from 'react';

import { observer } from 'mobx-react-lite';
import Phaser from 'phaser';
import { type StoreArgs, useGameActions } from '~/hooks';
import { useCurrentAccount } from '@mysten/dapp-kit';

import { gameState } from '~/components/game/state';
import { LoadingOverlay } from '~/components/loading-overlay';

import {
  DungeonGameScene,
  GameOverScene,
  HomeScene,
} from '../components/game/scenes';

const GameWrapper = () => {
  const account = useCurrentAccount();
  const { storeResult } = useGameActions();

  // Save wallet address to localStorage when connected
  useEffect(() => {
    if (account) {
      localStorage.setItem('sui_wallet_address', account.address);
      console.log('✅ Wallet saved to localStorage:', account.address);
    }
  }, [account]);

  // Create a wrapper function that always gets fresh wallet state
  const storeResultWrapper = useCallback(async (args: any) => {
    console.log('🔄 Store wrapper called, checking fresh wallet state...');
    const currentAddress = localStorage.getItem('sui_wallet_address');
    console.log('📍 Current address from localStorage:', currentAddress);
    
    if (!currentAddress) {
      throw new Error('Please connect your wallet and refresh the page');
    }
    
    return storeResult(args);
  }, [storeResult]);

  return <GameComponent storeFn={storeResultWrapper} />;
};

export const GameComponent = ({
  storeFn,
}: {
  storeFn: (args: StoreArgs) => Promise<string>;
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameContainerRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        width: 800,
        height: 600,
        type: Phaser.AUTO,
        scene: [HomeScene, DungeonGameScene, new GameOverScene(storeFn)],
        scale: {
          width: '100%',
          height: '100%',
        },
        parent: 'game-container',
        pixelArt: true,
        physics: {
          default: 'arcade',
          arcade: {
            debug: false, // Disabled debug mode - no pink boxes or green lines!
            gravity: { y: 0, x: 1 },
          },
        },
      };

      const phaserGame = new Phaser.Game(config);
      phaserGameRef.current = phaserGame;
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <GameDetails />
      <div ref={gameContainerRef} id='game-container' />
    </div>
  );
};

export const Route = createFileRoute('/game')({
  component: GameWrapper,
});

const GameDetails = observer(() => {
  if (gameState.activeScene === 'game')
    return (
      <>
        <PlayerHealth />
        <PlayerScore />
        <RoundTimer />
        <CurrentRound />
      </>
    );
});

const RoundTimer = observer(() => {
  const currentRound = gameState.times.find((t) => t.round === gameState.level);

  const [time, setTime] = useState<number>(0);

  // create a timer on if time is not null
  useEffect(() => {
    if (currentRound) {
      const interval = setInterval(() => {
        setTime(Date.now() - currentRound.start);
      }, 100);

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentRound]);

  return (
    <div className='absolute bottom-4 left-4'>
      <div className='text-xl'>
        Current Round: {time ? (time / 1000).toFixed(2) : '0'} seconds
      </div>
    </div>
  );
});

const PlayerHealth = observer(() => {
  const totalLives = Array.from({ length: gameState.totalLives }, (_, i) => i);

  return (
    <div className='absolute top-4 left-4 flex flex-col gap-4'>
      <div className='flex flex-row items-center gap-4'>
        {totalLives.map((_, i) => (
          <img
            key={`heart-${String(i)}`}
            alt='heart'
            className='h-8 w-8'
            src='/heart.png'
          />
        ))}
      </div>
      <div className='flex h-2 w-[200px] items-center justify-start rounded-[6px] bg-accent'>
        <div
          className='h-2 rounded-[5px] bg-red-500'
          style={{ width: `${String(gameState.playerHealth)}%` }}
        />
      </div>
    </div>
  );
});

const PlayerScore = observer(() => {
  return (
    <div className='absolute top-4 right-4 flex flex-col gap-2 bg-black/70 p-4 rounded-lg border-2 border-yellow-500'>
      <div className='text-sm text-yellow-400 font-bold'>SCORE</div>
      <div className='font-golondrina text-5xl text-yellow-300'>{gameState.score.toLocaleString()}</div>
      <div className='text-xs text-gray-400'>Earn $SSS tokens!</div>
    </div>
  );
});

const CurrentRound = observer(() => {
  return (
    <div className='absolute top-12 right-1/2 flex translate-x-1/2 flex-col gap-4'>
      <div className='font-golondrina text-6xl'>Round: {gameState.level}</div>
    </div>
  );
});
