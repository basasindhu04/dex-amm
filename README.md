# DEX AMM Project

## Overview

This project implements a simplified Decentralized Exchange (DEX) using an Automated Market Maker (AMM) model similar to Uniswap V2. It allows users to add and remove liquidity and swap between two ERC‑20 tokens without centralized intermediaries.

## Features

* Initial and subsequent liquidity provision
* Liquidity removal with proportional share calculation
* Token swaps using constant product formula (x * y = k)
* 0.3% trading fee for liquidity providers
* LP token minting and burning (tracked internally)

## Architecture

The system consists of two main smart contracts:

* **MockERC20.sol** – ERC‑20 compatible mock token used for testing.
* **DEX.sol** – Core AMM logic managing reserves, swaps, liquidity tracking, and LP balances.

All contracts are compiled and tested using Hardhat and executed inside a Docker container for reproducibility.

## Mathematical Implementation

### Constant Product Formula

Swaps maintain the invariant:

x * y = k

Where x and y are reserves of token A and token B respectively.

### Fee Calculation

A 0.3% fee is applied on every trade:

amountInWithFee = amountIn * 997 / 1000

The fee remains in the pool, increasing LP token value.

### LP Token Minting

* First provider: liquidity = sqrt(amountA * amountB)
* Subsequent providers: liquidity = (amountA * totalLiquidity) / reserveA

## Setup Instructions

### Prerequisites

* Docker & Docker Compose
* Git

### Installation

```bash
git clone https://github.com/basasindhu04/dex-amm
cd dex-amm
docker-compose up -d
docker-compose exec app npm run compile
docker-compose exec app npm test
docker-compose exec app npm run coverage
docker-compose down
```

### Run Locally Without Docker

```bash
npm install
npm run compile
npm test
npm run coverage
```

## Contract Addresses

This contract is currently deployed only on the local Hardhat network for testing. No public testnet deployment has been performed.

## Known Limitations

This implementation supports only a single token pair per DEX instance and does not include slippage protection, deadline enforcement, or multiple pool management. Direct token transfers to the contract can affect reserve accuracy. These features are required for a production-grade system.

## Security Considerations

All user inputs are validated to prevent zero-value operations and unauthorized liquidity withdrawals. Solidity 0.8.x built-in overflow checks are used. Internal state is updated before token transfers to avoid reentrancy risks. A full third-party security audit is recommended before mainnet deployment.
