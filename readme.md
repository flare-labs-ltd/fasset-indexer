# FAsset Indexer

## Repository Transferred

The development of FAsset protocol was commissioned for and on behalf of the Flare Foundation, accordingly all completed repos for the protocol have been moved to [Flare Foundation Github](https://github.com/flare-foundation), the protocol's ultimate owner.
[New repository](https://github.com/flare-foundation/fasset-indexer)

## Indexer

This is an implementation for indexing the FAsset protocol smart contract operations. The FAsset smart contracts operate in a way that most of the state can be collected from emmited events. This repo consists of two workspaces:

1. FAsset Indexer Core: scrapes the chain (currently Coston) for events and stores them in a database, optimized for FAsset analytics.
1. FAsset Indexer Api: nestjs based API to query the indexed data.

Initialize the project by running `yarn install`.

## FAsset Indexer Core

Needs the following environment variables:

```
#chain
CHAIN=coston|songbird
RPC_URL=
# not required
RPC_API_KEY=
ADDRESSES_JSON=
MIN_BLOCK_NUMBER=

# database
DB_TYPE=sqlite|postgres
DB_NAME=
# non-sqlite database
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
```

Note that the `MIN_BLOCK_NUMBER` should match the block number of deployed asset manager contract, specified inside `ADDRESSES_JSON` file (or the default configuration `fasset-indexer/packages/fasset-indexer-core/chain/coston.json`).

To run the indexer, run `yarn run-indexer`.

Note that the repo also features a watchdog, which keeps track of prices and registered agent's info on chain. To run the watchdog, run `yarn run-watchdog`.

## FAsset Indexer Api

Needs the environment variables to establish database connection and API configuration:

```
# database
DB_TYPE=sqlite|postgres
DB_NAME=
# non-sqlite database
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=

# api
API_ROOT_PATH=
API_PORT=

# chain
ADDRESSES_JSON=
```

To run the API, run `yarn run-api`.