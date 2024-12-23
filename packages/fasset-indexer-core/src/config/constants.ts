// chain call config
export const CHAIN_FETCH_RETRY_LIMIT = 20
export const MID_CHAIN_FETCH_SLEEP_MS = 100

// evm event scrape config
export const EVM_LOG_FETCH_SLEEP_MS = 30 * 1000 // collect logs every 30 seconds
export const EVM_STATE_UPDATE_SLEEP_MS = 60 * 1000 // collect state every one minute
export const EVM_BLOCK_HEIGHT_OFFSET = 10 // log collection offset from the current block height
export const EVM_LOG_FETCH_SIZE = 30 // number of logs fetched from an evm chain (max is 30)

// db settings
export const MIN_DATABASE_POOL_CONNECTIONS = 2
export const MAX_DATABASE_POOL_CONNECTIONS = 30
export const MAX_DATABASE_ENTRIES_FETCH = 200

// db variable names
export const FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY = "firstUnhandledEventBlock"
export const FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY = "firstUnhandledEventBlockAddCCBs"
export const END_EVENT_BLOCK_FOR_CURRENT_UPDATE_DB_KEY = "endEventBlockAddCCBs"
export const MIN_EVM_BLOCK_NUMBER_DB_KEY = "minEvmBlockNumber"

// event names
// agent
export const EVENTS = {
  ASSET_MANAGER: {
    // agent
    AGENT_VAULT_CREATED: "AgentVaultCreated",
    AGENT_SETTING_CHANGED: "AgentSettingChanged",
    AVAILABLE_AGENT_EXITED: "AvailableAgentExited",
    AGENT_ENTERED_AVAILABLE: "AgentAvailable",
    AGENT_DESTROYED: "AgentDestroyed",
    SELF_CLOSE: "SelfClose",
    // minting
    COLLATERAL_RESERVED: "CollateralReserved",
    MINTING_EXECUTED: "MintingExecuted",
    SELF_MINT: "SelfMint",
    MINTING_PAYMENT_DEFAULT: "MintingPaymentDefault",
    COLLATERAL_RESERVATION_DELETED: "CollateralReservationDeleted",
    // redemption
    REDEMPTION_REQUESTED: "RedemptionRequested",
    REDEMPTION_PERFORMED: "RedemptionPerformed",
    REDEMPTION_DEFAULT: "RedemptionDefault",
    REDEMPTION_PAYMENT_BLOCKED: "RedemptionPaymentBlocked",
    REDEMPTION_PAYMENT_FAILED: "RedemptionPaymentFailed",
    REDEMPTION_REJECTED: "RedemptionRejected",
    REDEMPTION_REQUEST_INCOMPLETE: "RedemptionRequestIncomplete",
    REDEEMED_IN_COLLATERAL: "RedeemedInCollateral",
    // liquidation
    AGENT_IN_CCB: "AgentInCCB",
    LIQUIDATION_STARTED: "LiquidationStarted",
    FULL_LIQUIDATION_STARTED: "FullLiquidationStarted",
    LIQUIDATION_PERFORMED: "LiquidationPerformed",
    LIQUIDATION_ENDED: "LiquidationEnded",
    // challenges
    ILLEGAL_PAYMENT_CONFIRMED: "IllegalPaymentConfirmed",
    DUPLICATE_PAYMENT_CONFIRMED: "DuplicatePaymentConfirmed",
    UNDERLYING_BALANCE_TOO_LOW: "UnderlyingBalanceTooLow",
    // collateral types
    COLLATERAL_TYPE_ADDED: "CollateralTypeAdded",
    COLLATERAL_TYPE_DEPRECATED: "CollateralTypeDeprecated",
    AGENT_COLLATERAL_TYPE_CHANGED: "AgentCollateralTypeChanged",
    // pings
    AGENT_PING: "AgentPing",
    AGENT_PING_RESPONSE: "AgentPingResponse",
    // system
    CURRENT_UNDERLYING_BLOCK_UPDATED: 'CurrentUnderlyingBlockUpdated'
  },
  COLLATERAL_POOL: {
    // collateral pool
    ENTER: "Entered",
    EXIT: "Exited"
  },
  ERC20: {
    // erc20
    TRANSFER: "Transfer",
  }
}

// metadata
export const ADDRESS_LENGTH = 42
export const BYTES32_LENGTH = 66

// analytics
export const PRICE_DECIMALS = 8
export const PRICE_FACTOR = BigInt(10 ** PRICE_DECIMALS)

// block explorers
export const BLOCK_EXPLORERS = {
  coston: 'https://coston-explorer.flare.network',
  songbird: 'https://songbird-explorer.flare.network',
}