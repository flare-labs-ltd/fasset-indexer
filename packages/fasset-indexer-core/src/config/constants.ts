// chain call config
export const CHAIN_FETCH_RETRY_LIMIT = 20
export const MID_CHAIN_FETCH_SLEEP_MS = 250

// event scrape config
export const LOG_FETCH_SIZE = 30
export const LOG_FETCH_SLEEP_MS = 30 * 1000 // collect logs every 30 seconds
export const BLOCK_HEIGHT_OFFSET = 10
export const MIN_BLOCK_NUMBER = 16146574

// update state config
export const STATE_UPDATE_SLEEP_MS = 60 * 1000 // collect state every one minute

// db settings
export const MAX_DATABASE_ENTRIES_FETCH = 200

// db variable names
export const FIRST_UNHANDLED_EVENT_BLOCK = "firstUnhandledEventBlock"

// event names
// agent
export const AGENT_VAULT_CREATED = "AgentVaultCreated"
export const AGENT_SETTING_CHANGED = "AgentSettingChanged"
export const AVAILABLE_AGENT_EXITED = "AvailableAgentExited"
export const AGENT_ENTERED_AVAILABLE = "AgentAvailable"
export const AGENT_DESTROYED = "AgentDestroyed"
export const SELF_CLOSE = "SelfClose"
// minting
export const COLLATERAL_RESERVED = "CollateralReserved"
export const MINTING_EXECUTED = "MintingExecuted"
export const MINTING_PAYMENT_DEFAULT = "MintingPaymentDefault"
export const COLLATERAL_RESERVATION_DELETED = "CollateralReservationDeleted"
// redemption
export const REDEMPTION_REQUESTED = "RedemptionRequested"
export const REDEMPTION_PERFORMED = "RedemptionPerformed"
export const REDEMPTION_DEFAULT = "RedemptionDefault"
export const REDEMPTION_PAYMENT_BLOCKED = "RedemptionPaymentBlocked"
export const REDEMPTION_PAYMENT_FAILED = "RedemptionPaymentFailed"
export const REDEMPTION_REJECTED = "RedemptionRejected"
export const REDEMPTION_REQUEST_INCOMPLETE = "RedemptionRequestIncomplete"
// liquidation
export const LIQUIDATION_STARTED = "LiquidationStarted"
export const FULL_LIQUIDATION_STARTED = "FullLiquidationStarted"
export const LIQUIDATION_PERFORMED = "LiquidationPerformed"
export const LIQUIDATION_ENDED = "LiquidationEnded"
// collateral types
export const COLLATERAL_TYPE_ADDED = "CollateralTypeAdded"
export const COLLATERAL_TYPE_DEPRECATED = "CollateralTypeDeprecated"
export const AGENT_COLLATERAL_TYPE_CHANGED = "AgentCollateralTypeChanged"
// collateral pool
export const COLLATERAL_POOL_ENTER = "Entered"
export const COLLATERAL_POOL_EXIT = "Exited"
// erc20
export const ERC20_TRANSFER = "Transfer"

// metadata
export const ADDRESS_LENGTH = 42
export const BYTES32_LENGTH = 66