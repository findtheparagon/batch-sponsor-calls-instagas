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

interface MyWrappedTokensProps {
  alchemy: Alchemy;
  ownerAddress: string;
  contractAddress: string;
  unwrapToken: (tokenId: BigInt) => Promise<void>;
  onCreate: () => void;
}

interface NFTItem {
  tokenId: BigInt;
  name: string;
  imageUrl?: string;
  tokenType: string;
}

export function MyWrappedTokens({
  alchemy,
  ownerAddress,
  contractAddress,
  unwrapToken,
  onCreate
}: MyWrappedTokensProps) {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTokenId, setSelectedTokenId] = useState<BigInt>();
  const selectedNFT = nfts.find(nft => nft.tokenId === selectedTokenId);

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

  return (
    <div className="flex h-screen">
      <aside className="w-1/3">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : nfts.length === 0 ? (
          <p>You don't own wrapped NFTs</p>
        ) : (
          <>
            <ScrollArea className="h-full">
              <Button onClick={load} size={"icon"}>
                <RefreshCcw />
              </Button>
              <div className="grid grid-cols-1 gap-4 py-4 pr-4">
                {nfts.map(nft => (
                  <div
                    key={nft.tokenId.toString()}
                    className="flex gap-4 px-4 py-3 justify-between border rounded-lg"
                    onClick={() => setSelectedTokenId(nft.tokenId)}
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
                                await unwrapToken(nft.tokenId);
                                load();
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

      <main className="flex-1 p-6">
        {selectedNFT && (
          <>
            <h2 className="text-xl font-semibold mb-4">{selectedNFT.name}</h2>
            <p className="text-muted-foreground">
              tokenId: {selectedNFT.tokenId.toString()}
            </p>

            {selectedNFT.imageUrl && (
              <MediaViewer
                url={selectedNFT.imageUrl}
                description={selectedNFT.name}
              />
            )}
          </>
        )}

        {!selectedNFT && nfts.length > 0 && (
          <div className="grid place-items-center h-full">Select a NFT</div>
        )}

        {!selectedNFT && nfts.length == 0 && (
          <div className="grid place-items-center h-full">
            <div>
              To create a bundle click on{" "}
              <Button onClick={onCreate}>New bundle</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
