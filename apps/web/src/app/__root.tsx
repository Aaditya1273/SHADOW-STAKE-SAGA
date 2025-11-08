import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ProviderTree } from '~/providers';
import { SuiWalletButton } from '~/components/sui-wallet-button';

import '../styles/globals.css';

const RootComponent = () => {
  return (
    <>
      {import.meta.env.MODE === 'development' && (
        <TanStackRouterDevtools position='bottom-right' />
      )}
      <ProviderTree>
        {/* Wallet Button in top right */}
        <div className="fixed top-4 right-4 z-50">
          <SuiWalletButton />
        </div>
        <Outlet />
      </ProviderTree>
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
