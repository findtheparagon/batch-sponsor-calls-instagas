import { useAppKitState } from "@reown/appkit/react";
import { useChainId, useWaitForTransactionReceipt } from "wagmi";
import type { Capabilities } from "viem";

interface InfoListProps {
  hash: `0x${string}` | undefined;
  capabilities: Capabilities | undefined;
  status: string | undefined;
  error: string;
}

export const InfoList = ({
  hash,
  capabilities,
  status,
  error
}: InfoListProps) => {
  const state = useAppKitState(); // AppKit hook to get the state
  const chainId = useChainId();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2, // Wait for at least 2 confirmation
    timeout: 300000, // Timeout in milliseconds (5 minutes)
    pollingInterval: 1000
  });

  if (capabilities && capabilities[chainId]) {
    console.log(capabilities[chainId].atomic);
  }

  return (
    <>
      {(status || hash) && (
        <section>
          <h2>Transaction Hash</h2>
          <pre>
            Hash: {hash}
            <br />
            Status: {status || receipt?.status.toString()}
            <br />
          </pre>
        </section>
      )}
      {error && (
        <section>
          <h2>Error</h2>
          <pre>{error}</pre>
        </section>
      )}

      <section>
        <h2>Smart Capabilities</h2>
        <div>
          If the wallet supports smart capabilities, the dApp will send
          sponsored smart calls.
          <br />
          If the wallet does not support smart capabilities, the dApp will
          fallback to sending standard tx calls.
          <br />
          <br />
          <b>Capabilities for chainId {chainId}:</b>
          <br />
          {capabilities && capabilities[chainId] ? (
            <ul>
              <li>
                Atmoic Batching:{" "}
                {capabilities[chainId].atomic?.status
                  ? capabilities[chainId].atomic.status
                  : "No"}
              </li>
              <li>
                Paymaster Service Supported:{" "}
                {capabilities[chainId].paymasterService?.supported
                  ? "Yes"
                  : "No"}
              </li>
              <li>
                Auxiliary Funds Supported:{" "}
                {capabilities[chainId].auxiliaryFunds?.supported === "Yes" ||
                  "No"}
              </li>
            </ul>
          ) : (
            "undefined"
          )}
        </div>
      </section>

      <section>
        <h2>State</h2>
        <div>
          activeChain: {state.activeChain}
          <br />
          loading: {state.loading.toString()}
          <br />
          open: {state.open.toString()}
          <br />
          selectedNetworkId: {state.selectedNetworkId?.toString()}
          <br />
        </div>
      </section>
    </>
  );
};
