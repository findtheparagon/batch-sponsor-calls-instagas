"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { CallStatus } from "@/types";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useChainId, useChains } from "wagmi";
import { Button } from "./ui/button";

interface OperationStatusDialogProps {
  status: CallStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: Error | null;
  transactionHash: `0x${string}` | undefined;
}

export function OperationStatusDialog({
  status,
  open,
  onOpenChange,
  error,
  transactionHash
}: OperationStatusDialogProps) {
  const canClose = status === "success" || status === "failure";

  const chainId = useChainId();

  const chains = useChains();
  const currentChain = chains.find(chain => chain.id == chainId)!;
  const url = `${currentChain.blockExplorers?.default.url}/tx/${transactionHash}`;

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="animate-spin text-blue-500" size={32} />;
      case "success":
        return <CheckCircle className="text-green-500" size={32} />;
      case "failure":
        return <XCircle className="text-red-500" size={32} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Processing the operation...";
      case "success":
        return "¡Success!";
      case "failure":
        return "The operation has failed";
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => canClose && onOpenChange(isOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div>
          {getStatusIcon()}
          <p className="mt-4 text-sm">{getStatusText()}</p>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error.message}</p>
          )}
        </div>
        <DialogFooter>
          {status === "success" && transactionHash && (
            <div>
              <Button asChild>
                <a href={url} target="_blank">
                  View in explorer
                </a>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
