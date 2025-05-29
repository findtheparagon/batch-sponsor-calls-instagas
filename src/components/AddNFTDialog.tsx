"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alchemy } from "alchemy-sdk";
import { Plus } from "lucide-react";
import { NFTItem } from "@/types";

export interface AddNFTDialogProps {
  alchemy: Alchemy;
  ownerAddress: string;
  excludedNFTs?: { contractAddress: string; tokenId: BigInt }[];
  excludedContracts?: string[];
  onAdd: (nft: NFTItem) => void;
}

export function AddNFTDialog({
  alchemy,
  ownerAddress,
  excludedNFTs = [],
  excludedContracts = [],
  onAdd
}: AddNFTDialogProps) {
  const [open, setOpen] = useState(false);
  const [nfts, setNfts] = useState<NFTItem[] | null>(null);
  const [selected, setSelected] = useState<NFTItem[]>([]);

  const isExcluded = (contract: string, tokenId: BigInt) =>
    excludedNFTs.some(
      n =>
        n.contractAddress.toLowerCase() === contract.toLowerCase() &&
        n.tokenId === tokenId
    ) ||
    excludedContracts.some(c => c.toLowerCase() === contract.toLowerCase());

  useEffect(() => {
    if (open) {
      alchemy.nft.getNftsForOwner(ownerAddress).then(res => {
        const filtered = res.ownedNfts.filter(
          nft => !isExcluded(nft.contract.address, BigInt(nft.tokenId))
        );

        const enriched: NFTItem[] = filtered.map(nft => ({
          contractAddress: nft.contract.address,
          tokenId: BigInt(nft.tokenId),
          name: nft.name || `#${nft.tokenId}`,
          imageUrl: nft.image.thumbnailUrl || nft.image.cachedUrl,
          tokenType: nft.tokenType as "ERC721" | "ERC1155"
        }));

        setNfts(enriched);
      });
    } else {
      setNfts(null);
      setSelected([]);
    }
  }, [open, ownerAddress, excludedNFTs]);

  const toggleSelect = (nft: NFTItem) => {
    setSelected(prev => {
      const exists = prev.find(
        s =>
          s.contractAddress === nft.contractAddress && s.tokenId === nft.tokenId
      );
      return exists
        ? prev.filter(
            s =>
              !(
                s.contractAddress === nft.contractAddress &&
                s.tokenId === nft.tokenId
              )
          )
        : [...prev, nft];
    });
  };

  const handleSelect = () => {
    if (selected.length > 0) {
      selected.forEach(nft => onAdd(nft));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add NFT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <h2 className="text-xl font-bold">Add NFT</h2>
        {!nfts ? (
          <p>Loading NFTs...</p>
        ) : nfts.length === 0 ? (
          <p>No NFTs available</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {nfts.map(nft => {
                const isSelected = selected.some(
                  s =>
                    s.contractAddress === nft.contractAddress &&
                    s.tokenId === nft.tokenId
                );
                return (
                  <div
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    onClick={() => toggleSelect(nft)}
                    className={`border p-2 rounded-lg cursor-pointer ${
                      isSelected ? "border-stone-500 bg-stone-800" : ""
                    }`}
                  >
                    {nft.imageUrl && (
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="h-32 w-full object-cover rounded"
                      />
                    )}
                    <div className="text-sm mt-1">
                      <strong>{nft.name}</strong>
                      <div className="text-xs text-muted-foreground">
                        {nft.tokenType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button onClick={handleSelect} disabled={selected.length == 0}>
                Add
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
