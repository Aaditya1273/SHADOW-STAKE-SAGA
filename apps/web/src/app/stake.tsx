import { createFileRoute } from '@tanstack/react-router';
import { StakingPage } from '~/components';

export const StakeComponent = () => {
  return (
    <div className='!m-0 !p-0'>
      <img
        alt='background'
        className='absolute h-screen w-full'
        src='/background.png'
      />
      <StakingPage />
      
    </div>
  );
};

export const Route = createFileRoute('/stake')({
  component: StakeComponent,
});
