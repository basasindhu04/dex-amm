# DEX AMM Project

## Overview
This project implements a simplified Decentralized Exchange (DEX) using an Automated Market Maker (AMM) model similar to Uniswap V2. It allows users to add/remove liquidity and swap between two ERC-20 tokens without centralized intermediaries.

## Features
- Initial and subsequent liquidity provision
- Liquidity removal with proportional share calculation
- Token swaps using constant product formula (x * y = k)
- 0.3% trading fee for liquidity providers
- LP token minting and burning (tracked internally)

## Architecture
The system consists of:
- `MockERC20.sol`: Test ERC-20 token
- `DEX.sol`: Core AMM logic managing reserves, swaps, and LP balances

## Mathematical Implementation

### Constant Product Formula
Swaps follow the invariant:

x * y = k

Where x and y are reserves of token A and B.

### Fee Calculation
0.3% fee is applied using:

amountInWithFee = amountIn * 997 / 1000

This fee remains in the pool, increasing LP value.

### LP Token Minting
- First provider:
  liquidity = sqrt(amountA * amountB)
- Subsequent providers:
  liquidity = (amountA * totalLiquidity) / reserveA

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

```bash
git clone https://github.com/basasindhu04/dex-amm
cd dex-amm
docker-compose up -d
docker-compose exec app npm run compile
docker-compose exec app npm test
docker-compose exec app npm run coverage
docker-compose down
