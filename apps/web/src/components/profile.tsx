import { useCurrentAccount } from '@mysten/dapp-kit';
import { ProfileTable } from './profile-table';
import { useState, useEffect } from 'react';

export const ProfileDetails = () => {
  const account = useCurrentAccount();
  const [profileData, setProfileData] = useState<any[]>([]);

  useEffect(() => {
    if (account) {
      // Load profile data from localStorage
      const stored = localStorage.getItem('shadow_stake_saga_leaderboard');
      if (stored) {
        const allScores = JSON.parse(stored);
        // Filter scores for this user
        const userScores = allScores.filter(
          (entry: any) => entry.address === account.address
        );
        
        // Convert to profile format
        const formattedData = userScores.map((entry: any, index: number) => ({
          record: {
            id: `game-${index}`,
            timestamp: BigInt(entry.timestamp),
            totalRounds: BigInt(entry.round),
            totalScore: BigInt(entry.score),
          },
          times: [],
        }));
        
        setProfileData(formattedData);
      }
    }
  }, [account]);

  if (!account) {
    return (
      <div className='absolute top-24 right-1/2 mx-auto w-full max-w-screen-xl translate-x-1/2 rounded-xl bg-[#0b171dd0] px-8 py-6'>
        <div className='font-golondrina text-4xl text-center text-red-400'>
          Please connect your OneChain wallet to view profile
        </div>
      </div>
    );
  }

  return (
    <div className='absolute top-24 right-1/2 mx-auto w-full max-w-screen-xl translate-x-1/2 rounded-xl bg-[#0b171dd0] px-8 py-6'>
      <div className='font-golondrina text-7xl mb-4'>Profile Details</div>
      <div className='text-gray-400 mb-4'>
        Address: {account.address.slice(0, 10)}...{account.address.slice(-8)}
      </div>
      <div className='text-yellow-400 mb-6'>
        Total Games Played: {profileData.length}
      </div>
      <ProfileTable
        // @ts-expect-error -- safe for read-only
        data={profileData}
      />
    </div>
  );
};
