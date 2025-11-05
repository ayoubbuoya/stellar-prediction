import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { TrendingUp, TrendingDown, Clock, Lock, Circle } from "lucide-react";
import type { Round } from "prediction-market";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { RoundStatus } from "../types/round";

interface RoundCardProps {
  round: Round;
  status: RoundStatus;
  currentPrice?: string;
  onBetUp?: () => void;
  onBetDown?: () => void;
}

const RoundCard: React.FC<RoundCardProps> = ({
  round,
  status,
  onBetUp,
  onBetDown,
}) => {
  const [betAmount, setBetAmount] = useState("");
  const [showBetModal, setShowBetModal] = useState(false);
  const [betDirection, setBetDirection] = useState<"up" | "down">("up");
  const [timeRemaining, setTimeRemaining] = useState("");

  const formatAmount = (amount: bigint | number) => {
    return (Number(amount) / 10000000).toFixed(2);
  };

  const formatPrice = (price: bigint | number, decimals = 4) => {
    return `$${(Number(price) / 10000000).toFixed(decimals)}`;
  };

  const getTimeRemaining = (timestamp: bigint | number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(timestamp) - now;
    if (diff <= 0) return "00:00";
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    const updateTime = () => {
      if (status === RoundStatus.LIVE) {
        setTimeRemaining(getTimeRemaining(BigInt(round.lock_timestamp)));
      } else if (status === RoundStatus.NEXT) {
        setTimeRemaining(getTimeRemaining(BigInt(round.start_timestamp)));
      } else if (status === RoundStatus.LATER) {
        setTimeRemaining(getTimeRemaining(BigInt(round.start_timestamp)));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [round, status]);

  const totalPayout = Number(round.bull_amount) + Number(round.bear_amount);
  const bullPercentage = totalPayout > 0
    ? (Number(round.bull_amount) / totalPayout) * 100
    : 50;
  const bearPercentage = 100 - bullPercentage;

  const bullPayout = totalPayout > 0 && Number(round.bull_amount) > 0
    ? (totalPayout / Number(round.bull_amount)).toFixed(2)
    : "0.00";
  const bearPayout = totalPayout > 0 && Number(round.bear_amount) > 0
    ? (totalPayout / Number(round.bear_amount)).toFixed(2)
    : "0.00";

  const isLive = status === RoundStatus.LIVE;
  const isCalculating = status === RoundStatus.CALCULATING;
  const isExpired = status === RoundStatus.EXPIRED;
  const hasResult = Number(round.close_price) > 0;

  const winner =
    hasResult && Number(round.close_price) > Number(round.lock_price)
      ? "BULL"
      : hasResult && Number(round.close_price) < Number(round.lock_price)
      ? "BEAR"
      : "DRAW";

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center gap-1.5 rounded-base px-3 py-1.5 text-xs font-heading font-bold border-2 shadow-shadow";
    switch (status) {
      case RoundStatus.LIVE:
        return (
          <div className={`${baseClasses} bg-[#31D0AA] border-border text-white`}>
            <Circle className={`h-2 w-2 fill-current animate-pulse`} />
            <span>LIVE</span>
          </div>
        );
      case RoundStatus.NEXT:
        return (
          <div className={`${baseClasses} bg-main border-border text-white`}>
            <Circle className="h-2 w-2 fill-current" />
            <span>NEXT</span>
          </div>
        );
      case RoundStatus.CALCULATING:
        return (
          <div className={`${baseClasses} bg-yellow-500 border-border text-white`}>
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            <span>CALCULATING</span>
          </div>
        );
      case RoundStatus.EXPIRED:
        return (
          <div className={`${baseClasses} bg-foreground/20 border-border`}>
            <Circle className="h-2 w-2 fill-current" />
            <span>EXPIRED</span>
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-secondary border-border`}>
            <Circle className="h-2 w-2 fill-current" />
            <span>LATER</span>
          </div>
        );
    }
  };

  const handleOpenBetModal = (direction: "up" | "down") => {
    setBetDirection(direction);
    setShowBetModal(true);
  };

  const handleConfirmBet = () => {
    if (betDirection === "up") {
      onBetUp?.();
    } else {
      onBetDown?.();
    }
    setShowBetModal(false);
    setBetAmount("");
  };

  return (
    <>
      <Card className="w-full max-w-sm bg-secondary-background h-full flex flex-col">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            <div className="text-right">
              <div className="text-xs text-foreground/60 font-base">
                #{round.epoch.toString()}
              </div>
              {(isLive || status === RoundStatus.NEXT || status === RoundStatus.LATER) && (
                <div className="font-mono text-sm font-bold text-main mt-0.5">
                  {timeRemaining}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Market Pair */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-2">XLM/USD</h3>
            <div className="font-mono text-2xl font-bold">
              {Number(round.lock_price) > 0 ? formatPrice(BigInt(round.lock_price), 5) : "$0.0000"}
            </div>
          </div>

          {/* Prize Pool */}
          <div className="flex justify-between text-xs text-foreground/60">
            <span>Prize Pool:</span>
            <span className="font-mono font-semibold text-foreground">
              {formatAmount(BigInt(round.total_amount))} XLM
            </span>
          </div>

          {/* Bull/Bear Distribution - Only show if there are bets */}
          {Number(round.total_amount) > 0 && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-heading font-bold text-[#31D0AA] flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    UP
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {bullPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-base overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-[#31D0AA] transition-all duration-300"
                    style={{ width: `${bullPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-heading font-bold text-destructive flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    DOWN
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {bearPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-base overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-destructive transition-all duration-300"
                    style={{ width: `${bearPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-grow min-h-[20px]"></div>

          {/* Locked Price - Only show for LIVE rounds */}
          {isLive && Number(round.lock_price) > 0 && (
            <div className="flex justify-between text-xs text-foreground/60">
              <span>Locked:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatPrice(BigInt(round.lock_price), 5)}
              </span>
            </div>
          )}

          {/* Result Display for Calculating/Expired Rounds */}
          {(isCalculating || isExpired) && hasResult && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-foreground/60">
                <span>Locked:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatPrice(BigInt(round.lock_price), 5)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-foreground/60">
                <span>Closed:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatPrice(BigInt(round.close_price), 5)}
                </span>
              </div>
              <div className="text-center p-4 bg-secondary border-2 border-border rounded-base">
                <div className="text-xs text-foreground/60 mb-2">
                  {isCalculating ? "Detected Winner" : "Winner"}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {winner === "BULL" ? (
                    <TrendingUp className="h-5 w-5 text-[#31D0AA]" />
                  ) : winner === "BEAR" ? (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  ) : (
                    <Circle className="h-5 w-5 text-foreground/40" />
                  )}
                  <div
                    className={`text-xl font-heading font-bold ${
                      winner === "BULL"
                        ? "text-[#31D0AA]"
                        : winner === "BEAR"
                        ? "text-destructive"
                        : "text-foreground/40"
                    }`}
                  >
                    {winner}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bet Buttons for LIVE rounds */}
          {isLive && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-heading font-bold text-foreground/60">
                    UP
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {bullPayout}x Payout
                  </span>
                </div>
                <Button
                  onClick={() => handleOpenBetModal("up")}
                  className="w-full bg-[#1A7A5E] hover:bg-[#31D0AA] text-white font-heading font-bold border-2 border-border shadow-shadow rounded-base h-9 text-xs"
                >
                  Enter UP
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-heading font-bold text-foreground/60">
                    DOWN
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {bearPayout}x Payout
                  </span>
                </div>
                <Button
                  onClick={() => handleOpenBetModal("down")}
                  className="w-full bg-destructive hover:bg-destructive/90 text-white font-heading font-bold border-2 border-border shadow-shadow rounded-base h-9 text-xs"
                >
                  Enter DOWN
                </Button>
              </div>
            </div>
          )}

          {/* Next State */}
          {status === RoundStatus.NEXT && (
            <div className="text-center py-3 bg-main/20 rounded-base border-2 border-border mt-auto">
              <span className="text-sm font-heading font-bold text-main flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Waiting to start...</span>
              </span>
            </div>
          )}

          {/* Later State */}
          {status === RoundStatus.LATER && (
            <div className="text-center py-6 bg-secondary rounded-base border-2 border-border mt-auto">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-secondary-background border-2 border-border flex items-center justify-center">
                  <Lock className="h-6 w-6 text-foreground/60" />
                </div>
              </div>
              <div className="text-sm font-heading font-bold mb-2">
                Round Locked
              </div>
              <div className="text-xs text-foreground/60 mb-1">
                Entry starts in:
              </div>
              <div className="font-mono text-sm font-bold text-main">
                {timeRemaining}
              </div>
            </div>
          )}

          {/* Calculating State */}
          {isCalculating && (
            <div className="text-center py-3 bg-yellow-500/20 rounded-base border-2 border-border mt-auto">
              <span className="text-sm font-heading font-bold text-yellow-600 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Calculating results...</span>
              </span>
            </div>
          )}

          {/* Expired State */}
          {isExpired && !hasResult && (
            <div className="text-center py-3 bg-foreground/10 rounded-base border-2 border-border mt-auto">
              <span className="text-sm font-heading font-bold text-foreground/60 flex items-center justify-center gap-2">
                <Circle className="h-4 w-4 fill-current" />
                <span>Round Ended</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bet Modal */}
      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {betDirection === "up" ? "Enter UP" : "Enter DOWN"}
            </DialogTitle>
            <DialogDescription>
              Place your bet on {betDirection === "up" ? "UP" : "DOWN"} for round #{round.epoch.toString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (XLM)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="p-4 bg-secondary-background border-2 border-border rounded-base">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground/60">Payout:</span>
                <span className="font-heading font-bold">
                  {betDirection === "up" ? bullPayout : bearPayout}x
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">Potential Win:</span>
                <span className="font-heading font-bold text-main">
                  {betAmount
                    ? (
                        parseFloat(betAmount) *
                        parseFloat(betDirection === "up" ? bullPayout : bearPayout)
                      ).toFixed(2)
                    : "0.00"}{" "}
                  XLM
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBetModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBet}
              disabled={!betAmount || parseFloat(betAmount) <= 0}
              className={
                betDirection === "up"
                  ? "bg-[#31D0AA] hover:bg-[#2AB896]"
                  : ""
              }
            >
              Confirm Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const PredictionRounds: React.FC = () => {
  const handleBetUp = () => {
    console.log("Bet UP");
  };

  const handleBetDown = () => {
    console.log("Bet DOWN");
  };

  // Mock data for demonstration
  const mockRounds: Round[] = [
    {
      epoch: BigInt(1),
      start_timestamp: BigInt(Math.floor(Date.now() / 1000) - 300),
      lock_timestamp: BigInt(Math.floor(Date.now() / 1000) - 60),
      close_timestamp: BigInt(Math.floor(Date.now() / 1000)),
      lock_price: BigInt(10987675),
      close_price: BigInt(10987675),
      total_amount: BigInt(10985524),
      bull_amount: BigInt(5492762),
      bear_amount: BigInt(5492762),
      reward_base_cal_amount: BigInt(0),
      reward_amount: BigInt(0),
    },
    {
      epoch: BigInt(2),
      start_timestamp: BigInt(Math.floor(Date.now() / 1000)),
      lock_timestamp: BigInt(Math.floor(Date.now() / 1000) + 240),
      close_timestamp: BigInt(Math.floor(Date.now() / 1000) + 300),
      lock_price: BigInt(0),
      close_price: BigInt(0),
      total_amount: BigInt(29825524),
      bull_amount: BigInt(14912762),
      bear_amount: BigInt(14912762),
      reward_base_cal_amount: BigInt(0),
      reward_amount: BigInt(0),
    },
    {
      epoch: BigInt(3),
      start_timestamp: BigInt(Math.floor(Date.now() / 1000) + 300),
      lock_timestamp: BigInt(Math.floor(Date.now() / 1000) + 540),
      close_timestamp: BigInt(Math.floor(Date.now() / 1000) + 600),
      lock_price: BigInt(0),
      close_price: BigInt(0),
      total_amount: BigInt(0),
      bull_amount: BigInt(0),
      bear_amount: BigInt(0),
      reward_base_cal_amount: BigInt(0),
      reward_amount: BigInt(0),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4 justify-center px-4">
        <RoundCard
          round={mockRounds[0]}
          status={RoundStatus.EXPIRED}
        />
        <RoundCard
          round={mockRounds[1]}
          status={RoundStatus.LIVE}
          currentPrice="$0.1256"
          onBetUp={handleBetUp}
          onBetDown={handleBetDown}
        />
        <RoundCard
          round={mockRounds[2]}
          status={RoundStatus.NEXT}
        />
        <RoundCard
          round={mockRounds[2]}
          status={RoundStatus.LATER}
        />
      </div>
    </div>
  );
};

