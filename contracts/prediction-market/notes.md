# Deployment Instructions

```bash
stellar contract deploy \
--wasm target/wasm32v1-none/release/prediction_market.wasm \
--source-account buoya \
--network testnet \
--alias prediction_market \
-- \
--owner $(stellar keys address buoya) \
--intervals_seconds 60 \
--buffer_seconds 6000 \
--min_bet_amount 10000000 \
--token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
--treasury_fee 500 \
--flash_loan_fee 50 \
--oracle_address CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63
```

# Generating TypeScript Bindings

```bash
stellar contract bindings typescript \
  --network testnet \
  --contract-id CCRURKLYVROZ2OEDZJINGILO55AZBA642FRVCH23PEQGMQKYVBTE7G32 \
  --output-dir packages/prediction-market
```
