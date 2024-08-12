import {
  isUntrackedAgentVault, findOrCreateEvmAddress,
  findOrCreateUnderlyingAddress, findOrCreateEvmBlock, findOrCreateEvmTransaction
} from "../shared"
import { EvmLog } from "../../database/entities/evm/log"
import { CollateralType, ERC20Transfer } from "../../database/entities/events/token"
import { AddressType } from "../../database/entities/address"
import { AgentOwner, AgentVault } from "../../database/entities/agent"
import { AgentVaultCreated, AgentSettingChanged, SelfClose } from "../../database/entities/events/agent"
import { AgentVaultInfo, AgentVaultSettings } from "../../database/entities/state/agent"
import {
  CollateralReservationDeleted,
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault
} from "../../database/entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
  RedemptionRequestIncomplete
} from "../../database/entities/events/redemption"
import {
  FullLiquidationStarted, LiquidationEnded, LiquidationPerformed, LiquidationStarted
} from "../../database/entities/events/liquidation"
import { CollateralPoolEntered, CollateralPoolExited } from "../../database/entities/events/collateralPool"
import { Context } from "../../context"
import {
  AGENT_VAULT_CREATED, AGENT_SETTING_CHANGED,
  COLLATERAL_RESERVED, MINTING_EXECUTED, MINTING_PAYMENT_DEFAULT, COLLATERAL_RESERVATION_DELETED,
  REDEMPTION_REQUESTED, REDEMPTION_PERFORMED, REDEMPTION_DEFAULT, REDEMPTION_PAYMENT_BLOCKED,
  REDEMPTION_PAYMENT_FAILED, REDEMPTION_REJECTED, REDEMPTION_REQUEST_INCOMPLETE,
  LIQUIDATION_STARTED, LIQUIDATION_PERFORMED, LIQUIDATION_ENDED, FULL_LIQUIDATION_STARTED,
  AGENT_ENTERED_AVAILABLE, AVAILABLE_AGENT_EXITED, AGENT_DESTROYED,
  COLLATERAL_TYPE_ADDED,
  COLLATERAL_POOL_ENTER,
  COLLATERAL_POOL_EXIT,
  SELF_CLOSE,
  ERC20_TRANSFER
} from '../../config/constants'
import type { EntityManager } from "@mikro-orm/knex"
import type { Event } from "./event-scraper"
import type {
  AgentAvailableEvent, AgentDestroyedEvent, AgentSettingChangeAnnouncedEvent,
  AgentVaultCreatedEvent, AvailableAgentExitAnnouncedEvent,
  CollateralReservationDeletedEvent, CollateralReservedEvent, CollateralTypeAddedEvent,
  MintingExecutedEvent, MintingPaymentDefaultEvent,
  RedemptionDefaultEvent, RedemptionPaymentBlockedEvent, RedemptionPaymentFailedEvent, RedemptionPerformedEvent,
  RedemptionRejectedEvent, RedemptionRequestIncompleteEvent, RedemptionRequestedEvent,
  FullLiquidationStartedEvent, LiquidationEndedEvent, LiquidationPerformedEvent, LiquidationStartedEvent,
  SelfCloseEvent
} from "../../../chain/typechain/AMEvents"
import type { EnteredEvent, ExitedEvent } from "../../../chain/typechain/CollateralPool"
import type { TransferEvent } from "../../../chain/typechain/ERC20"


export class EventStorer {

  constructor(readonly context: Context) {}

  async processEvent(em: EntityManager, log: Event): Promise<void> {
    if (!await this.logExists(em, log)) {
      const evmLog = await this.createLogEntity(em, log)
      const processed = await this._processEvent(em, log, evmLog)
      if (processed) em.persist(evmLog)
    }
  }

  protected async logExists(em: EntityManager, log: Event): Promise<boolean> {
    const { blockNumber, logIndex } = log
    const evmLog = await em.findOne(EvmLog, { index: logIndex, block: { index: blockNumber }})
    return evmLog !== null
  }

