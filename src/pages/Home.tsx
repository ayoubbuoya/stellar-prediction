import React from "react";
import { GuessTheNumber } from "../components/GuessTheNumber";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Code2, Wallet, Zap } from "lucide-react";

const Home: React.FC = () => (
  <div className="container mx-auto px-4 py-12 space-y-12">
    {/* Hero Section */}
    <div className="text-center space-y-4 py-8">
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
        Welcome to Stellar Prediction Market! 🚀
      </h1>
      <p className="text-lg md:text-xl text-foreground/80 font-base max-w-2xl mx-auto">
        A decentralized prediction market built on Stellar blockchain with smart
        contracts. Place bets, create markets, and earn rewards!
      </p>
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

    {/* Development Guide */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">🛠️ Development Guide</CardTitle>
        <CardDescription>Get started with building on Stellar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-heading font-semibold text-lg mb-2">
            Develop your contracts
          </h3>
          <p className="text-sm text-foreground/80 font-base">
            Take a look in the{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              contracts/
            </code>{" "}
            directory. Compare that to what you see in the{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              npm run dev
            </code>{" "}
            output (which itself is running{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              stellar scaffold watch
            </code>
            ).
          </p>
        </div>

        <div>
          <h3 className="font-heading font-semibold text-lg mb-2">
            Interact with contracts
          </h3>
          <p className="text-sm text-foreground/80 font-base mb-2">
            Scaffold stellar automatically builds, deploys, and generates
            frontend packages for each contract:
          </p>
          <pre className="bg-muted p-3 rounded-base border-2 border-border text-xs overflow-x-auto">
            <code>import game from "./contracts/guess_the_number";</code>
          </pre>
        </div>

        <div>
          <h3 className="font-heading font-semibold text-lg mb-2">
            Deploy your app
          </h3>
          <p className="text-sm text-foreground/80 font-base">
            Use{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              stellar registry publish
            </code>{" "}
            and{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              stellar registry deploy
            </code>{" "}
            commands to deploy to the Stellar network. Build with{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs">
              npm run build
            </code>
            .
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Demo Component */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">🎮 Try the Demo</CardTitle>
        <CardDescription>
          Test the GuessTheNumber contract interaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GuessTheNumber />
      </CardContent>
    </Card>
  </div>
);

export default Home;
