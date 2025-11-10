# FlashBet ⚡🎯

> **The First Prediction Market with Native Flash Loans on Stellar**

FlashBet is a revolutionary decentralized prediction market platform built on Stellar blockchain, combining intuitive price predictions with institutional-grade flash loan technology. Predict XLM price movements, earn rewards, and leverage flash loans for advanced DeFi strategies—all in one seamless platform.

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue)](https://stellar.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Built with Scaffold Stellar](https://img.shields.io/badge/Built%20with-Scaffold%20Stellar-orange)](https://github.com/AhaLabs/scaffold-stellar)

## 🌟 Key Features

### 🎯 Decentralized Prediction Markets
- **Time-Based Rounds**: 5-minute prediction cycles with real-time XLM price feeds
- **Bull & Bear Positions**: Bet on price going UP or DOWN
- **Fair Rewards**: Winners share the pool proportionally to their bets
- **Instant Claims**: Claim your rewards immediately after round ends

### ⚡ Flash Loans (Our Innovation!)
- **First on Stellar**: Native flash loan integration in a prediction market
- **Instant Liquidity**: Borrow any amount without collateral
- **Atomic Transactions**: Borrow and repay in a single transaction
- **Low Fees**: Only 0.5% flash loan fee
- **Capital Efficiency**: Execute arbitrage and advanced strategies

### 🔮 Oracle Integration
- **Reflector Oracle**: Real-time, decentralized XLM price feeds
- **Tamper-Proof**: Secure and reliable price data
- **Sub-Second Updates**: Always accurate market prices

### 🏦 Dual Treasury System
- **Prediction Treasury**: 5% fee from prediction rounds
- **Flash Loan Treasury**: Separate accumulation of flash loan fees
- **Transparent**: All fees tracked on-chain

## 🚀 Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) & [Cargo](https://doc.rust-lang.org/cargo/)
- [Node.js](https://nodejs.org/en/download/package-manager) (v22+)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Scaffold Stellar CLI Plugin](https://github.com/AhaLabs/scaffold-stellar)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/flashbet.git
cd flashbet
```

2. **Install dependencies:**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development:**
```bash
# Start frontend (with contract hot reload)
npm run dev

# Start backend (in another terminal)
npm run start:backend
```

5. **Open your browser:**
```
http://localhost:5173
```

## 🏗️ Project Structure

```
flashbet/
├── contracts/                    # Soroban Smart Contracts
│   ├── prediction-market/       # Main prediction market contract
│   │   ├── src/
│   │   │   ├── contract.rs      # Core contract logic
│   │   │   ├── flash.rs         # Flash loan implementation
│   │   │   └── test/            # Contract tests
│   │   └── Cargo.toml
│   ├── mock-token/              # Token contract for testing
│   └── guess-the-number/        # Example contract
├── packages/                     # Auto-generated TypeScript clients
│   └── prediction-market/       # TypeScript bindings
├── src/                         # React Frontend
│   ├── components/              # UI components
│   │   ├── PredictionRounds.tsx # Main betting interface
│   │   ├── WalletButton.tsx     # Wallet connection
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   │   └── usePredictionMarket.ts # Contract interaction hook
│   ├── pages/                   # Application pages
│   │   ├── Home.tsx             # Landing page
│   │   └── Debugger.tsx         # Contract debugger
│   └── contracts/               # Contract utilities
├── backend/                     # Node.js Backend API
│   └── src/
│       ├── routes/              # API routes
│       ├── services/            # Business logic
│       └── index.ts             # Server entry point
├── target/                      # Compiled WASM contracts
└── environments.toml            # Network configurations
```

## 🎮 How to Use

### For Users

1. **Connect Your Wallet**
   - Click "Connect Wallet" and choose your Stellar wallet (Freighter, Albedo, xBull)
   - Approve the connection

2. **Place a Bet**
   - View the current round with countdown timer
   - Choose your position: 🐂 Bull (UP) or 🐻 Bear (DOWN)
   - Enter your bet amount (minimum 10 XLM)
   - Confirm the transaction

3. **Claim Rewards**
   - Wait for the round to end
   - If you predicted correctly, click "Claim Rewards"
   - Receive your proportional share of the pool

### For Developers (Flash Loans)

Implement the `FlashLoanReceiver` trait in your contract:

```rust
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct MyArbitrageBot;

#[contractimpl]
impl FlashLoanReceiver for MyArbitrageBot {
    fn execute_flash_loan(
        env: Env,
        caller: Address,
        token: Address,
        amount: i128,
        fee_amount: i128
    ) {
        // Your custom logic here
        // 1. Use borrowed funds for arbitrage
        // 2. Make profit
        // 3. Repay loan + fee
        
        // Transfer back amount + fee to caller
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &caller,
            &(amount + fee_amount)
        );
    }
}
```

Call the flash loan:
```typescript
import { Client } from 'prediction-market';

const client = new Client({...});
await client.flash_loan({
  amount: BigInt(1000_0000000), // 1000 XLM
  receiver: 'YOUR_CONTRACT_ADDRESS'
});
```

## 🔧 Smart Contract Deployment

### Deploy to Testnet

```bash
# Build contracts
stellar contract build

# Deploy prediction market
stellar contract deploy \
  --wasm target/wasm32v1-none/release/prediction_market.wasm \
  --source-account YOUR_ACCOUNT \
  --network testnet \
  --alias prediction_market \
  -- \
  --owner $(stellar keys address YOUR_ACCOUNT) \
  --intervals_seconds 300 \
  --buffer_seconds 60 \
  --min_bet_amount 10000000 \
  --token_address TOKEN_ADDRESS \
  --treasury_fee 500 \
  --flash_loan_fee 50 \
  --oracle_address ORACLE_ADDRESS
```

### Generate TypeScript Bindings

```bash
stellar contract bindings typescript \
  --network testnet \
  --contract-id YOUR_CONTRACT_ID \
  --output-dir packages/prediction-market
```

## 🧪 Testing

### Run Contract Tests

```bash
cd contracts/prediction-market
cargo test
```

### Run Frontend Tests

```bash
npm run test
```

### Test Flash Loans

```bash
cd contracts/prediction-market
cargo test test_flash_loan
```

## 📊 Deployed Contracts

### Stellar Testnet

- **Prediction Market**: `CCRURKLYVROZ2OEDZJINGILO55AZBA642FRVCH23PEQGMQKYVBTE7G32`
- **Oracle (Reflector)**: `CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63`
- **Token**: XLM (Native Asset)

### Configuration

- Round Interval: 300 seconds (5 minutes)
- Buffer Time: 60 seconds
- Minimum Bet: 10 XLM
- Treasury Fee: 5% (500 basis points)
- Flash Loan Fee: 0.5% (50 basis points)

## 🛠️ Technology Stack

**Blockchain:**
- Stellar Soroban (Smart Contracts)
- Rust (Contract Language)
- Stellar SDK v14.3.0

**Frontend:**
- React 19 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Neobrutalism Design)
- Stellar Wallets Kit
- TanStack Query

**Backend:**
- Node.js + Express
- TypeScript
- Swagger/OpenAPI
- Cron Jobs for automation

## 🔐 Security

- ✅ Comprehensive unit tests
- ✅ Flash loan reentrancy protection
- ✅ Safe math operations
- ✅ Access control on admin functions
- ✅ Event emission for transparency
- ✅ Oracle price validation

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] Prediction market implementation
- [x] Flash loan integration
- [x] Oracle integration
- [x] Frontend interface
- [x] Backend API

### Phase 2: Enhanced Features (Q2 2025)
- [ ] Multi-asset predictions (BTC, ETH, etc.)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (iOS & Android)
- [ ] Social features (leaderboards)

### Phase 3: DeFi Integration (Q3 2025)
- [ ] Cross-chain flash loans
- [ ] AMM integration
- [ ] Yield farming
- [ ] Liquidity pools

### Phase 4: Governance (Q4 2025)
- [ ] DAO governance token
- [ ] Community proposals
- [ ] Revenue sharing
- [ ] Parameter voting

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Scaffold Stellar](https://github.com/AhaLabs/scaffold-stellar)
- Powered by [Stellar Soroban](https://stellar.org/soroban)
- Oracle by [Reflector](https://reflector.network/)
- Inspired by the DeFi community

## 📞 Contact & Links

- **Website**: [Coming Soon]
- **Documentation**: [Full Docs](det.md)
- **Vision**: [Project Vision](vision.md)
- **Twitter**: [@FlashBet]
- **Discord**: [Join Community]

## 🏆 Hackathon

This project is participating in the **Stellar Hackathon on DoraHacks**. We're bringing institutional-grade DeFi primitives to the Stellar ecosystem through innovative flash loan integration in prediction markets.

---

**FlashBet** - *Where Predictions Meet Innovation* ⚡🎯

Built with ❤️ on Stellar