  protected async _processEvent(em: EntityManager, log: Event, evmLog: EvmLog): Promise<boolean> {
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
      } case AGENT_DESTROYED: {
        await this.onAgentDestroyed(em, log.args as AgentDestroyedEvent.OutputTuple)
        break
      } case SELF_CLOSE: {
        await this.onSelfClose(em, evmLog, log.args as SelfCloseEvent.OutputTuple)
        break
      } case COLLATERAL_RESERVED: {
        await this.onCollateralReserved(em, evmLog, log.args as CollateralReservedEvent.OutputTuple)
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
      } case COLLATERAL_POOL_ENTER: {
        await this.onCollateralPoolEntered(em, evmLog, log.args as EnteredEvent.OutputTuple)
        break
      } case COLLATERAL_POOL_EXIT: {
        await this.onCollateralPoolExited(em, evmLog, log.args as ExitedEvent.OutputTuple)
        break
      } case ERC20_TRANSFER: {
        await this.onERC20Transfer(em, evmLog, log.args as TransferEvent.OutputTuple)
        break
      } default: {
        return false
      }
    }
    return true
  }

  protected async onCollateralTypeAdded(em: EntityManager, evmLog: EvmLog, logArgs: CollateralTypeAddedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ collateralClass, token, decimals, directPricePair, assetFtsoSymbol, tokenFtsoSymbol, ] = logArgs
    const tokenEvmAddress = await findOrCreateEvmAddress(em, token, AddressType.SYSTEM)
    const collateralTypeAdded = new CollateralType(evmLog, fasset,
      Number(collateralClass), tokenEvmAddress, Number(decimals),
      directPricePair, assetFtsoSymbol, tokenFtsoSymbol
    )
    em.persist(collateralTypeAdded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // agent

  protected async onAgentVaultCreated(em: EntityManager, evmLog: EvmLog, logArgs: AgentVaultCreatedEvent.OutputTuple, collateralPoolToken?: string): Promise<AgentVault> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [
      owner, agentVault, collateralPool, underlyingAddress, vaultCollateralToken,
      feeBIPS, poolFeeShareBIPS, mintingVaultCollateralRatioBIPS, mintingPoolCollateralRatioBIPS,
      buyFAssetByAgentFactorBIPS, poolExitCollateralRatioBIPS, poolTopupCollateralRatioBIPS, poolTopupTokenPriceFactorBIPS
    ] = logArgs
    const agentOwnerEntity = await em.findOneOrFail(AgentOwner, { manager: { address: { hex: owner }}})
    // addresses
    const agentEvmAddress = await findOrCreateEvmAddress(em, agentVault, AddressType.AGENT)
    const agentUnderlyingAddress = await findOrCreateUnderlyingAddress(em, underlyingAddress, AddressType.AGENT)
    const collateralPoolEvmAddress = await findOrCreateEvmAddress(em, collateralPool, AddressType.AGENT)
    // create agent vault
    const agentVaultEntity = new AgentVault(
      agentEvmAddress, agentUnderlyingAddress,
      collateralPoolEvmAddress,
      agentOwnerEntity, false
    )
    if (collateralPoolToken !== undefined) {
      agentVaultEntity.collateralPoolToken = await findOrCreateEvmAddress(em, collateralPoolToken!, AddressType.AGENT)
    }
    const vaultCollateralTokenEntity = await em.findOneOrFail(CollateralType, { address: { hex: vaultCollateralToken }})
    const agentVaultSettings = new AgentVaultSettings(
      agentVaultEntity, vaultCollateralTokenEntity, feeBIPS, poolFeeShareBIPS, mintingVaultCollateralRatioBIPS,
      mintingPoolCollateralRatioBIPS, buyFAssetByAgentFactorBIPS, poolExitCollateralRatioBIPS,
      poolTopupCollateralRatioBIPS, poolTopupTokenPriceFactorBIPS
    )
    const agentVaultCreated = new AgentVaultCreated(evmLog, fasset, agentVaultEntity)
    em.persist([agentVaultEntity, agentVaultSettings, agentVaultCreated])
    return agentVaultEntity
  }

  protected async onAgentSettingChanged(em: EntityManager, evmLog: EvmLog, logArgs: AgentSettingChangeAnnouncedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault, name, value ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const agentSettingChanged = new AgentSettingChanged(evmLog, fasset, agentVaultEntity, name, value)
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
    const agentVaultInfo = await em.findOne(AgentVaultInfo, { agentVault: agentVaultEntity })
    if (agentVaultInfo) {
      em.remove(agentVaultInfo)
    }
    agentVaultEntity.destroyed = true
    em.persist(agentVaultEntity)
  }

  protected async onSelfClose(em: EntityManager, evmLog: EvmLog, logArgs: SelfCloseEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault, valueUBA ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const selfClose = new SelfClose(evmLog, fasset, agentVaultEntity, valueUBA)
    em.persist(selfClose)
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
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [
      agentVault, minter, collateralReservationId, valueUBA, feeUBA,
      firstUnderlyingBlock, lastUnderlyingBlock, lastUnderlyingTimestamp,
      paymentAddress, paymentReference, executor, executorFeeNatWei
    ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const minterEvmAddress = await findOrCreateEvmAddress(em, minter, AddressType.USER)
    const paymentUnderlyingAddress = await findOrCreateUnderlyingAddress(em, paymentAddress, AddressType.AGENT)
    const executorEvmAddress = await findOrCreateEvmAddress(em, executor, AddressType.SERVICE)
    const collateralReserved = new CollateralReserved(evmLog, fasset,
      Number(collateralReservationId), agentVaultEntity, minterEvmAddress, valueUBA, feeUBA,
      Number(firstUnderlyingBlock), Number(lastUnderlyingBlock), Number(lastUnderlyingTimestamp),
      paymentUnderlyingAddress, paymentReference, executorEvmAddress, executorFeeNatWei
    )
    em.persist(collateralReserved)
  }

  protected async onMintingExecuted(em: EntityManager, evmLog: EvmLog, logArgs: MintingExecutedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ , collateralReservationId,,, poolFeeUBA ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const mintingExecuted = new MintingExecuted(evmLog, fasset, collateralReserved, poolFeeUBA)
    em.persist(mintingExecuted)
  }

  protected async onMintingPaymentDefault(em: EntityManager, evmLog: EvmLog, logArgs: MintingPaymentDefaultEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const mintingPaymentDefault = new MintingPaymentDefault(evmLog, fasset, collateralReserved)
    em.persist(mintingPaymentDefault)
  }

  protected async onCollateralReservationDeleted(em: EntityManager, evmLog: EvmLog, logArgs: CollateralReservationDeletedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId) })
    const collateralReservationDeleted = new CollateralReservationDeleted(evmLog, fasset, collateralReserved)
    em.persist(collateralReservationDeleted)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // redemptions

  protected async onRedemptionRequested(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [
      agentVault, redeemer, requestId, paymentAddress, valueUBA, feeUBA,
      firstUnderlyingBlock, lastUnderlyingBlock, lastUnderlyingTimestamp,
      paymentReference, executor, executorFeeNatWei
    ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const redeemerEvmAddress = await findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const paymentUnderlyingAddress = await findOrCreateUnderlyingAddress(em, paymentAddress, AddressType.USER)
    const executorEvmAddress = await findOrCreateEvmAddress(em, executor, AddressType.SERVICE)
    const redemptionRequested = new RedemptionRequested(evmLog, fasset,
      agentVaultEntity, redeemerEvmAddress, Number(requestId), paymentUnderlyingAddress, valueUBA, feeUBA,
      Number(firstUnderlyingBlock), Number(lastUnderlyingBlock), Number(lastUnderlyingTimestamp),
      paymentReference, executorEvmAddress, executorFeeNatWei
    )
    em.persist(redemptionRequested)
  }

  protected async onRedemptionPerformed(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPerformedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPerformed = new RedemptionPerformed(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPerformed)
  }

  protected async onRedemptionDefault(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionDefaultEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, requestId,, redeemedVaultCollateralWei, redeemedPoolCollateralWei ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionDefault = new RedemptionDefault(evmLog, fasset, redemptionRequested, redeemedVaultCollateralWei, redeemedPoolCollateralWei)
    em.persist(redemptionDefault)
  }

  protected async onRedemptionPaymentBlocked(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentBlockedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash,, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPaymentBlocked = new RedemptionPaymentBlocked(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPaymentBlocked)
  }

  protected async onRedemptionPaymentFailed(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentFailedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash, spentUnderlyingUBA, failureReason ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionPaymentFailed = new RedemptionPaymentFailed(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA, failureReason)
    em.persist(redemptionPaymentFailed)
  }

  protected async onRedemptionRejected(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRejectedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId) })
    const redemptionRejected = new RedemptionRejected(evmLog, fasset, redemptionRequested)
    em.persist(redemptionRejected)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // liquidations

  protected async onLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationStartedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationStarted = new LiquidationStarted(evmLog, fasset, agentVaultEntity, Number(timestamp))
    em.persist(liquidationStarted)
  }

  protected async onFullLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: FullLiquidationStartedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const fullLiquidationStarted = new FullLiquidationStarted(evmLog, fasset, agentVaultEntity, Number(timestamp))
    em.persist(fullLiquidationStarted)
  }

  protected async onLiquidationPerformed(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationPerformedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault, liquidator, valueUBA ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidatorEvmAddress = await findOrCreateEvmAddress(em, liquidator, AddressType.USER)
    const liquidationPerformed = new LiquidationPerformed(evmLog, fasset, agentVaultEntity, liquidatorEvmAddress, valueUBA)
    em.persist(liquidationPerformed)
  }

  protected async onLiquidationEnded(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationEndedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ agentVault ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationEnded = new LiquidationEnded(evmLog, fasset, agentVaultEntity)
    em.persist(liquidationEnded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // dangerous events

  protected async onRedemptionPaymentIncomplete(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestIncompleteEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ redeemer, remainingLots ] = logArgs
    const redeemerEvmAddress = await findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const redemptionRequestIncomplete = new RedemptionRequestIncomplete(evmLog, fasset, redeemerEvmAddress, remainingLots)
    em.persist(redemptionRequestIncomplete)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // collateral pool

  protected async onCollateralPoolEntered(em: EntityManager, evmLog: EvmLog, logArgs: EnteredEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ tokenHolder, amountNatWei, receivedTokensWei, addedFAssetFeesUBA, newFAssetFeeDebt, timelockExpiresAt ] = logArgs
    const tokenHolderEvmAddress = await findOrCreateEvmAddress(em, tokenHolder, AddressType.USER)
    const collateralPoolEntered = new CollateralPoolEntered(evmLog, fasset,
      tokenHolderEvmAddress, amountNatWei, receivedTokensWei, addedFAssetFeesUBA, newFAssetFeeDebt, Number(timelockExpiresAt)
    )
    em.persist(collateralPoolEntered)
  }

  protected async onCollateralPoolExited(em: EntityManager, evmLog: EvmLog, logArgs: ExitedEvent.OutputTuple): Promise<void> {
    const fasset = this.context.addressToFAssetType(evmLog.address.hex)
    const [ tokenHolder, burnedTokensWei, receivedNatWei, receviedFAssetFeesUBA, closedFAssetsUBA, newFAssetFeeDebt ] = logArgs
    const tokenHolderEvmAddress = await findOrCreateEvmAddress(em, tokenHolder, AddressType.USER)
    const collateralPoolExited = new CollateralPoolExited(evmLog, fasset,
      tokenHolderEvmAddress, burnedTokensWei, receivedNatWei, receviedFAssetFeesUBA, closedFAssetsUBA, newFAssetFeeDebt
    )
    em.persist(collateralPoolExited)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // erc20 (fasset, collateral, wnat tokens)

  protected async onERC20Transfer(em: EntityManager, evmLog: EvmLog, logArgs: TransferEvent.OutputTuple): Promise<void> {
    const [ from, to, value ] = logArgs
    const fromEvmAddress = await findOrCreateEvmAddress(em, from, AddressType.USER)
    const toEvmAddress = await findOrCreateEvmAddress(em, to, AddressType.USER)
    const erc20Transfer = new ERC20Transfer(evmLog, fromEvmAddress, toEvmAddress, value)
    em.persist(erc20Transfer)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // helpers

  private async createLogEntity(em: EntityManager, log: Event): Promise<EvmLog> {
    const transactionSource = await findOrCreateEvmAddress(em, log.transactionSource, AddressType.SYSTEM)
    const transactionTarget = (log.transactionTarget === null) ? undefined
    : await findOrCreateEvmAddress(em, log.transactionTarget, AddressType.SYSTEM)
    const block = await findOrCreateEvmBlock(em, log.blockNumber, log.blockTimestamp)
    const transaction = await findOrCreateEvmTransaction(em, log.transactionHash, block,
      log.transactionIndex, transactionSource, transactionTarget)
    const eventSource = await findOrCreateEvmAddress(em, log.source, AddressType.SYSTEM)
    const evmLog = new EvmLog(log.logIndex, log.name, eventSource, transaction, block)
    // do not persist here, only persist if the log was processed
    return evmLog
  }

}