import { CallStatus, NFTItem, TokenToWrap, TokenType } from "@/types";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect
} from "@reown/appkit/react";
import { Alchemy, Network } from "alchemy-sdk";
import { Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import {
  Capabilities,
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
import AddERC20TokenDialog from "./AddERC20TokenDialog";
import MetadataViewer from "./MetadataViewer";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { AddNFTDialog } from "./AddNFTDialog";
import { OperationStatusDialog } from "./OperationStatusDialog";
import { MyWrappedTokens } from "./MyWrappedTokens";

const multiwrapAddress = "0x0Ec8C4C80E4965381999C281C5a7173a9cd30cfD";

interface ActionButtonListProps {
  sendHash: (hash: `0x${string}`) => void;
  sendCapabilities: (capabilities: Capabilities) => void;
  sendStatus: (status: CallStatus) => void;
  sendError: (error: string) => void;
}

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

export const ActionButtonList = ({
  sendHash,
  sendCapabilities,
  sendStatus,
  sendError
}: ActionButtonListProps) => {
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

  const { disconnect } = useDisconnect(); // AppKit hook to disconnect
  const { open } = useAppKit(); // AppKit hook to open the modal
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
      sendHash(hash);
      setTransactionHash(hash);
      console.log("Hash: ", hash);
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
      sendError(`Error sending transaction:'${err}`);
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

    sendStatus(callStatusData.status);

    if (callStatusData.status === "success") {
      resetState();
      refetchCallStatus();
      const receipts = callStatusData.receipts;
      if (receipts && receipts.length > 0) {
        sendHash(receipts[0].transactionHash);
        setTransactionHash(receipts[0].transactionHash);
      }
    }
  }, [callStatusData, refetchCallStatus, sendHash, sendStatus]);

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

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      sendError(`Error sending transaction:'${error}`);
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    isConnected &&
    address && (
      <div className="w-full">
        <OperationStatusDialog
          status={statusForDialog}
          open={dialogOpen}
          error={failureReason}
          onOpenChange={setDialogOpen}
          transactionHash={transactionHash}
        />
        <div className="flex gap-x-2 my-4 justify-center items-center">
          <Button onClick={() => open()}>Open</Button>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
        <div className="w-full max-w-[600px] m-auto">
          <Tabs defaultValue="erc20-tokens" className="w-full p-4">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Tokens</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="erc20-tokens"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  ERC20 Tokens
                </TabsTrigger>
                <TabsTrigger
                  value="nfts"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  NFTs (ERC721 & ERC1155)
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="erc20-tokens">
              {selectedERC20Tokens.length > 0 && (
                <div className="p-6 pt-0 grid gap-6">
                  {selectedERC20Tokens.map((token, idx) => (
                    <div
                      key={`${token.address}-${idx}`}
                      className="flex w-full flex-col gap-1 border rounded-2xl p-4"
                    >
                      <div>
                        <div className="flex items-center">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{token.name}</div>
                          </div>
                          <div className="ml-auto text-xs text-foreground">
                            {token.symbol}
                          </div>
                        </div>
                        <p className="">{token.amount}</p>
                      </div>

                      <div className="ml-auto">
                        <Button
                          onClick={() => handleRemoveToken(token.address)}
                          className="text-red-500 rounded-full cursor-pointer"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center px-6 py-2">
                <div className="ml-auto">
                  <AddERC20TokenDialog
                    address={address}
                    alchemy={getAlchemyClient(chainId)}
                    excludedAddresses={selectedERC20Tokens.map(t => t.address)}
                    onAdd={handleAddERC20Token}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="nfts">
              {selectedNFTs.length > 0 && (
                <div className="grid grid-cols-2 gap-6 mt-4 p-6">
                  {selectedNFTs.map(nft => (
                    <div
                      key={`${nft.contractAddress}-${nft.tokenId}`}
                      className="border p-4 rounded-xl relative"
                    >
                      {nft.imageUrl && (
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="h-40 w-full object-cover rounded mb-2"
                        />
                      )}
                      <p>
                        <strong>{nft.name}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        ID: {nft.tokenId}, {nft.tokenType}
                      </p>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleRemoveNFT(nft.contractAddress, nft.tokenId)
                        }
                        className="absolute top-5 right-5 text-red-500 rounded-full cursor-pointer"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center px-6 py-2">
                <div className="ml-auto">
                  <AddNFTDialog
                    alchemy={getAlchemyClient(chainId)}
                    ownerAddress={address}
                    excludedNFTs={selectedNFTs.map(nft => ({
                      contractAddress: nft.contractAddress,
                      tokenId: nft.tokenId
                    }))}
                    excludedContracts={[multiwrapAddress]}
                    onAdd={handleAddNFT}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="px-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700">
                URI
              </label>
              <Input
                type="text"
                name="uri"
                placeholder="ipfs://..."
                value={formData.uri}
                onChange={handleChange}
                className={`${validUri ? "" : "invalid"}`}
              />

              {formData.uri && validUri && (
                <MetadataViewer uri={formData.uri} />
              )}
            </div>
            <Button
              className="cursor-pointer"
              disabled={!isValid}
              onClick={handleSendTx}
            >
              Send tx
            </Button>
          </div>
        </div>

        <div className="w-full max-w-[600px] m-auto">
          <MyWrappedTokens
            alchemy={getAlchemyClient(chainId)}
            contractAddress={multiwrapAddress}
            ownerAddress={address}
            unwrapToken={unwrapToken}
          />
        </div>

        <section>
          <h2 className="font-bold mb-4">Debug</h2>
          <p>ChainId: {chainId}</p>
          <p>Recipient: {address}</p>
          <div className="mt-4">
            <h2>ERC20</h2>
            {selectedERC20Tokens.map(selectedToken => {
              return (
                <p>
                  {selectedToken.address} - {selectedToken.amount} (
                  {selectedToken.rawAmount})
                </p>
              );
            })}
          </div>
          <div className="mt-4">
            <h2>ERC721</h2>
            {selectedNFTs
              .filter(nft => nft.tokenType == "ERC721")
              .map(selectedToken => {
                return (
                  <p>
                    {selectedToken.contractAddress} - #{selectedToken.tokenId}
                  </p>
                );
              })}
          </div>
          <div className="mt-4">
            <h2>ERC1155</h2>
            {selectedNFTs
              .filter(nft => nft.tokenType == "ERC1155")
              .map(selectedToken => {
                return (
                  <p>
                    {selectedToken.contractAddress} - #{selectedToken.tokenId}
                  </p>
                );
              })}
          </div>
          <div className="mt-4">
            <p>URI: {formData.uri}</p>
          </div>
        </section>
      </div>
    )
  );
};
