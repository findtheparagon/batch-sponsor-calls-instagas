import { CallStatus, NFTItem, TokenToWrap, TokenType } from "@/types";
import { useAppKitAccount } from "@reown/appkit/react";
import { Alchemy, Network } from "alchemy-sdk";
import { ChangeEvent, useEffect, useState } from "react";
import {
  encodeFunctionData,
  erc1155Abi,
  erc20Abi,
  erc721Abi,
  getAddress,
  parseGwei,
  type Address
} from "viem";
import {
  useCallsStatus,
  useCapabilities,
  useChainId,
  useSendCalls,
  useSendTransaction
} from "wagmi";
import { multiwrapAbi } from "../abi";
import { Bundler } from "./Bundler";
import { MyWrappedTokens } from "./MyWrappedTokens";
import { OperationStatusDialog } from "./OperationStatusDialog";
import { Button } from "./ui/button";

const multiwrapAddress = "0x0Ec8C4C80E4965381999C281C5a7173a9cd30cfD";

interface ActionButtonListProps {}

const chainIdToNetwork = {
  1: "ethereum",
  84532: "base-sepolia",
  11155111: "sepolia",
  10: "optimism"
};

const chainIdToAlchemyNetwork = {
  1: Network.ETH_MAINNET,
  84532: Network.BASE_SEPOLIA,
  11155111: Network.ETH_SEPOLIA,
  10: Network.OPT_MAINNET
};

const clientCache = new Map<Network, Alchemy>();

const getAlchemyClient = (chainId: keyof typeof chainIdToAlchemyNetwork) => {
  const network = chainIdToAlchemyNetwork[chainId];
  if (!clientCache.has(network)) {
    clientCache.set(
      network,
      new Alchemy({
        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
        network: network
      })
    );
  }
  return clientCache.get(network)!;
};

const chainIdToSponsorshipPolicyId = {
  1: import.meta.env.VITE_ETHEREUM_SPONSORSHIP_POLICY_ID,
  84532: import.meta.env.VITE_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  11155111: import.meta.env.VITE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  10: import.meta.env.VITE_OPTIMISM_SPONSORSHIP_POLICY_ID,
  31337: import.meta.env.VITE_ANVIL_SPONSORSHIP_POLICY_ID
};

const candideApiKey = import.meta.env.VITE_CANDIDE_APY_KEY;
const candidePaymasterVersion = "v3";

type ERC20Meta = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: string;
  rawAmount: bigint;
  logo: string | null;
};

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const uriRegex = /^(https?:\/\/|ipfs:\/\/)[^\s]+$/;

