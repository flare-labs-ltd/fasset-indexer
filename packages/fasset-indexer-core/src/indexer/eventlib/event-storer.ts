import { isUntrackedAgentVault } from "../shared"
import { EvmLog } from "../../database/entities/logs"
import { CollateralType } from "../../database/entities/token"
import { AddressType, EvmAddress, UnderlyingAddress } from "../../database/entities/address"
import { AgentOwner, AgentVault } from "../../database/entities/agent"
import { AgentVaultCreated } from "../../database/entities/events/agent"
import { AgentVaultInfo, AgentVaultSettings } from "../../database/entities/state/agent"
import {
  CollateralReservationDeleted,
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault
} from "../../database/entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected
} from "../../database/entities/events/redemption"
import {
  FullLiquidationStarted, LiquidationEnded, LiquidationPerformed, LiquidationStarted
} from "../../database/entities/events/liquidation"
import { AgentSettingChanged, RedemptionRequestIncomplete } from "../../database/entities/events/tracking"
import {
  AGENT_VAULT_CREATED, AGENT_SETTING_CHANGED,
  COLLATERAL_RESERVED, MINTING_EXECUTED, MINTING_PAYMENT_DEFAULT, COLLATERAL_RESERVATION_DELETED,
  REDEMPTION_REQUESTED, REDEMPTION_PERFORMED, REDEMPTION_DEFAULT, REDEMPTION_PAYMENT_BLOCKED,
  REDEMPTION_PAYMENT_FAILED, REDEMPTION_REJECTED, REDEMPTION_REQUEST_INCOMPLETE,
  LIQUIDATION_STARTED, LIQUIDATION_PERFORMED, LIQUIDATION_ENDED, FULL_LIQUIDATION_STARTED,
  AGENT_ENTERED_AVAILABLE, AVAILABLE_AGENT_EXITED, AGENT_DESTROYED,
  COLLATERAL_TYPE_ADDED
} from '../../config/constants'
import type { EntityManager } from "@mikro-orm/knex"
import type { FullLog } from "./event-scraper"
import type {
  AgentAvailableEvent, AgentDestroyedEvent, AgentSettingChangeAnnouncedEvent,
  AgentVaultCreatedEvent, AvailableAgentExitAnnouncedEvent,
  CollateralReservationDeletedEvent, CollateralReservedEvent, CollateralTypeAddedEvent,
  MintingExecutedEvent, MintingPaymentDefaultEvent,
  RedemptionDefaultEvent, RedemptionPaymentBlockedEvent, RedemptionPaymentFailedEvent, RedemptionPerformedEvent,
  RedemptionRejectedEvent, RedemptionRequestIncompleteEvent, RedemptionRequestedEvent,
  FullLiquidationStartedEvent, LiquidationEndedEvent, LiquidationPerformedEvent, LiquidationStartedEvent
} from "../../../chain/typechain/AMEvents"


export abstract class EventStorer {

  async logExists(em: EntityManager, log: FullLog): Promise<boolean> {
    const { blockNumber, transactionIndex, logIndex } = log
    const evmLog = await em.findOne(EvmLog, { blockNumber, transactionIndex, logIndex })
    return evmLog !== null
  }

  async processLog(em: EntityManager, log: FullLog): Promise<void> {
    if (!await this.logExists(em, log)) {
      const evmLog = await this.createLogEntity(em, log)
      await this.processEvent(em, log, evmLog)
    }
  }

