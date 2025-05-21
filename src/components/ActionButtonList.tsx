import { useEffect } from 'react';
import { useDisconnect, useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Hex, parseGwei, toHex, type Address, Capabilities, zeroAddress, parseUnits, encodeFunctionData } from 'viem';
import {
  useChainId,
  useSendTransaction,
  useSendCalls,
  useCallsStatus,
  useCapabilities
} from 'wagmi';

import { erc20Abi, multiwrapAbi } from '../abi';

const erc20Address = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const multiwrapAddress = '0x0Ec8C4C80E4965381999C281C5a7173a9cd30cfD';
const amount = parseUnits('5', 6); // 5 usdc
const recipient = '0x27764f3d7075dc999e33D5F6440C779C5fe65eD5';
const uri = '';

const data1 = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [ multiwrapAddress, amount ]
});

// Test transaction
const tx1 = {
  to: erc20Address,
  value: parseGwei('0'),
  data: data1
};

const tokensToWrap = [{
    assetContract: erc20Address,
    tokenType: 0,
    tokenId: 5,
    totalAmount: amount
}];

const data2 = encodeFunctionData({
  abi: multiwrapAbi,
  functionName: 'wrap',
  args: [tokensToWrap, uri, recipient]
});

const tx2 = {
  to: multiwrapAddress,
  value: parseGwei('0'),
  data: data2
};

interface ActionButtonListProps {
  sendHash: (hash: `0x${string}`) => void;
  sendCapabilities: (capabilities: Capabilities) => void
  sendStatus: (status: string | undefined) => void
  sendError: (error: string) => void
}

const chainIdToNetwork = {
  1: 'ethereum',
  84532: 'base-sepolia',
  11155111: 'sepolia',
  10: 'optimism',
  31337: 'anvil',
};

const chainIdToSponsorshipPolicyId = {
  1: import.meta.env.VITE_ETHEREUM_SPONSORSHIP_POLICY_ID,
  84532: import.meta.env.VITE_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  11155111: import.meta.env.VITE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  10: import.meta.env.VITE_OPTIMISM_SPONSORSHIP_POLICY_ID,
  31337: import.meta.env.VITE_ANVIL_SPONSORSHIP_POLICY_ID,
};

const candideApiKey = import.meta.env.VITE_CANDIDE_APY_KEY
const candidePaymasterVersion = "v3";

export const ActionButtonList = ({
  sendHash,
  sendCapabilities,
  sendStatus,
  sendError
}: ActionButtonListProps) => {
  const chainId = useChainId() as keyof typeof chainIdToNetwork;

  const sponsorshipPolicyId = chainIdToSponsorshipPolicyId[chainId];
  const paymasterUrl = `https://api.candide.dev/paymaster/${candidePaymasterVersion}/${chainIdToNetwork[chainId]}/${candideApiKey}`;

  const { disconnect } = useDisconnect(); // AppKit hook to disconnect
  const { open } = useAppKit(); // AppKit hook to open the modal
  const { address, isConnected } = useAppKitAccount(); // AppKit hook to get the address and check if the user is connected

  const { data: capabilities } = useCapabilities({
    account: address as Address,
  }); // Wagmi hook to check wallet capabilities (for sponsorship)
  const { sendCalls, data: id } = useSendCalls(); // Wagmi hook to send sponsored and batch transactions
  const { data: hash, sendTransaction } = useSendTransaction(); // Wagmi hook to send standard transaction

  useEffect(() => {
    if (hash) {
      sendHash(hash);
      console.log("Hash: ", hash)
    }
  }, [hash]);

  // Check if capabilities are available
  useEffect(() => {
    if (capabilities && address && chainId) {
      sendCapabilities(capabilities);
      console.log("capabilities: ", capabilities);
    }
  }, [capabilities, address, chainId]);


  // Function to send transactions
  const handleSendTx = () => {
    // if smart capabilities are supported, send a sponsored batched transaction
    try {
      if (!capabilities) {
        // Fallback to standard sendTransactions if capabilities are not available
        sendTransaction(tx1);
        sendTransaction(tx2);
        return;
      }

      const atomicStatus = capabilities[chainId].atomic?.status;
      const isAtomicSupported = atomicStatus === "supported" || atomicStatus === "ready";
      const isPaymasterSupported = capabilities[chainId].paymasterService?.supported;

      if (isAtomicSupported) {
        if (isPaymasterSupported) {
          sendCalls({
            calls: [tx1, tx2],
            // and sponsor the tx, optionally with a sponsorshipPolicyId
            capabilities: {
              paymasterService: {
                [toHex(chainId)]: {
                  url: paymasterUrl,
                  optional: true,
                  context: {
                    sponsorshipPolicyId,
                  }
                }
              }
            },
          });
        } else {
          sendCalls({
            calls: [tx1, tx2],
          });
        }
      } else {
        // if not, fallback to standard sendTransactions
        sendTransaction(tx1);
        sendTransaction(tx2);
      }
    } catch (err) {
      sendError(`Error sending transaction:'${err}`)
      console.log('Error sending transaction:', err);
    }
  };

  // get status of sendCalls
  const { data: callStatusData, refetch: refetchCallStatus } = useCallsStatus({
    id: id?.id || '',
    query: {
      enabled: !!id,
      refetchInterval: (data) =>
        data.state.data?.status === "success" ? false : 1000,
    },
  });

  useEffect(() => {
    if (!callStatusData) return;

    sendStatus(callStatusData.status);

    if (callStatusData.status === "success") {
      refetchCallStatus();
      const receipts = callStatusData.receipts;
      if (receipts && receipts.length > 0) {
        sendHash(receipts[0].transactionHash);
      }
    }
  }, [callStatusData, refetchCallStatus, sendHash, sendStatus]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      sendError(`Error sending transaction:'${error}`)
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    isConnected && (
      <div>
        <button onClick={() => open()}>Open</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={handleSendTx}>Send tx</button>
      </div>
    )
  );
};
