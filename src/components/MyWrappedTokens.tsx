"use client";

import { useEffect, useState } from "react";
import { Alchemy } from "alchemy-sdk";
import MediaViewer from "./MediaViewer";
import { Button } from "./ui/button";
import { RefreshCcw } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { CallStatus, TokenType } from "@/types";
import { usePublicClient } from "wagmi";
import { multiwrapAbi } from "@/abi";

interface MyWrappedTokensProps {
  alchemy: Alchemy;
  ownerAddress: string;
  contractAddress: `0x${string}`;
  unwrapToken: (tokenId: BigInt) => Promise<void>;
  onCreate: () => void;
  status: CallStatus;
}

interface NFTItem {
  tokenId: BigInt;
  name: string;
  imageUrl?: string;
  tokenType: string;
}

interface WrappedContentsType {
  assetContract: `0x${string}`;
  tokenId: bigint;
  tokenType: bigint;
  totalAmount: bigint;
}

export function MyWrappedTokens({
  alchemy,
  ownerAddress,
  contractAddress,
  unwrapToken,
  onCreate,
  status
}: MyWrappedTokensProps) {
  const publicClient = usePublicClient()!;

  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTokenIdToUnwrap, setSelectedTokenIdToUnwrap] =
    useState<BigInt>();

  const [selectedTokenId, setSelectedTokenId] = useState<BigInt>();
  const selectedNFT = nfts.find(nft => nft.tokenId === selectedTokenId);

  const [wrappedContents, setWrappedContents] =
    useState<WrappedContentsType[]>();

  const fetchWrappedContents = async (tokenId: BigInt) => {
    const result = (await publicClient.readContract({
      address: contractAddress,
      abi: multiwrapAbi,
      functionName: "getWrappedContents",
      args: [tokenId]
    })) as WrappedContentsType[];

    return result; // contiene { erc20Tokens, erc721Tokens, erc1155Tokens }
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await alchemy.nft.getNftsForOwner(ownerAddress, {
        contractAddresses: [contractAddress]
      });

      const items = response.ownedNfts.map(nft => ({
        tokenId: BigInt(nft.tokenId),
        name: nft.name || `#${nft.tokenId}`,
        imageUrl: nft.image.thumbnailUrl || nft.image.cachedUrl,
        tokenType: nft.tokenType
      }));

      setNfts(items);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [alchemy, ownerAddress, contractAddress]);

  useEffect(() => {
    if (selectedTokenId) {
      fetchWrappedContents(selectedTokenId)
        .then(setWrappedContents)
        .catch(e => console.error(e));
    }
  }, [selectedTokenId]);

  const handleRemoveToken = (tokenId: BigInt) => {
    setNfts(prev => prev.filter(nft => nft.tokenId !== tokenId));
  };

  useEffect(() => {
    if (status == "success" && selectedTokenIdToUnwrap) {
      handleRemoveToken(selectedTokenIdToUnwrap);
      setSelectedTokenIdToUnwrap(undefined);
    }
  }, [status, selectedTokenIdToUnwrap]);

  return (
    <div className="flex">
      <aside className="w-1/3">
        {loading ? (
          <div className="grid place-items-center h-fit">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-160px)] w-full">
              <div className="grid grid-cols-1 gap-4 py-4 pr-4">
                <Button onClick={load} size={"icon"}>
                  <RefreshCcw />
                </Button>
                {nfts.map(nft => (
                  <div
                    key={nft.tokenId.toString()}
                    className="flex gap-4 px-4 py-3 justify-between border rounded-lg cursor-pointer"
                    onClick={() => {
                      setWrappedContents(undefined);
                      setSelectedTokenId(nft.tokenId);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[70px]"
                        style={{
                          backgroundImage: `url("${nft.imageUrl}");`
                        }}
                      >
                        {nft.imageUrl && (
                          <MediaViewer
                            url={nft.imageUrl}
                            description={nft.name}
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <p className="text-white text-base font-medium leading-normal">
                          {nft.name}
                        </p>
                        <p className="text-[#9cabba] text-sm font-normal leading-normal">
                          tokenId: {nft.tokenId.toString()}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size={"sm"}>Unwrap</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently unwrap the token #
                              {nft.tokenId.toString()}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                setSelectedTokenIdToUnwrap(nft.tokenId);
                                await unwrapToken(nft.tokenId);
                              }}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </aside>

      <main className="flex-1 border-l p-6">
        {selectedNFT && (
          <>
            <h2 className="text-xl font-semibold mb-4">{selectedNFT.name}</h2>
            <p className="text-muted-foreground">
              tokenId: {selectedNFT.tokenId.toString()}
            </p>
            <div className="w-1/2">
              {selectedNFT.imageUrl && (
                <MediaViewer
                  url={selectedNFT.imageUrl}
                  description={selectedNFT.name}
                />
              )}
            </div>
            {wrappedContents && (
              <div>
                {wrappedContents.map(wrappedContent => (
                  <div className="border rounded-lg my-2 p-2">
                    <i>{wrappedContent.assetContract}</i>
                    <div>{TokenType[Number(wrappedContent.tokenType)]}</div>
                    {wrappedContent.tokenType != BigInt(TokenType.ERC20) && (
                      <span>#{wrappedContent.tokenId}</span>
                    )}
                    {wrappedContent.tokenType == BigInt(TokenType.ERC20) && (
                      <span>{wrappedContent.totalAmount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!selectedNFT && !loading && nfts.length > 0 && (
          <div className="grid place-items-center ">Select a NFT</div>
        )}

        {!selectedNFT && !loading && nfts.length == 0 && (
          <div className="grid place-items-center h-max">
            <div>
              To create a bundle click on{" "}
              <Button onClick={onCreate}>New STP</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
