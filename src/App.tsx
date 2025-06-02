import { useEffect, useState } from "react";
import { createAppKit, useAppKitAccount } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import type { Capabilities } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ActionButtonList } from "./components/ActionButtonList";
import { InfoList } from "./components/InfoList";
import { projectId, metadata, networks, wagmiAdapter } from "./config";

import "./App.css";
import Logo from "./assets/logo.svg";
import { CallStatus } from "./types";

const queryClient = new QueryClient();

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: "dark" as const,
  themeVariables: {
    "--w3m-accent": "#333"
  }
};

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
});

export function App() {
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [capabilities, setCapabilities] = useState<Capabilities | undefined>(
    undefined
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState<CallStatus>();

  const account = useAppKitAccount();

  useEffect(() => {
    if (!account.isConnected) {
      setError("");
      setStatus(undefined);
      setCapabilities(undefined);
      setTransactionHash(undefined);
    }
  }, [account]);

  const receiveHash = (hash: `0x${string}`) => {
    setTransactionHash(hash); // Update the state with the transaction hash
  };

  const receiveCapabilities = (capabilities: Capabilities) => {
    setCapabilities(capabilities);
  };

  const receiveError = (error: string) => {
    setError(error);
  };

  const receiveStatus = (status: CallStatus | undefined) => {
    setStatus(status);
  };

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="w-full">
          <div className="flex h-[72px] items-center justify-between gap-8 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Logo />
            </div>
            <div className="font-bold uppercase">Token Bundler</div>
            <div className="justify-end">
              <appkit-button />
            </div>
          </div>

          <ActionButtonList
            sendHash={receiveHash}
            sendCapabilities={receiveCapabilities}
            sendError={receiveError}
            sendStatus={receiveStatus}
          />

          <InfoList
            hash={transactionHash}
            capabilities={capabilities}
            error={error}
            status={status}
          />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
