("use client");

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alchemy } from "alchemy-sdk";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";

type EnrichedToken = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  formattedBalance: string;
  logo: string | null;
};

type Props = {
  alchemy: Alchemy;
  address: string;
  excludedAddresses?: string[];
  onAdd: (token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    amount: string;
    logo: string | null;
    rawAmount: bigint;
  }) => void;
  onClick: () => void;
};

const AddERC20TokenDialog = ({
  alchemy,
  address,
  excludedAddresses = [],
  onAdd,
  onClick
}: Props) => {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<EnrichedToken[] | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (open && tokens === null) {
      alchemy.core.getTokenBalances(address).then(async res => {
        const filtered = res.tokenBalances.filter(
          t =>
            t.tokenBalance !==
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        const enriched: EnrichedToken[] = await Promise.all(
          filtered.map(async t => {
            const meta = await alchemy.core.getTokenMetadata(t.contractAddress);
            const decimals = meta.decimals || 18;
            const raw = BigInt(t.tokenBalance || "0");
            const formatted = Number(raw) / 10 ** decimals;

            return {
              address: t.contractAddress,
              name: meta.name || "Unknown",
              symbol: meta.symbol || "",
              decimals,
              formattedBalance: formatted.toFixed(4),
              logo: meta.logo
            };
          })
        );

        setTokens(enriched);
      });
    }
  }, [open, tokens, address]);

  const selected = tokens?.find(t => t.address === selectedToken);

  const handleAdd = () => {
    if (selected && amount && parseFloat(amount) > 0) {
      onAdd({
        address: selected.address,
        symbol: selected.symbol,
        name: selected.name,
        decimals: selected.decimals,
        amount,
        rawAmount: parseUnits(amount, selected.decimals),
        logo: selected.logo
      });
      setOpen(false);
      setAmount("");
      setSelectedToken(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={onClick}>
          <Plus />
          Add ERC20 Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Add ERC20 Token</DialogTitle>
          <DialogDescription>
            Select a token and enter an amount. Click add when you're done.
          </DialogDescription>
        </DialogHeader>
        {tokens === null ? (
          <p>Loading tokens...</p>
        ) : (
          <>
            <Select onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a token" />
              </SelectTrigger>
              <SelectContent>
                {tokens
                  .filter(t => !excludedAddresses.includes(t.address))
                  .map(token => (
                    <SelectItem key={token.address} value={token.address}>
                      {token.logo}
                      {token.symbol} ({token.formattedBalance})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selected && (
              <>
                <p className="text-sm text-muted-foreground">
                  {selected.name} - Balance: {selected.formattedBalance} -
                  Decimals: {selected.decimals}
                </p>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </>
            )}
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!selected || !amount}>
                Add
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddERC20TokenDialog;
