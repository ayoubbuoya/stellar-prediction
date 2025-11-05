import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Code2, Wallet, Zap, TrendingUp, Target } from "lucide-react";
import { Button } from "../components/ui/button";

const Home: React.FC = () => (
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
          <Button size="lg" className="gap-2">
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

export default Home;
