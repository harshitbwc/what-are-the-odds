"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from "next/navigation";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, baseSepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { FaPlus } from "react-icons/fa";
import "@rainbow-me/rainbowkit/styles.css";
import "../app/globals.css";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "What Are The Odds",
  projectId: "8679ef916e22b6fd5cc515389532659c",
  chains: [baseSepolia],
  transports: {
    // [mainnet.id]: http(),
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/JaJCOlWhLoGaN7evugp8w6sVXg56WEJB'),
  },
});

export default function RootLayout({ children }) {
  const router = useRouter();

  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}