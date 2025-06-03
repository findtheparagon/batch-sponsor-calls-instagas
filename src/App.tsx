import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { ActionButtonList } from "./components/ActionButtonList";
import { metadata, networks, projectId, wagmiAdapter } from "./config";

import "./App.css";
import Logo from "./assets/logo.svg";

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
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="h-screen flex flex-col">
          <header className="flex h-[72px] items-center justify-between gap-8 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Logo />
            </div>
            <h1 className="font-bold uppercase font-[Syne] text-2xl">
              STP Generator
            </h1>
            <div className="justify-end">
              <appkit-button />
            </div>
          </header>

          <ActionButtonList />
          {/* 
          <InfoList
            hash={transactionHash}
            capabilities={capabilities}
            error={error}
            status={status}
          /> */}
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
