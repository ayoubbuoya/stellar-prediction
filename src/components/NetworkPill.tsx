import React from "react";
import { useWallet } from "../hooks/useWallet";
import { stellarNetwork } from "../contracts/util";
import { Badge } from "./ui/badge";
import { Circle } from "lucide-react";

// Format network name with first letter capitalized
const formatNetworkName = (name: string) =>
  // TODO: This is a workaround until @creit-tech/stellar-wallets-kit uses the new name for a local network.
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const appNetwork = formatNetworkName(stellarNetwork);

const NetworkPill: React.FC = () => {
  const { network, address } = useWallet();

  // Check if there's a network mismatch
  const walletNetwork = formatNetworkName(network ?? "");
  const isNetworkMismatch = walletNetwork !== appNetwork;

  let title = "";
  let variant: "default" | "secondary" | "destructive" = "secondary";
  let iconColor = "#2ED06E";

  if (!address) {
    title = "Connect your wallet using this network.";
    iconColor = "#C1C7D0";
    variant = "outline";
  } else if (isNetworkMismatch) {
    title = `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`;
    iconColor = "#FF3B30";
    variant = "destructive";
  }

  return (
    <Badge
      variant={variant}
      className="flex items-center gap-1.5 cursor-help px-3 py-1.5"
      title={title}
    >
      <Circle className="w-2 h-2" fill={iconColor} stroke={iconColor} />
      <span>{appNetwork}</span>
    </Badge>
  );
};

export default NetworkPill;
