"use client";

import { useEffect, useState } from "react";
import { Alchemy } from "alchemy-sdk";
import MediaViewer from "./MediaViewer";
import { Button } from "./ui/button";

interface MyWrappedTokensProps {
  alchemy: Alchemy;
  ownerAddress: string;
  contractAddress: string;
  unwrapToken: (tokenId: BigInt) => void;
}

export function MyWrappedTokens({
  alchemy,
  ownerAddress,
  contractAddress,
  unwrapToken
}: MyWrappedTokensProps) {
  const [nfts, setNfts] = useState<
    {
      tokenId: BigInt;
      name: string;
      imageUrl?: string;
      tokenType: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true); // 👈

  useEffect(() => {
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
        console.error("Error al obtener NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [alchemy, ownerAddress, contractAddress]);

  return (
    <div className="space-y-2 mt-4">
      <h2 className="text-lg font-semibold">My Wrapped Tokens</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : nfts.length === 0 ? (
        <p>You don't own wrapped NFTs</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-2">
          {nfts.map(nft => (
            <div
              key={nft.tokenId.toString()}
              className="flex gap-4 px-4 py-3 justify-between border rounded-lg bg-accent"
            >
              <div className="flex items-start gap-4">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[70px]"
                  style={{
                    backgroundImage: `url("${nft.imageUrl}");`
                  }}
                >
                  {nft.imageUrl && (
                    <MediaViewer url={nft.imageUrl} description={nft.name} />
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
                <Button
                  size={"sm"}
                  onClick={() => {
                    unwrapToken(nft.tokenId);
                  }}
                >
                  Unwrap
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
