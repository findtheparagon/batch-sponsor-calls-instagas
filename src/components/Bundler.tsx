import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NFTItem } from "@/types";
import { Alchemy } from "alchemy-sdk";
import { Trash2 } from "lucide-react";
import * as React from "react";
import AddERC20TokenDialog from "./AddERC20TokenDialog";
import { AddNFTDialog } from "./AddNFTDialog";
import MetadataViewer from "./MetadataViewer";

type ERC20Meta = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: string;
  rawAmount: bigint;
  logo: string | null;
};

interface BundlerSectionProps {
  multiwrapAddress: string;
  address: string;
  alchemy: Alchemy;
  selectedERC20Tokens: ERC20Meta[];
  selectedNFTs: NFTItem[];
  formData: { uri: string };
  validUri: boolean;
  isValid: boolean;
  onUriChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendTx: () => void;
  onAddERC20Token: (token: ERC20Meta) => void;
  onRemoveERC20Token: (address: string) => void;
  onAddNFT: (nft: NFTItem) => void;
  onRemoveNFT: (contract: string, tokenId: bigint) => void;
}

const ERC20Card = ({
  token,
  onRemoveERC20Token,
  ...props
}: React.ComponentProps<"div"> & {
  token: ERC20Meta;
  onRemoveERC20Token: (address: string) => void;
}) => {
  return (
    <Card className="w-full max-w-sm" {...props}>
      <CardHeader>
        <CardTitle>{token.name}</CardTitle>
        <CardDescription>{token.symbol}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{token.amount}</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          size={"icon"}
          onClick={() => onRemoveERC20Token(token.address)}
          className="text-red-500 rounded-full"
        >
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
};

const NFTCard = ({
  nft,
  onRemoveNFT,
  ...props
}: React.ComponentProps<"div"> & {
  nft: NFTItem;
  onRemoveNFT: (address: string, tokenId: bigint) => void;
}) => {
  return (
    <Card
      {...props}
      key={`${nft.contractAddress}-${nft.tokenId}`}
      className="w-full pt-0"
    >
      <CardHeader className="px-0">
        {nft.imageUrl && (
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg font-semibold">{nft.name}</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          ID: {nft.tokenId.toString()}, {nft.tokenType}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          size={"icon"}
          onClick={() => onRemoveNFT(nft.contractAddress, nft.tokenId)}
          className="text-red-500 rounded-full"
        >
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
};

export const Bundler = ({
  multiwrapAddress,
  address,
  alchemy,
  selectedERC20Tokens,
  selectedNFTs,
  formData,
  validUri,
  isValid,
  onUriChange,
  onSendTx,
  onAddERC20Token,
  onRemoveERC20Token,
  onAddNFT,
  onRemoveNFT
}: BundlerSectionProps) => {
  const [selectedTab, setSelectedTab] = React.useState("erc20-tokens");
  const onTabChange = (value: string) => {
    setSelectedTab(value);
  };

  return (
    <div className="mb-4">
      <Tabs value={selectedTab} onValueChange={onTabChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="erc20-tokens">ERC20 Tokens</TabsTrigger>
            <TabsTrigger value="nfts">NFTs (ERC721 & ERC1155)</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <AddERC20TokenDialog
              address={address}
              alchemy={alchemy}
              excludedAddresses={selectedERC20Tokens.map(t => t.address)}
              onAdd={onAddERC20Token}
              onClick={() => setSelectedTab("erc20-tokens")}
            />
            <AddNFTDialog
              alchemy={alchemy}
              ownerAddress={address}
              excludedNFTs={selectedNFTs.map(nft => ({
                contractAddress: nft.contractAddress,
                tokenId: nft.tokenId
              }))}
              excludedContracts={[multiwrapAddress]}
              onAdd={onAddNFT}
              onClick={() => setSelectedTab("nfts")}
            />
          </div>
        </div>
        <div className="py-4">
          <TabsContent value="erc20-tokens">
            {selectedERC20Tokens.length == 0 && (
              <div>You have not selected tokens to wrap</div>
            )}
            {selectedERC20Tokens.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {selectedERC20Tokens.map((token, idx) => (
                  <ERC20Card
                    key={`${token.address}-${idx}`}
                    token={token}
                    onRemoveERC20Token={onRemoveERC20Token}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="nfts">
            {selectedNFTs.length == 0 && (
              <div>You have not selected NFTs to wrap</div>
            )}
            {selectedNFTs.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {selectedNFTs.map(nft => (
                  <NFTCard
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    nft={nft}
                    onRemoveNFT={onRemoveNFT}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <div className="my-4">
        <label className="block text-sm font-medium">URI</label>
        <Input
          type="text"
          name="uri"
          placeholder="ipfs://..."
          value={formData.uri}
          onChange={onUriChange}
          className={validUri ? "" : "invalid"}
        />
        {formData.uri && validUri && <MetadataViewer uri={formData.uri} />}
      </div>

      <div className="flex justify-end">
        <Button disabled={!isValid} onClick={onSendTx}>
          Send tx
        </Button>
      </div>

      {/* <div className="bg-primary-foreground my-4 p-4 rounded-lg">
        <h2 className="font-bold mb-4">Debug</h2>
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
      </div> */}
    </div>
  );
};
