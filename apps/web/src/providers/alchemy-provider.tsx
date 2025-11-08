import type { ReactNode } from "react";

import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { OneChainTestnet } from "../utils/contact";
import { type Config } from 'wagmi';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- getDefaultConfig returns a properly shaped object but lacks strong typing
const config: Config = getDefaultConfig({
  appName: "Shadow Stake Saga",
  projectId: "2d6454cc5c2fdc9eaad38d77535b559c",
  chains: [OneChainTestnet] ,
  ssr: false,
});

const queryClient = new QueryClient();

export const CustomRainbowKitProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#2463FF",
            fontStack: "system",
            overlayBlur: "small",
            borderRadius: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// export default CustomRainbowKitProvider;