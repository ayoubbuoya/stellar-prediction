# Stellar Prediction Market Backend

Backend API for the Stellar Prediction Market smart contract, providing endpoints for managing prediction rounds and interacting with the Stellar blockchain.

## Features

- 🚀 RESTful API for prediction market operations
- 📚 Swagger/OpenAPI documentation
- 🔗 Integration with Stellar SDK v14.3.0
- 🎯 Genesis round management
- 📊 Round execution and monitoring
- 💰 Oracle price integration
- ⏰ Automated cron job for periodic round execution

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Stellar account with secret key (owner/admin)
- Deployed prediction market contract

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your settings:
   ```env
   # Stellar Network Configuration
   STELLAR_NETWORK=testnet
   STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

   # Contract Configuration
   PREDICTION_MARKET_CONTRACT_ID=YOUR_CONTRACT_ID

   # Owner/Admin Account
   OWNER_SECRET_KEY=YOUR_SECRET_KEY

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Build:**
   ```bash
   npm run build
   ```

5. **Production:**
   ```bash
   npm start
   ```

## API Documentation

Once the server is running, access the Swagger UI documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Genesis Management

- **POST** `/api/genesis/start` - Start the genesis round
- **POST** `/api/genesis/lock` - Lock the genesis round
- **GET** `/api/genesis/status` - Get genesis status

### Rounds Management

- **POST** `/api/rounds/execute` - Execute a round (lock current, end previous)
- **GET** `/api/rounds/current` - Get current epoch
- **GET** `/api/rounds/:epoch` - Get round information by epoch

### Oracle

- **GET** `/api/oracle/price` - Get current XLM price from oracle

### Cron Job Management

- **POST** `/api/cron/start` - Start automatic round execution (requires genesis started & locked)
- **POST** `/api/cron/pause` - Pause automatic round execution
- **GET** `/api/cron/status` - Get cron job status

### Health Check

- **GET** `/api/health` - Health check endpoint

## Usage Example

### Start Genesis Round

```bash
curl -X POST http://localhost:3000/api/genesis/start
```

Response:
```json
{
  "success": true,
  "message": "Genesis round started successfully",
  "data": {
    "transactionHash": "abc123...",
    "epoch": "1"
  }
}
```

### Get Round Information

```bash
curl http://localhost:3000/api/rounds/1
```

Response:
```json
{
  "success": true,
  "data": {
    "epoch": "1",
    "startTimestamp": "1699999999",
    "lockTimestamp": "1700000099",
    "closeTimestamp": "1700000199",
    "lockPrice": "1000000",
    "closePrice": "1050000",
    "totalAmount": "10000000000",
    "bullAmount": "6000000000",
    "bearAmount": "4000000000"
  }
}
```

### Start Automated Round Execution

```bash
curl -X POST http://localhost:3000/api/cron/start
```

Response:
```json
{
  "success": true,
  "message": "Cron job started successfully. Executing rounds every 300 seconds"
}
```

### Pause Automated Round Execution

```bash
curl -X POST http://localhost:3000/api/cron/pause
```

Response:
```json
{
  "success": true,
  "message": "Cron job paused successfully"
}
```

## Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── stellar.ts       # Stellar network configuration
│   │   └── swagger.ts       # Swagger documentation config
│   ├── controllers/
│   │   ├── genesisController.ts   # Genesis endpoints
│   │   ├── roundsController.ts    # Rounds & oracle endpoints
│   │   └── cronController.ts      # Cron job endpoints
│   ├── routes/
│   │   ├── genesis.ts       # Genesis routes
│   │   ├── rounds.ts        # Rounds routes
│   │   ├── oracle.ts        # Oracle routes
│   │   └── cron.ts          # Cron routes
│   ├── services/
│   │   ├── predictionMarketService.ts  # Contract interaction service
│   │   └── cronService.ts              # Automated round execution service
│   ├── utils.ts             # Utility functions (transaction submission)
│   └── index.ts             # Main application
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Automated Round Execution (Cron Job)

The backend includes an automated cron job service that can periodically execute rounds without manual intervention.

### How It Works

1. **Automatic Interval Detection**: The cron job automatically fetches the `intervalSeconds` from the smart contract
2. **Genesis Validation**: Only starts if genesis is both started AND locked
3. **Periodic Execution**: Executes `execute_round()` on the contract at the specified interval
4. **Error Handling**: Continues running even if individual executions fail (logs errors)
5. **Auto-Pause**: Automatically pauses if genesis state becomes invalid

### Usage Flow

1. Deploy and initialize your contract
2. Start genesis round: `POST /api/genesis/start`
3. Lock genesis round: `POST /api/genesis/lock`
4. Start cron job: `POST /api/cron/start`
5. The system will now automatically execute rounds every `intervalSeconds`

### Control Endpoints

- **Start**: Begins automatic execution (validates genesis state first)
- **Pause**: Stops automatic execution (can be restarted later)
- **Status**: Check if cron is running and the current interval

### Example Workflow

```bash
# 1. Start genesis
curl -X POST http://localhost:3000/api/genesis/start

# 2. Wait for interval, then lock genesis
curl -X POST http://localhost:3000/api/genesis/lock

# 3. Start automated execution
curl -X POST http://localhost:3000/api/cron/start

# 4. Check status
curl http://localhost:3000/api/cron/status

# 5. Pause if needed
curl -X POST http://localhost:3000/api/cron/pause
```

## Integration with Prediction Market Package

This backend uses the `prediction-market` package (generated from your Soroban contract) to interact with the smart contract. Make sure the package is properly installed in your workspace.

## Error Handling

All endpoints return a consistent error format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Notes

- ⚠️ Never commit your `.env` file with real secret keys
- 🔒 Use environment-specific secret keys
- 🛡️ Consider implementing authentication for production
- 🔐 Rate limiting recommended for production deployments

## License

MIT