  async processEvent(em: EntityManager, log: FullLog, evmLog: EvmLog): Promise<void> {
    switch (log.name) {
      case COLLATERAL_TYPE_ADDED: {
        await this.onCollateralTypeAdded(em, evmLog, log.args as CollateralTypeAddedEvent.OutputTuple)
        break
      } case AGENT_VAULT_CREATED: {
        await this.onAgentVaultCreated(em, evmLog, log.args as AgentVaultCreatedEvent.OutputTuple)
        break
      } case AGENT_SETTING_CHANGED: {
        await this.onAgentSettingChanged(em, evmLog, log.args as AgentSettingChangeAnnouncedEvent.OutputTuple)
        break
      } case COLLATERAL_RESERVED: {
        await this.onCollateralReserved(em, evmLog, log.args as CollateralReservedEvent.OutputTuple)
        break
      } case AGENT_DESTROYED: {
        await this.onAgentDestroyed(em, log.args as AgentDestroyedEvent.OutputTuple)
        break
      } case MINTING_EXECUTED: {
        await this.onMintingExecuted(em, evmLog, log.args as MintingExecutedEvent.OutputTuple)
        break
      } case MINTING_PAYMENT_DEFAULT: {
        await this.onMintingPaymentDefault(em, evmLog, log.args as MintingPaymentDefaultEvent.OutputTuple)
        break
      } case COLLATERAL_RESERVATION_DELETED: {
        await this.onCollateralReservationDeleted(em, evmLog, log.args as CollateralReservationDeletedEvent.OutputTuple)
        break
      } case REDEMPTION_REQUESTED: {
        await this.onRedemptionRequested(em, evmLog, log.args as RedemptionRequestedEvent.OutputTuple)
        break
      } case REDEMPTION_PERFORMED: {
        await this.onRedemptionPerformed(em, evmLog, log.args as RedemptionPerformedEvent.OutputTuple)
        break
      } case REDEMPTION_DEFAULT: {
        await this.onRedemptionDefault(em, evmLog, log.args as RedemptionDefaultEvent.OutputTuple)
        break
      } case REDEMPTION_PAYMENT_BLOCKED: {
        await this.onRedemptionPaymentBlocked(em, evmLog, log.args as RedemptionPaymentBlockedEvent.OutputTuple)
        break
      } case REDEMPTION_PAYMENT_FAILED: {
        await this.onRedemptionPaymentFailed(em, evmLog, log.args as RedemptionPaymentFailedEvent.OutputTuple)
        break
      } case REDEMPTION_REJECTED: {
        await this.onRedemptionRejected(em, evmLog, log.args as RedemptionRejectedEvent.OutputTuple)
        break
      } case REDEMPTION_REQUEST_INCOMPLETE: {
        await this.onRedemptionPaymentIncomplete(em, evmLog, log.args as RedemptionRequestIncompleteEvent.OutputTuple)
        break
      } case LIQUIDATION_STARTED: {
        await this.onLiquidationStarted(em, evmLog, log.args as LiquidationStartedEvent.OutputTuple)
        break
      } case LIQUIDATION_PERFORMED: {
        await this.onLiquidationPerformed(em, evmLog, log.args as LiquidationPerformedEvent.OutputTuple)
        break
      } case FULL_LIQUIDATION_STARTED: {
        await this.onFullLiquidationStarted(em, evmLog, log.args as FullLiquidationStartedEvent.OutputTuple)
        break
      } case LIQUIDATION_ENDED: {
        await this.onLiquidationEnded(em, evmLog, log.args as LiquidationEndedEvent.OutputTuple)
        break
      } case AVAILABLE_AGENT_EXITED: {
        await this.onAvailableAgentExited(em, log.args as AvailableAgentExitAnnouncedEvent.OutputTuple)
        break
      } case AGENT_ENTERED_AVAILABLE: {
        await this.onAgentEnteredAvailable(em, log.args as AgentAvailableEvent.OutputTuple)
        break
      } default: {
        break
      }
    }
  }

