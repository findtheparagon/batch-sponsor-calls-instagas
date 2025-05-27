export interface Erc721Attribute {
  trait_type?: string;
  value: string | number;
  display_type?: "number" | "boost_percentage" | "boost_number" | "date";
  max_value?: number;
}

export interface Erc721Metadata {
  name: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  attributes?: Erc721Attribute[];
  [key: string]: any;
}

export enum TokenType {
  ERC20,
  ERC721,
  ERC1155
}

export type TokenToWrap = {
  assetContract: string;
  tokenType: TokenType;
  tokenId: bigint;
  totalAmount: bigint;
};

export interface NFTItem {
  contractAddress: string;
  tokenId: bigint;
  name: string;
  imageUrl?: string;
  tokenType: "ERC721" | "ERC1155";
}
