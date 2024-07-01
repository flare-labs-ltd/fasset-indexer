import { defineConfig } from "@mikro-orm/core"
import { SqliteDriver } from "@mikro-orm/sqlite"
import { UntrackedAgentVault, Var } from "./entities/state/var"
import { EvmLog } from "./entities/logs"
import { AgentManager, AgentOwner, AgentVault } from "./entities/agent"
import {
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault, CollateralReservationDeleted
} from "./entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected
} from "./entities/events/redemption"
import {
  FullLiquidationStarted, LiquidationEnded,
  LiquidationPerformed, LiquidationStarted
} from "./entities/events/liquidation"
import { RedemptionRequestIncomplete, AgentSettingChanged } from "./entities/events/tracking"
import { AgentVaultInfo, AgentVaultSettings } from "./entities/state/agent"
import type { Options } from "@mikro-orm/core"
import type { AbstractSqlDriver } from "@mikro-orm/knex"


export const ORM_OPTIONS: Options<AbstractSqlDriver> = defineConfig({
  entities: [
    Var, EvmLog,
    AgentManager, AgentOwner, AgentVault, AgentVaultSettings, AgentVaultInfo,
    CollateralReserved, MintingExecuted, MintingPaymentDefault, CollateralReservationDeleted,
    RedemptionRequested, RedemptionPerformed, RedemptionDefault,
    RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
    LiquidationStarted, FullLiquidationStarted, LiquidationPerformed, LiquidationEnded,
    RedemptionRequestIncomplete, AgentSettingChanged,
    UntrackedAgentVault
  ],
  driver: SqliteDriver,
  debug: false
})

export default ORM_OPTIONS