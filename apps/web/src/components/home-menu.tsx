import { useState } from 'react';
import { cn } from '~/lib/utils';
import { useCurrentAccount } from '@mysten/dapp-kit';

// import { useLogout, useUser } from '@account-kit/react';
import { useNavigate } from '@tanstack/react-router';



export const HomeMenu = () => {
 // const user = useUser();
 // const { logout } = useLogout();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const isConnected = !!account;

  const items = [
    {
      name: 'Play',
      key: 'play',
      onClick: () => {
        if (!isConnected) {
          alert('Please connect your OneChain wallet first!');
          return;
        }
        navigate({ to: '/game' });
      },
    },
    {
      name: 'Leaderboard',
      key: 'leaderboard',
      onClick: () => {
        navigate({ to: '/leaderboard' });
      },
    },
    {
      name: 'Profile',
      key: 'profile',
      onClick: () => {
        if (!isConnected) {
          alert('Please connect your OneChain wallet first!');
          return;
        }
        navigate({ to: '/profile' });
      },
    },
    {
      name: 'Stake',
      key: 'stake',
      onClick: () => {
        if (!isConnected) {
          alert('Please connect your OneChain wallet first!');
          return;
        }
        navigate({ to: '/stake' });
      },
    },
  ];

  const [hovered, setHovered] = useState<string | null>(null);

  //if (!user) return <SignIn />;
  return (
    <div className='flex translate-y-12 flex-col items-center'>
      {items.map((item) => (
        <button
          key={item.key}
          type='button'
          className={cn(
            'py-2 font-golondrina text-5xl tracking-wide transition-all duration-200 ease-in-out',
            !isConnected && 'opacity-50 cursor-not-allowed',
            isConnected && (hovered ?? 'play') === item.key
              ? 'scale-[108%] text-neutral-100'
              : 'scale-100 text-neutral-300'
          )}
          onClick={item.onClick}
          onMouseEnter={() => isConnected && setHovered(item.key)}
          onMouseLeave={() => setHovered(null)}
          disabled={!isConnected}
        >
          {item.name}
          {!isConnected && ' 🔒'}
        </button>
       
        
      ))}
      
    </div>
  );
};
