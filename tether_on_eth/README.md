# USDT Transfer Service

A REST API service for Ethereum USDT token operations using Express.js and web3.js.

## Features

- Generate new Ethereum addresses
- Check USDT balances
- Send USDT transactions

## Prerequisites

- Docker and Docker Compose
- Infura API key
- Ethereum wallet private key with ETH (for gas) and USDT

## Setup

1. Clone this repository
2. Create a `.env` file from `.env.example`:

security:
we only deploy this localhost, we do not expose it to the public internet.
next we need:
1. whitelist the receiver address

