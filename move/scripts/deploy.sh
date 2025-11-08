#!/bin/bash

# OneChain Deployment Script for Shadow Stake Saga

echo "🚀 Deploying Shadow Stake Saga to OneChain..."

# Check if one CLI is installed
if ! command -v one &> /dev/null
then
    echo "❌ OneChain CLI not found. Installing..."
    cargo install --locked --git https://github.com/one-chain-labs/onechain.git one_chain --features tracing
    mv ~/.cargo/bin/one_chain ~/.cargo/bin/one
fi

# Build the Move package
echo "📦 Building Move package..."
cd "$(dirname "$0")/.."
one move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Test the Move package
echo "🧪 Running tests..."
one move test

if [ $? -ne 0 ]; then
    echo "⚠️  Tests failed, but continuing..."
fi

# Publish to OneChain
echo "📤 Publishing to OneChain Testnet..."
one client publish --gas-budget 100000000

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the Package ID from the output above"
echo "2. Update CONTRACTS.GAME_PACKAGE in apps/web/src/lib/onechain/client.ts"
echo "3. Copy the GameRegistry object ID and update CONTRACTS.GAME_REGISTRY"
echo "4. Copy the TreasuryCap object ID and update CONTRACTS.DGN_TREASURY"
echo "5. Update your .env file with these values"
echo ""
echo "🎮 Your game is now on OneChain!"
