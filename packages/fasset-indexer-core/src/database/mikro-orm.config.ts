import { defineConfig } from "@mikro-orm/core"
import { UntrackedAgentVault, Var } from "./entities/state/var"
import { EvmAddress, UnderlyingAddress } from "./entities/address"
import { EvmLog } from "./entities/logs"
import { AgentVaultCreated, AgentSettingChanged, SelfClose } from "./entities/events/agent"
import {
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault, CollateralReservationDeleted
} from "./entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
  RedemptionRequestIncomplete
} from "./entities/events/redemption"
import {
  FullLiquidationStarted, LiquidationEnded,
  LiquidationPerformed, LiquidationStarted
} from "./entities/events/liquidation"
import { CollateralPoolEntered, CollateralPoolExited } from "./entities/events/collateralPool"
import { ERC20Transfer } from "./entities/events/fasset"
import { AgentVaultInfo, AgentVaultSettings } from "./entities/state/agent"
import { AgentManager, AgentOwner, AgentVault } from "./entities/agent"
import type { Options } from "@mikro-orm/core"
import type { AbstractSqlDriver } from "@mikro-orm/knex"


export const ORM_OPTIONS: Options<AbstractSqlDriver> = defineConfig({
  entities: [
    Var, EvmLog, EvmAddress, UnderlyingAddress,
    AgentManager, AgentOwner, AgentVault, AgentVaultSettings, AgentVaultInfo,
    AgentVaultCreated, AgentSettingChanged, SelfClose,
    CollateralReserved, MintingExecuted, MintingPaymentDefault, CollateralReservationDeleted,
    RedemptionRequested, RedemptionPerformed, RedemptionDefault,
    RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected, RedemptionRequestIncomplete,
    LiquidationStarted, FullLiquidationStarted, LiquidationPerformed, LiquidationEnded,
    CollateralPoolEntered, CollateralPoolExited, ERC20Transfer,
    UntrackedAgentVault
  ],
  debug: false
})

export default ORM_OPTIONS