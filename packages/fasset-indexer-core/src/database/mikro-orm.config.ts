import { defineConfig } from "@mikro-orm/core"
import { UntrackedAgentVault, Var } from "./entities/state/var"
import { EvmAddress, UnderlyingAddress } from "./entities/address"
import { EvmBlock } from "./entities/evm/block"
import { EvmTransaction } from "./entities/evm/transaction"
import { EvmLog } from "./entities/evm/log"
import { AgentVaultCreated, AgentSettingChanged, SelfClose } from "./entities/events/agent"
import {
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault, CollateralReservationDeleted,
  SelfMint
} from "./entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
  RedemptionRequestIncomplete,
  RedeemedInCollateral
} from "./entities/events/redemption"
import {
  AgentInCCB,
  FullLiquidationStarted, LiquidationEnded,
  LiquidationPerformed, LiquidationStarted
} from "./entities/events/liquidation"
import {
  DuplicatePaymentConfirmed, IllegalPaymentConfirmed,
  UnderlyingBalanceTooLow
} from "./entities/events/challenge"
import { CollateralTypeAdded, ERC20Transfer } from "./entities/events/token"
import { CollateralPoolEntered, CollateralPoolExited } from "./entities/events/collateral-pool"
import { AgentPing, AgentPingResponse } from "./entities/events/ping"
import { CurrentUnderlyingBlockUpdated } from "./entities/events/system"
import { AgentVaultInfo, AgentVaultSettings } from "./entities/state/agent"
import { AgentManager, AgentOwner, AgentVault } from "./entities/agent"
import { FtsoPrice } from "./entities/state/price"
import { TokenBalance } from "./entities/state/balance"
import { MIN_DATABASE_POOL_CONNECTIONS, MAX_DATABASE_POOL_CONNECTIONS } from "../config/constants"
import type { Options } from "@mikro-orm/core"
import type { AbstractSqlDriver } from "@mikro-orm/knex"


export const ORM_OPTIONS: Options<AbstractSqlDriver> = defineConfig({
  entities: [
    Var, EvmBlock, EvmTransaction, EvmLog, EvmAddress, UnderlyingAddress,
    AgentManager, AgentOwner, AgentVault, AgentVaultSettings, AgentVaultInfo,
    AgentVaultCreated, AgentSettingChanged, SelfClose, SelfMint,
    CollateralReserved, MintingExecuted, MintingPaymentDefault, CollateralReservationDeleted,
    RedemptionRequested, RedemptionPerformed, RedemptionDefault,
    RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
    RedeemedInCollateral, RedemptionRequestIncomplete,
    AgentInCCB, LiquidationStarted, FullLiquidationStarted, LiquidationPerformed, LiquidationEnded,
    IllegalPaymentConfirmed, DuplicatePaymentConfirmed, UnderlyingBalanceTooLow,
    CollateralPoolEntered, CollateralPoolExited, ERC20Transfer, CollateralTypeAdded,
    AgentPing, AgentPingResponse, CurrentUnderlyingBlockUpdated,
    FtsoPrice, UntrackedAgentVault, TokenBalance,
  ],
  pool: {
    min: MIN_DATABASE_POOL_CONNECTIONS,
    max: MAX_DATABASE_POOL_CONNECTIONS
  },
  migrations: { disableForeignKeys: false },
  debug: false
})

export default ORM_OPTIONS