export const ActionButtonList = ({}: ActionButtonListProps) => {
  const [isCreating, setIsCreating] = useState(false);

  const [selectedERC20Tokens, setSelectedERC20Tokens] = useState<ERC20Meta[]>(
    []
  );
  const [selectedNFTs, setSelectedNFTs] = useState<NFTItem[]>([]);

  const [formData, setFormData] = useState({
    uri: ""
  });

  const [validUri, setValidUri] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >();

  const resetState = () => {
    setSelectedERC20Tokens([]);
    setSelectedNFTs([]);
    setFormData({ uri: "" });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const chainId = useChainId() as keyof typeof chainIdToNetwork;

  const sponsorshipPolicyId = chainIdToSponsorshipPolicyId[chainId];
  const paymasterUrl = `https://api.candide.dev/paymaster/${candidePaymasterVersion}/${chainIdToNetwork[chainId]}/${candideApiKey}`;

  // const { disconnect } = useDisconnect(); // AppKit hook to disconnect
  // const { open } = useAppKit(); // AppKit hook to open the modal
  const { address, isConnected } = useAppKitAccount(); // AppKit hook to get the address and check if the user is connected

  const { data: capabilities } = useCapabilities({
    account: address as Address
  }); // Wagmi hook to check wallet capabilities (for sponsorship)
  const {
    sendCalls,
    data: id,
    isPending: isCallsPending,
    isSuccess: isCallsSuccess,
    isError: isCallsError,
    reset: resetCalls,
    failureReason: failureReasonCalls
  } = useSendCalls(); // Wagmi hook to send sponsored and batch transactions
  const {
    data: hash,
    sendTransaction,
    sendTransactionAsync,
    isPending,
    isSuccess,
    isError,
    reset,
    failureReason: failureReasonTransaction
  } = useSendTransaction(); // Wagmi hook to send standard transaction

  // Validate on changes
  useEffect(() => {
    const erc20sValid = selectedERC20Tokens.every(token =>
      ethAddressRegex.test(token.address)
    );

    const atLeastOne = selectedERC20Tokens.length + selectedNFTs.length > 0;

    const isRecipientValid =
      address != undefined && ethAddressRegex.test(address);
    const uriIsValid = uriRegex.test(formData.uri);

    setValidUri(uriIsValid || formData.uri === "");
    setIsValid(isRecipientValid && uriIsValid && erc20sValid && atLeastOne);
  }, [selectedERC20Tokens, formData]);

  useEffect(() => {
    if (hash) {
      //sendHash(hash);
      setTransactionHash(hash);
      console.log("Hash: ", hash);
    }
  }, [hash]);

  // Check if capabilities are available
  useEffect(() => {
    if (capabilities && address && chainId) {
      //sendCapabilities(capabilities);
      console.log("capabilities: ", capabilities);
    }
  }, [capabilities, address, chainId]);

  // Function to send transactions
  const handleSendTx = () => {
    const erc721Tokens = selectedNFTs.filter(nft => nft.tokenType == "ERC721");
    const erc1155Tokens = selectedNFTs.filter(
      nft => nft.tokenType == "ERC1155"
    );

    const erc20Txs = selectedERC20Tokens.map(token => ({
      to: getAddress(token.address),
      value: parseGwei("0"),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [multiwrapAddress, token.rawAmount]
      })
    }));

    const erc721Txs = erc721Tokens.map(token => ({
      to: getAddress(token.contractAddress),
      value: parseGwei("0"),
      data: encodeFunctionData({
        abi: erc721Abi,
        functionName: "approve",
        args: [multiwrapAddress, token.tokenId]
      })
    }));

    const uniqueERC1155Addresses = Array.from(
      new Set(erc1155Tokens.map(nft => nft.contractAddress))
    );

    const erc1155Txs = uniqueERC1155Addresses.map(contractAddress => ({
      to: getAddress(contractAddress),
      value: parseGwei("0"),
      data: encodeFunctionData({
        abi: erc1155Abi,
        functionName: "setApprovalForAll",
        args: [multiwrapAddress, true]
      })
    }));

    const erc20Wraped = selectedERC20Tokens.map(token => ({
      assetContract: token.address,
      tokenType: TokenType.ERC20,
      tokenId: 0n,
      totalAmount: token.rawAmount
    }));

    const erc721Wraped = erc721Tokens.map(token => ({
      assetContract: token.contractAddress,
      tokenType: TokenType.ERC721,
      tokenId: token.tokenId,
      totalAmount: 0n
    }));

    const erc1155Wraped = erc1155Tokens.map(token => ({
      assetContract: token.contractAddress,
      tokenType: TokenType.ERC1155,
      tokenId: token.tokenId,
      totalAmount: 0n
    }));

    const tokensToWrap: TokenToWrap[] = [
      ...erc20Wraped,
      ...erc721Wraped,
      ...erc1155Wraped
    ];

    const tx2 = {
      to: getAddress(multiwrapAddress),
      value: parseGwei("0"),
      data: encodeFunctionData({
        abi: multiwrapAbi,
        functionName: "wrap",
        args: [tokensToWrap, formData.uri, address]
      })
    };

    const txs = [...erc20Txs, ...erc721Txs, ...erc1155Txs, tx2];

    // if smart capabilities are supported, send a sponsored batched transaction
    try {
      if (!capabilities) {
        // Fallback to standard sendTransactions if capabilities are not available
        // sendTransaction(tx1);
        // sendTransaction(tx2);
        for (const tx of txs) {
          try {
            sendTransaction(tx);
          } catch (err) {
            console.error("Transaction failed for", address, err);
          }
        }
        return;
      }

      const atomicStatus = capabilities[chainId].atomic?.status;
      const isAtomicSupported =
        atomicStatus === "supported" || atomicStatus === "ready";
      const isPaymasterSupported =
        capabilities[chainId].paymasterService?.supported;

      if (isAtomicSupported) {
        if (isPaymasterSupported) {
          sendCalls({
            calls: txs,
            // and sponsor the tx, optionally with a sponsorshipPolicyId
            capabilities: {
              paymasterService: {
                url: paymasterUrl,
                optional: true,
                context: {
                  sponsorshipPolicyId
                }
              }
            }
          });
        } else {
          sendCalls({
            calls: txs
          });
        }
      } else {
        // if not, fallback to standard sendTransactions
        // sendTransaction(tx1);
        // sendTransaction(tx2);
        for (const tx of txs) {
          try {
            sendTransaction(tx);
          } catch (err) {
            console.error("Transaction failed for", address, err);
          }
        }
      }
    } catch (err) {
      //sendError(`Error sending transaction:'${err}`);
      console.log("Error sending transaction:", err);
    }
  };

  // get status of sendCalls
  const {
    data: callStatusData,
    refetch: refetchCallStatus,
    failureReason: failureReasonCall
  } = useCallsStatus({
    id: id?.id || "",
    query: {
      enabled: !!id,
      refetchInterval: data =>
        data.state.data?.status === "success" ? false : 1000
    }
  });

  const unwrapToken = async (tokenId: BigInt) => {
    const unwrapTx = {
      to: getAddress(multiwrapAddress),
      value: parseGwei("0"),
      data: encodeFunctionData({
        abi: multiwrapAbi,
        functionName: "unwrap",
        args: [tokenId, address]
      })
    };

    try {
      await sendTransactionAsync(unwrapTx);
    } catch (err) {
      console.error("Transaction failed for", address, err);
    }
  };

  const status: CallStatus =
    isPending || isCallsPending
      ? "pending"
      : isSuccess || isCallsSuccess
      ? "success"
      : isError || isCallsError
      ? "failure"
      : undefined;

  const statusForDialog: CallStatus = callStatusData?.status || status;
  const failureReason =
    failureReasonCall || failureReasonCalls || failureReasonTransaction;

  useEffect(() => {
    if (!callStatusData) return;

    //sendStatus(callStatusData.status);

    if (callStatusData.status === "success") {
      resetState();
      refetchCallStatus();
      const receipts = callStatusData.receipts;
      if (receipts && receipts.length > 0) {
        //sendHash(receipts[0].transactionHash);
        setTransactionHash(receipts[0].transactionHash);
      }
    }
  }, [callStatusData, refetchCallStatus]);

  useEffect(() => {
    if (statusForDialog && !dialogOpen) {
      setDialogOpen(true);
    }
    if (status === undefined) {
      reset();
      resetCalls();
    }
  }, [status, statusForDialog, reset, resetCalls]);

  const handleAddERC20Token = (token: ERC20Meta) => {
    setSelectedERC20Tokens(prev => [...prev, token]);
  };

  const handleRemoveToken = (addressToRemove: string) => {
    setSelectedERC20Tokens(prev =>
      prev.filter(token => token.address !== addressToRemove)
    );
  };

  const handleAddNFT = (nft: NFTItem) => {
    setSelectedNFTs(prev => [...prev, nft]);
  };

  const handleRemoveNFT = (contract: string, tokenId: BigInt) => {
    setSelectedNFTs(prev =>
      prev.filter(
        nft => !(nft.contractAddress === contract && nft.tokenId === tokenId)
      )
    );
  };

  // const handleDisconnect = async () => {
  //   try {
  //     await disconnect();
  //   } catch (error) {
  //     sendError(`Error sending transaction:'${error}`);
  //     console.error("Failed to disconnect:", error);
  //   }
  // };

  return (
    isConnected &&
    address && (
      <div className="flex-1 w-full">
        <OperationStatusDialog
          status={statusForDialog}
          open={dialogOpen}
          error={failureReason}
          onOpenChange={setDialogOpen}
          transactionHash={transactionHash}
        />
        {/* <div className="mx-4">
          <div className="flex gap-x-2 my-4 justify-end items-center">
            <Button onClick={() => open()}>Open</Button>
            <Button onClick={handleDisconnect}>Disconnect</Button>
          </div>
        </div> */}

        <div className="border rounded-lg mx-4">
          {isCreating ? (
            <>
              <div className="flex justify-between items-center border-b p-4 mb-4">
                <h1 className="text-xl font-bold">New Bundle</h1>
                <Button
                  onClick={() => setIsCreating(false)}
                  variant={"destructive"}
                >
                  Cancel
                </Button>
              </div>
              <div className="px-4">
                <Bundler
                  multiwrapAddress={multiwrapAddress}
                  address={address}
                  alchemy={getAlchemyClient(chainId)}
                  selectedERC20Tokens={selectedERC20Tokens}
                  selectedNFTs={selectedNFTs}
                  formData={formData}
                  validUri={validUri}
                  isValid={isValid}
                  onUriChange={handleChange}
                  onSendTx={handleSendTx}
                  onAddERC20Token={handleAddERC20Token}
                  onRemoveERC20Token={handleRemoveToken}
                  onAddNFT={handleAddNFT}
                  onRemoveNFT={handleRemoveNFT}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center border-b p-4">
                <h1 className="text-xl font-bold">My Stp's</h1>
                <Button onClick={() => setIsCreating(true)}>New STP</Button>
              </div>
              <div className="px-4">
                <MyWrappedTokens
                  alchemy={getAlchemyClient(chainId)}
                  contractAddress={multiwrapAddress}
                  ownerAddress={address}
                  unwrapToken={unwrapToken}
                  status={statusForDialog}
                  onCreate={() => setIsCreating(true)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  );
};
