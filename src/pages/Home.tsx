import React, { useRef } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Code2, Wallet, Zap, TrendingUp, Target } from "lucide-react";
import { Button } from "../components/ui/button";
import { PredictionRounds } from "../components/PredictionRounds";
import { useWallet } from "../hooks/useWallet";

const Home: React.FC = () => {
  const { address } = useWallet();
  const predictionSectionRef = useRef<HTMLDivElement>(null);

  const scrollToPredictions = () => {
    predictionSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero Section with Image */}
      <div className="grid md:grid-cols-2 gap-12 items-center py-8">
        <div className="space-y-6">
          <div className="inline-block">
            <span className="px-4 py-2 bg-accent border-2 border-border rounded-base text-sm font-heading font-bold shadow-shadow">
              Decentralized Predictions
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight">
            Predict the Future,
            <span className="block text-main"> Earn Rewards</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-base">
            Join the most exciting prediction market on Stellar blockchain. Place
            bets on real-world events, create your own markets, and win big.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="gap-2"
              onClick={scrollToPredictions}
            >
              <TrendingUp className="w-5 h-5" />
              Start Predicting
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Target className="w-5 h-5" />
              Explore Markets
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <img
            src="/neo 3.png"
            alt="Prediction Market Illustration"
            className="w-full max-w-md h-auto"
          />
        </div>
      </div>

      {/* Prediction Rounds Section - Only show when wallet is connected */}
      {address ? (
        <div className="py-12" ref={predictionSectionRef}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Live Prediction Rounds
            </h2>
            <p className="text-lg text-foreground/70 font-base">
              Place your bets and predict the market movement
            </p>
          </div>
          <PredictionRounds />
        </div>
      ) : (
        <div className="py-12" ref={predictionSectionRef}>
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-main/10 to-accent/10 border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="text-center space-y-6 py-12">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-main border-4 border-border flex items-center justify-center shadow-shadow">
                  <Wallet className="w-10 h-10 text-main-foreground" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Connect Your Wallet
                </h2>
                <p className="text-lg text-foreground/70 font-base max-w-md mx-auto">
                  Connect your Stellar wallet to start predicting market movements and earn rewards
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="gap-2 shadow-shadow"
                  onClick={() => {
                    // Trigger wallet connection - the WalletButton in header will handle this
                    document.querySelector<HTMLButtonElement>('[data-wallet-button]')?.click();
                  }}
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Learn More
                </Button>
              </div>
              <div className="pt-6 border-t-2 border-border mt-8">
                <p className="text-sm text-foreground/60 font-base">
                  Supported wallets: Freighter, Albedo, and more
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-base bg-main border-2 border-border flex items-center justify-center mb-3">
              <Code2 className="w-6 h-6 text-main-foreground" />
            </div>
            <CardTitle>Smart Contracts</CardTitle>
            <CardDescription>
              Built with Soroban smart contracts for secure and transparent
              predictions
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-base bg-secondary border-2 border-border flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 text-secondary-foreground" />
            </div>
            <CardTitle>Wallet Integration</CardTitle>
            <CardDescription>
              Seamlessly connect with Freighter and other Stellar wallets
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-base bg-accent border-2 border-border flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-accent-foreground" />
            </div>
            <CardTitle>Fast & Efficient</CardTitle>
            <CardDescription>
              Lightning-fast transactions on the Stellar network
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Home;
