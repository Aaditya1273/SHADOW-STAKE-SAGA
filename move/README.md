# SomniaVerse OneChain Smart Contracts

## 📦 Contracts

### 1. **Game Contract** (`game.move`)
- Player profiles
- Game sessions
- Achievements
- Leaderboard
- Payment handling

### 2. **DGN Token** (`token.move`)
- ERC20-like fungible token
- Mint/Burn functionality
- Transfer operations

### 3. **NFT Items** (`nft.move`)
- Weapon NFTs
- Armor NFTs
- Relic NFTs
- Boss Trophy NFTs

## 🚀 Deployment

### Prerequisites

1. Install OneChain CLI:
```bash
cargo install --locked --git https://github.com/one-chain-labs/onechain.git one_chain --features tracing
mv ~/.cargo/bin/one_chain ~/.cargo/bin/one
```

2. Initialize OneChain client:
```bash
one client
```

3. Request test OCT:
```bash
one client faucet
```

### Build & Test

```bash
# Build
one move build

# Test
one move test

# Publish
one client publish --gas-budget 100000000
```

### Or use the deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📝 After Deployment

1. Copy the **Package ID** from deployment output
2. Copy the **GameRegistry** object ID
3. Copy the **TreasuryCap** object ID
4. Update `apps/web/src/lib/onechain/client.ts`:
   - `CONTRACTS.GAME_PACKAGE`
   - `CONTRACTS.GAME_REGISTRY`
   - `CONTRACTS.DGN_TREASURY`
5. Update `apps/web/.env`:
   ```
   NEXT_PUBLIC_GAME_PACKAGE=0xYourPackageId
   NEXT_PUBLIC_GAME_REGISTRY=0xYourRegistryId
   NEXT_PUBLIC_DGN_TREASURY=0xYourTreasuryId
   ```

## 🎮 Contract Functions

### Game Contract

- `create_profile()` - Create player profile
- `start_game(registry)` - Start new game session
- `update_session(...)` - Update game progress
- `complete_game(...)` - Finish game and update stats
- `mint_achievement(...)` - Mint achievement NFT

### DGN Token

- `mint(treasury, amount, recipient)` - Mint tokens
- `burn(treasury, coin)` - Burn tokens
- `transfer(coin, recipient)` - Transfer tokens

### NFT Items

- `mint_weapon(...)` - Mint weapon NFT
- `mint_armor(...)` - Mint armor NFT
- `mint_relic(...)` - Mint relic NFT
- `mint_boss_trophy(...)` - Mint boss trophy NFT

## 🔧 Testing

Run tests:
```bash
one move test
```

Test specific module:
```bash
one move test game
one move test token
one move test nft
```

## 📚 Resources

- [OneChain Docs](https://github.com/one-chain-labs/onechain)
- [Move Language](https://move-language.github.io/move/)
- [OneChain RPC](https://rpc-testnet.onelabs.cc:443)
- [OneChain Faucet](https://faucet-testnet.onelabs.cc/v1/gas)
