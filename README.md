# DEX AMM Project

## Overview

This project implements a simplified Decentralized Exchange (DEX) using an Automated Market Maker (AMM) model inspired by Uniswap V2. It enables permissionless token swaps and decentralized liquidity provision between two ERC‑20 tokens without relying on centralized order books or intermediaries.

The protocol maintains liquidity pools governed by the constant product invariant and distributes trading fees to liquidity providers proportionally to their pool share.

---

## Features

* Initial and subsequent liquidity provisioning
* Liquidity removal with proportional share calculation
* Token swaps using constant product formula *(x · y = k)*
* 0.3% trading fee distributed to liquidity providers
* Internal LP token minting and burning mechanism
* Price quote view functions
* Edge‑case handling for zero values and large swaps
* Fully containerized Docker execution
* 25+ automated unit tests with >96% coverage

---

## Architecture

The system consists of the following components:

| Contract        | Responsibility                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `MockERC20.sol` | ERC‑20 compliant mock token used for testing liquidity and swap mechanics                              |
| `DEX.sol`       | Core AMM logic handling reserves, swaps, liquidity accounting, fee accumulation, and price calculation |

The AMM contract directly maintains token reserves and tracks liquidity balances per provider without external LP token contracts, simplifying the model while preserving economic correctness.

---

## Mathematical Implementation

### Constant Product Formula

All swaps satisfy the invariant:

```
x · y = k
```

Where:

* `x` = reserve of token A
* `y` = reserve of token B
* `k` = constant liquidity product

### Fee Calculation

A 0.3% trading fee is applied on each swap:

```
amountInWithFee = amountIn × 997 / 1000
```

This fee remains in the pool, increasing total reserves and raising LP token value.

### LP Token Minting

* **First provider:**

```
liquidity = sqrt(amountA × amountB)
```

* **Subsequent providers:**

```
liquidity = (amountA × totalLiquidity) / reserveA
```

Liquidity providers receive proportional ownership of the pool.

---

## Setup Instructions

### Prerequisites

* Docker & Docker Compose
* Git

### Installation

```bash
git clone https://github.com/basasindhu04/dex-amm
cd dex-amm
docker compose up -d
docker compose exec app npm run compile
docker compose exec app npm test
docker compose exec app npm run coverage
docker compose down
```

### Run Without Docker

```bash
npm install
npm run compile
npm test
npm run coverage
```

---

## Contract Addresses

This DEX is currently deployed only to a local Hardhat network for development and testing. No public testnet deployment has been performed.

---

## Known Limitations

* Supports only a single token pair per deployment
* No slippage protection or deadline enforcement
* No multiple liquidity pools
* No oracle integration for price feeds
* No flash‑swap functionality

These limitations must be addressed before mainnet deployment.

---

## Security Considerations

* All inputs are validated to prevent zero‑value operations and unauthorized withdrawals
* Solidity 0.8.x overflow protection is relied upon
* Internal state is updated before external calls to prevent reentrancy
* Trading fee logic ensures invariant growth after each swap
* A formal audit using tools like **Slither**, **MythX**, and **Foundry fuzzing** is strongly recommended before production usage
