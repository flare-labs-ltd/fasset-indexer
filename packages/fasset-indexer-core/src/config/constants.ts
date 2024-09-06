// chain call config
export const CHAIN_FETCH_RETRY_LIMIT = 20
export const MID_CHAIN_FETCH_SLEEP_MS = 100

// event scrape config
export const MIN_BLOCK_NUMBER = 20234651 // asset manager controller contract deployment block
export const LOG_FETCH_SLEEP_MS = 30 * 1000 // collect logs every 30 seconds
export const BLOCK_HEIGHT_OFFSET = 10 // log collection offset from the current block height
export const LOG_FETCH_SIZE = 30
export const IGNORE_EVENTS = [
    'CurrentUnderlyingBlockUpdated'
]

// update state config
export const STATE_UPDATE_SLEEP_MS = 60 * 1000 // collect state every one minute

// db settings
export const MIN_DATABASE_POOL_CONNECTIONS = 2
export const MAX_DATABASE_POOL_CONNECTIONS = 30
export const MAX_DATABASE_ENTRIES_FETCH = 200

// db variable names
export const FIRST_UNHANDLED_EVENT_BLOCK = "firstUnhandledEventBlock"
export const FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE = "firstUnhandledEventBlockExpandFAssetTransfers"
export const END_EVENT_BLOCK_FOR_CURRENT_UPDATE = "endEventBlockExpandFAssetTransfers"

// event names
// agent
export const EVENTS = {
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
    LIQUIDATION_STARTED: "LiquidationStarted",
    FULL_LIQUIDATION_STARTED: "FullLiquidationStarted",
    LIQUIDATION_PERFORMED: "LiquidationPerformed",
    LIQUIDATION_ENDED: "LiquidationEnded",
    // collateral types
    COLLATERAL_TYPE_ADDED: "CollateralTypeAdded",
    COLLATERAL_TYPE_DEPRECATED: "CollateralTypeDeprecated",
    AGENT_COLLATERAL_TYPE_CHANGED: "AgentCollateralTypeChanged",
    // collateral pool
    COLLATERAL_POOL_ENTER: "Entered",
    COLLATERAL_POOL_EXIT: "Exited",
    // erc20
    ERC20_TRANSFER: "Transfer",
    // pings
    AGENT_PING: "AgentPing",
    AGENT_PING_RESPONSE: "AgentPingResponse"
}

// metadata
export const ADDRESS_LENGTH = 42
export const BYTES32_LENGTH = 66