  protected async onCollateralTypeAdded(em: EntityManager, evmLog: EvmLog, logArgs: CollateralTypeAddedEvent.OutputTuple): Promise<void> {
    const [ collateralClass, token, decimals, directPricePair, assetFtsoSymbol, tokenFtsoSymbol, ] = logArgs
    const tokenEvmAddress = await this.findOrCreateEvmAddress(em, token, AddressType.SYSTEM)
    const collateralTypeAdded = new CollateralType(evmLog,
      Number(collateralClass), tokenEvmAddress, Number(decimals),
      directPricePair, assetFtsoSymbol, tokenFtsoSymbol
    )
    em.persist(collateralTypeAdded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // agent

  protected async onAgentVaultCreated(em: EntityManager, evmLog: EvmLog, logArgs: AgentVaultCreatedEvent.OutputTuple): Promise<AgentVault> {
    const [
      owner, agentVault, collateralPool, underlyingAddress, vaultCollateralToken,
      feeBIPS, poolFeeShareBIPS, mintingVaultCollateralRatioBIPS, mintingPoolCollateralRatioBIPS,
      buyFAssetByAgentFactorBIPS, poolExitCollateralRatioBIPS, poolTopupCollateralRatioBIPS, poolTopupTokenPriceFactorBIPS
    ] = logArgs
    const agentOwnerEntity = await em.findOneOrFail(AgentOwner, { manager: { address: { hex: owner }}})
    // addresses
    const agentEvmAddressEntity = await this.findOrCreateEvmAddress(em, agentVault, AddressType.AGENT)
    const agentUnderlyingAddressEntity = await this.findOrCreateUnderlyingAddress(em, underlyingAddress, AddressType.AGENT)
    const collateralPoolEvmAddressEntity = await this.findOrCreateEvmAddress(em, collateralPool, AddressType.AGENT)
    // create agent vault
    const agentVaultEntity = new AgentVault(
      agentEvmAddressEntity, agentUnderlyingAddressEntity,
      collateralPoolEvmAddressEntity, agentOwnerEntity, false
    )
    const vaultCollateralTokenEntity = await em.findOneOrFail(CollateralType, { address: { hex: vaultCollateralToken }})
    const agentVaultSettings = new AgentVaultSettings(
      agentVaultEntity, vaultCollateralTokenEntity, feeBIPS, poolFeeShareBIPS, mintingVaultCollateralRatioBIPS,
      mintingPoolCollateralRatioBIPS, buyFAssetByAgentFactorBIPS, poolExitCollateralRatioBIPS,
      poolTopupCollateralRatioBIPS, poolTopupTokenPriceFactorBIPS
    )
    const agentVaultCreated = new AgentVaultCreated(evmLog, agentVaultEntity)
    em.persist([agentVaultEntity, agentVaultSettings, agentVaultCreated])
    return agentVaultEntity
  }

  protected async onAgentSettingChanged(em: EntityManager, evmLog: EvmLog, logArgs: AgentSettingChangeAnnouncedEvent.OutputTuple): Promise<void> {
    const [ agentVault, name, value ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const agentSettingChanged = new AgentSettingChanged(evmLog, agentVaultEntity, name, value)
    const agentSettings = await em.findOneOrFail(AgentVaultSettings, { agentVault: agentVaultEntity })
    this.applyAgentSettingChange(agentSettings, name, value)
    em.persist([agentSettingChanged, agentSettings])
  }

  protected async onAvailableAgentExited(em: EntityManager, logArgs: AvailableAgentExitAnnouncedEvent.OutputTuple): Promise<void> {
    const [ agentVault ] = logArgs
    const isUntracked = await isUntrackedAgentVault(em, agentVault)
    if (isUntracked) return // untracked agents don't have agent vault info property
    const agentVaultEntity = await em.findOneOrFail(AgentVaultInfo, { agentVault: { address: { hex: agentVault }}})
    agentVaultEntity.publiclyAvailable = false
    em.persist(agentVaultEntity)
  }

  protected async onAgentEnteredAvailable(em: EntityManager, logArgs: AgentAvailableEvent.OutputTuple): Promise<void> {
    const [ agentVault, ] = logArgs
    const isUntracked = await isUntrackedAgentVault(em, agentVault)
    if (isUntracked) return // untracked agents don't have agent vault info property
    const agentVaultEntity = await em.findOneOrFail(AgentVaultInfo, { agentVault: { address: { hex: agentVault }}})
    agentVaultEntity.publiclyAvailable = true
    em.persist(agentVaultEntity)
  }

  protected async onAgentDestroyed(em: EntityManager, logArgs: AgentDestroyedEvent.OutputTuple): Promise<void> {
    const [ agentVault ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    agentVaultEntity.destroyed = true
    em.persist(agentVaultEntity)
  }

  private applyAgentSettingChange(agentSettings: AgentVaultSettings, name: string, value: bigint): void {
    switch (name) {
      case "feeBIPS": {
        agentSettings.feeBIPS = BigInt(value)
        break
      } case "poolFeeShareBIPS": {
        agentSettings.poolFeeShareBIPS = BigInt(value)
        break
      } case "mintingVaultCollateralRatioBIPS": {
        agentSettings.mintingVaultCollateralRatioBIPS = BigInt(value)
        break
      } case "mintingPoolCollateralRatioBIPS": {
        agentSettings.mintingPoolCollateralRatioBIPS = BigInt(value)
        break
      } case "buyFAssetByAgentFactorBIPS": {
        agentSettings.buyFAssetByAgentFactorBIPS = BigInt(value)
        break
      } case "poolExitCollateralRatioBIPS": {
        agentSettings.poolExitCollateralRatioBIPS = BigInt(value)
        break
      } case "poolTopupCollateralRatioBIPS": {
        agentSettings.poolTopupCollateralRatioBIPS = BigInt(value)
        break
      } case "poolTopupTokenPriceFactorBIPS": {
        agentSettings.poolTopupTokenPriceFactorBIPS = BigInt(value)
        break
      } default: {
        break
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // mintings

  protected async onCollateralReserved(em: EntityManager, evmLog: EvmLog, logArgs: CollateralReservedEvent.OutputTuple): Promise<void> {
    const [
      agentVault, minter, collateralReservationId, valueUBA, feeUBA,
      firstUnderlyingBlock, lastUnderlyingBlock, lastUnderlyingTimestamp,
      paymentAddress, paymentReference, executor, executorFeeNatWei
    ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const minterEvmAddress = await this.findOrCreateEvmAddress(em, minter, AddressType.USER)
    const paymentUnderlyingAddress = await this.findOrCreateUnderlyingAddress(em, paymentAddress, AddressType.AGENT)
    const executorEvmAddress = await this.findOrCreateEvmAddress(em, executor, AddressType.SERVICE)
    const collateralReserved = new CollateralReserved(evmLog,
      Number(collateralReservationId), agentVaultEntity, minterEvmAddress, valueUBA, feeUBA,
      Number(firstUnderlyingBlock), Number(lastUnderlyingBlock), Number(lastUnderlyingTimestamp),
      paymentUnderlyingAddress, paymentReference, executorEvmAddress, executorFeeNatWei
    )
    em.persist(collateralReserved)
  }

  protected async onMintingExecuted(em: EntityManager, evmLog: EvmLog, logArgs: MintingExecutedEvent.OutputTuple): Promise<void> {
    const [ , collateralReservationId,,, poolFeeUBA ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const mintingExecuted = new MintingExecuted(evmLog, collateralReserved, poolFeeUBA)
    em.persist(mintingExecuted)
  }

  protected async onMintingPaymentDefault(em: EntityManager, evmLog: EvmLog, logArgs: MintingPaymentDefaultEvent.OutputTuple): Promise<void> {
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const mintingPaymentDefault = new MintingPaymentDefault(evmLog, collateralReserved)
    em.persist(mintingPaymentDefault)
  }

  protected async onCollateralReservationDeleted(em: EntityManager, evmLog: EvmLog, logArgs: CollateralReservationDeletedEvent.OutputTuple): Promise<void> {
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const collateralReservationDeleted = new CollateralReservationDeleted(evmLog, collateralReserved)
    em.persist(collateralReservationDeleted)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // redemptions

  protected async onRedemptionRequested(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestedEvent.OutputTuple): Promise<void> {
    const [
      agentVault, redeemer, requestId, paymentAddress, valueUBA, feeUBA,
      firstUnderlyingBlock, lastUnderlyingBlock, lastUnderlyingTimestamp,
      paymentReference, executor, executorFeeNatWei
    ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const redeemerEvmAddress = await this.findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const paymentUnderlyingAddress = await this.findOrCreateUnderlyingAddress(em, paymentAddress, AddressType.USER)
    const executorEvmAddress = await this.findOrCreateEvmAddress(em, executor, AddressType.SERVICE)
    const redemptionRequested = new RedemptionRequested(evmLog,
      agentVaultEntity, redeemerEvmAddress, Number(requestId), paymentUnderlyingAddress, valueUBA, feeUBA,
      Number(firstUnderlyingBlock), Number(lastUnderlyingBlock), Number(lastUnderlyingTimestamp),
      paymentReference, executorEvmAddress, executorFeeNatWei
    )
    em.persist(redemptionRequested)
  }

  protected async onRedemptionPerformed(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPerformedEvent.OutputTuple): Promise<void> {
    const [ ,, requestId, transactionHash, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPerformed = new RedemptionPerformed(evmLog, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPerformed)
  }

  protected async onRedemptionDefault(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionDefaultEvent.OutputTuple): Promise<void> {
    const [ ,, requestId,, redeemedVaultCollateralWei, redeemedPoolCollateralWei ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionDefault = new RedemptionDefault(evmLog, redemptionRequested, redeemedVaultCollateralWei, redeemedPoolCollateralWei)
    em.persist(redemptionDefault)
  }

  protected async onRedemptionPaymentBlocked(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentBlockedEvent.OutputTuple): Promise<void> {
    const [ ,, requestId, transactionHash,, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPaymentBlocked = new RedemptionPaymentBlocked(evmLog, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPaymentBlocked)
  }

  protected async onRedemptionPaymentFailed(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentFailedEvent.OutputTuple): Promise<void> {
    const [ ,, requestId, transactionHash, spentUnderlyingUBA, failureReason ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPaymentFailed = new RedemptionPaymentFailed(evmLog, redemptionRequested, transactionHash, spentUnderlyingUBA, failureReason)
    em.persist(redemptionPaymentFailed)
  }

  protected async onRedemptionRejected(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRejectedEvent.OutputTuple): Promise<void> {
    const [ ,, requestId, ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionRejected = new RedemptionRejected(evmLog, redemptionRequested)
    em.persist(redemptionRejected)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // liquidations

  protected async onLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationStartedEvent.OutputTuple): Promise<void> {
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationStarted = new LiquidationStarted(evmLog, agentVaultEntity, Number(timestamp))
    em.persist(liquidationStarted)
  }

  protected async onFullLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: FullLiquidationStartedEvent.OutputTuple): Promise<void> {
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const fullLiquidationStarted = new FullLiquidationStarted(evmLog, agentVaultEntity, Number(timestamp))
    em.persist(fullLiquidationStarted)
  }

  protected async onLiquidationPerformed(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationPerformedEvent.OutputTuple): Promise<void> {
    const [ agentVault, liquidator, valueUBA ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidatorEvmAddress = await this.findOrCreateEvmAddress(em, liquidator, AddressType.USER)
    const liquidationPerformed = new LiquidationPerformed(evmLog, agentVaultEntity, liquidatorEvmAddress, valueUBA)
    em.persist(liquidationPerformed)
  }

  protected async onLiquidationEnded(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationEndedEvent.OutputTuple): Promise<void> {
    const [ agentVault ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationEnded = new LiquidationEnded(evmLog, agentVaultEntity)
    em.persist(liquidationEnded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // dangerous events

  protected async onRedemptionPaymentIncomplete(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestIncompleteEvent.OutputTuple): Promise<void> {
    const [ redeemer, remainingLots ] = logArgs
    const redeemerEvmAddress = await this.findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const redemptionRequestIncomplete = new RedemptionRequestIncomplete(evmLog, redeemerEvmAddress, remainingLots)
    em.persist(redemptionRequestIncomplete)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // helpers

  protected async findOrCreateEvmAddress(em: EntityManager, address: string, type: AddressType): Promise<EvmAddress> {
    let evmAddress = await em.findOne(EvmAddress, { hex: address})
    if (!evmAddress) {
      evmAddress = new EvmAddress(address, type)
      em.persist(evmAddress)
    }
    return evmAddress
  }

  protected async findOrCreateUnderlyingAddress(em: EntityManager, address: string, type: AddressType): Promise<UnderlyingAddress> {
    let underlyingAddress = await em.findOne(UnderlyingAddress, { text: address })
    if (!underlyingAddress) {
      underlyingAddress = new UnderlyingAddress(address, type)
      em.persist(underlyingAddress)
    }
    return underlyingAddress
  }

  private async createLogEntity(em: EntityManager, log: FullLog): Promise<EvmLog> {
    const source = await this.findOrCreateEvmAddress(em, log.source, AddressType.SYSTEM)
    const evmLog = new EvmLog(
      log.blockNumber, log.transactionIndex, log.logIndex,
      log.name, source, log.transactionHash, log.blockTimestamp)
    em.persist(evmLog)
    return evmLog
  }

}