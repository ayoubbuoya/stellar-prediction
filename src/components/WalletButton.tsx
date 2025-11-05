import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { connectWallet, disconnectWallet } from "../util/wallet";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const WalletButton = () => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { address, isPending } = useWallet();
  const { xlm, ...balance } = useWalletBalance();
  const buttonLabel = isPending ? "Loading..." : "Connect Wallet";

  if (!address) {
    return (
      <Button
        variant="default"
        size="default"
        onClick={() => void connectWallet()}
        className="font-heading"
        data-wallet-button
      >
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-row items-center gap-3">
      <div
        className="px-4 py-2 rounded-base border-2 border-border bg-secondary text-foreground font-base text-sm"
        style={{ opacity: balance.isLoading ? 0.6 : 1 }}
      >
        Balance: {xlm} XLM
      </div>

      <Dialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Disconnect Wallet</DialogTitle>
            <DialogDescription className="break-all">
              Connected as{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {address}
              </code>
              . Do you want to disconnect?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void disconnectWallet().then(() =>
                  setShowDisconnectModal(false),
                );
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="secondary"
        size="default"
        onClick={() => setShowDisconnectModal(true)}
        className="font-mono text-xs"
      >
        {address.slice(0, 4)}...{address.slice(-4)}
      </Button>
    </div>
  );
};
