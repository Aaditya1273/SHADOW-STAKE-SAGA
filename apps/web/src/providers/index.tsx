import type { PropsWithChildren } from 'react';
import { SuiWalletProvider } from './sui-provider';

export const ProviderTree = ({ children }: PropsWithChildren) => {
  return (
    <SuiWalletProvider>
      {children}
    </SuiWalletProvider>
  );
};
