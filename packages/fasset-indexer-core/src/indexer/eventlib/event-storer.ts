import { findOrCreateUnderlyingAddress } from "../../utils"
import {
  isUntrackedAgentVault, findOrCreateEvmAddress,
  findOrCreateEvmBlock, findOrCreateEvmTransaction
} from "../shared"
import { EvmLog } from "../../database/entities/evm/log"
import { CollateralTypeAdded, ERC20Transfer } from "../../database/entities/events/token"
import { TokenBalance } from "../../database/entities/state/balance"
import { AddressType, EvmAddress } from "../../database/entities/address"
import { AgentOwner, AgentVault } from "../../database/entities/agent"
import { AgentVaultCreated, AgentSettingChanged, SelfClose } from "../../database/entities/events/agent"
import { AgentVaultInfo, AgentVaultSettings } from "../../database/entities/state/agent"
import {
  CollateralReservationDeleted,
  CollateralReserved, MintingExecuted,
  MintingPaymentDefault,
  SelfMint
} from "../../database/entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentFailed, RedemptionPaymentBlocked, RedemptionRejected,
  RedemptionRequestIncomplete,
  RedeemedInCollateral
} from "../../database/entities/events/redemption"
import {
  AgentInCCB,
  FullLiquidationStarted, LiquidationEnded, LiquidationPerformed, LiquidationStarted
} from "../../database/entities/events/liquidation"
import {
  DuplicatePaymentConfirmed, IllegalPaymentConfirmed, UnderlyingBalanceTooLow
} from "../../database/entities/events/challenge"
import { CollateralPoolEntered, CollateralPoolExited } from "../../database/entities/events/collateral-pool"
import { AgentPing, AgentPingResponse } from "../../database/entities/events/ping"
import { CurrentUnderlyingBlockUpdated } from "../../database/entities/events/system"
import { ContractLookup } from "../../context/lookup"
import { EVENTS } from '../../config/constants'
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
  SelfCloseEvent, AgentPingEvent, AgentPingResponseEvent,
  IllegalPaymentConfirmedEvent, DuplicatePaymentConfirmedEvent, UnderlyingBalanceTooLowEvent,
  AgentInCCBEvent, SelfMintEvent
} from "../../../chain/typechain/IAssetManager"
import type { EnteredEvent, ExitedEvent } from "../../../chain/typechain/ICollateralPool"
import type { TransferEvent } from "../../../chain/typechain/IERC20"
import type { CurrentUnderlyingBlockUpdatedEvent, RedeemedInCollateralEvent } from "../../../chain/typechain/IAssetManager"
import type { ORM } from "../../database/interface"
import { PricesPublishedEvent } from "../../../chain/typechain/IPriceChangeEmitter"
import { PricesPublished } from "../../database/entities/events/prices"


export class EventStorer {
  constructor(readonly orm: ORM, public readonly lookup: ContractLookup) { }

  async processEvent(log: Event): Promise<void> {
    await this.orm.em.fork().transactional(async (em) => {
      await this.processEventUnsafe(em, log)
    })
  }

  async processEventUnsafe(em: EntityManager, log: Event): Promise<void> {
    if (!await this.logExists(em, log)) {
      const evmLog = await this.createLogEntity(em, log)
      const processed = await this._processEvent(em, log, evmLog)
      if (processed) em.persist(evmLog)
    }
  }

  protected async _processEvent(em: EntityManager, log: Event, evmLog: EvmLog): Promise<boolean> {
    switch (log.name) {
      case EVENTS.ASSET_MANAGER.COLLATERAL_TYPE_ADDED: {
        await this.onCollateralTypeAdded(em, evmLog, log.args as CollateralTypeAddedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_VAULT_CREATED: {
        await this.onAgentVaultCreated(em, evmLog, log.args as AgentVaultCreatedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_SETTING_CHANGED: {
        await this.onAgentSettingChanged(em, evmLog, log.args as AgentSettingChangeAnnouncedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_DESTROYED: {
        await this.onAgentDestroyed(em, log.args as AgentDestroyedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.SELF_CLOSE: {
        await this.onSelfClose(em, evmLog, log.args as SelfCloseEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.COLLATERAL_RESERVED: {
        await this.onCollateralReserved(em, evmLog, log.args as CollateralReservedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.MINTING_EXECUTED: {
        await this.onMintingExecuted(em, evmLog, log.args as MintingExecutedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.SELF_MINT: {
        await this.onSelfMint(em, evmLog, log.args as SelfMintEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.MINTING_PAYMENT_DEFAULT: {
        await this.onMintingPaymentDefault(em, evmLog, log.args as MintingPaymentDefaultEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.COLLATERAL_RESERVATION_DELETED: {
        await this.onCollateralReservationDeleted(em, evmLog, log.args as CollateralReservationDeletedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_REQUESTED: {
        await this.onRedemptionRequested(em, evmLog, log.args as RedemptionRequestedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_PERFORMED: {
        await this.onRedemptionPerformed(em, evmLog, log.args as RedemptionPerformedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_DEFAULT: {
        await this.onRedemptionDefault(em, evmLog, log.args as RedemptionDefaultEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_PAYMENT_BLOCKED: {
        await this.onRedemptionPaymentBlocked(em, evmLog, log.args as RedemptionPaymentBlockedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_PAYMENT_FAILED: {
        await this.onRedemptionPaymentFailed(em, evmLog, log.args as RedemptionPaymentFailedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_REJECTED: {
        await this.onRedemptionRejected(em, evmLog, log.args as RedemptionRejectedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEEMED_IN_COLLATERAL: {
        await this.onRedeemedInCollateral(em, evmLog, log.args as RedeemedInCollateralEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.REDEMPTION_REQUEST_INCOMPLETE: {
        await this.onRedemptionPaymentIncomplete(em, evmLog, log.args as RedemptionRequestIncompleteEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_IN_CCB: {
        await this.onAgentInCCB(em, evmLog, log.args as AgentInCCBEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.LIQUIDATION_STARTED: {
        await this.onLiquidationStarted(em, evmLog, log.args as LiquidationStartedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.LIQUIDATION_PERFORMED: {
        await this.onLiquidationPerformed(em, evmLog, log.args as LiquidationPerformedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.FULL_LIQUIDATION_STARTED: {
        await this.onFullLiquidationStarted(em, evmLog, log.args as FullLiquidationStartedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.LIQUIDATION_ENDED: {
        await this.onLiquidationEnded(em, evmLog, log.args as LiquidationEndedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.ILLEGAL_PAYMENT_CONFIRMED: {
        await this.onIllegalPaymentConfirmed(em, evmLog, log.args as IllegalPaymentConfirmedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.DUPLICATE_PAYMENT_CONFIRMED: {
        await this.onDuplicatePaymentConfirmed(em, evmLog, log.args as DuplicatePaymentConfirmedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.UNDERLYING_BALANCE_TOO_LOW: {
        await this.onUnderlyingBalanceTooLow(em, evmLog, log.args as UnderlyingBalanceTooLowEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AVAILABLE_AGENT_EXITED: {
        await this.onAvailableAgentExited(em, log.args as AvailableAgentExitAnnouncedEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_ENTERED_AVAILABLE: {
        await this.onAgentEnteredAvailable(em, log.args as AgentAvailableEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_PING: {
        await this.onAgentPing(em, evmLog, log.args as AgentPingEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.AGENT_PING_RESPONSE: {
        await this.onAgentPingResponse(em, evmLog, log.args as AgentPingResponseEvent.OutputTuple)
        break
      } case EVENTS.ASSET_MANAGER.CURRENT_UNDERLYING_BLOCK_UPDATED: {
        await this.onCurrentUnderlyingBlockUpdated(em, evmLog, log.args as CurrentUnderlyingBlockUpdatedEvent.OutputTuple)
        break
      } case EVENTS.COLLATERAL_POOL.ENTER: {
        await this.onCollateralPoolEntered(em, evmLog, log.args as EnteredEvent.OutputTuple)
        break
      } case EVENTS.COLLATERAL_POOL.EXIT: {
        await this.onCollateralPoolExited(em, evmLog, log.args as ExitedEvent.OutputTuple)
        break
      } case EVENTS.ERC20.TRANSFER: {
        await this.onERC20Transfer(em, evmLog, log.args as TransferEvent.OutputTuple)
        break
      } case EVENTS.PRICE_READER.PRICES_PUBLISHED: {
        await this.onPublishedPrices(em, evmLog, log.args as PricesPublishedEvent.OutputTuple)
        break
      } default: {
        return false
      }
    }
    return true
  }

  protected async logExists(em: EntityManager, log: Event): Promise<boolean> {
    const { blockNumber, logIndex } = log
    const evmLog = await em.findOne(EvmLog, { index: logIndex, block: { index: blockNumber }})
    return evmLog !== null
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // collateral types

  protected async onCollateralTypeAdded(em: EntityManager, evmLog: EvmLog, logArgs: CollateralTypeAddedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ collateralClass, token, decimals, directPricePair, assetFtsoSymbol, tokenFtsoSymbol, ] = logArgs
    const tokenEvmAddress = await findOrCreateEvmAddress(em, token, AddressType.SYSTEM)
    const collateralTypeAdded = new CollateralTypeAdded(evmLog, fasset,
      Number(collateralClass), tokenEvmAddress, Number(decimals),
      directPricePair, assetFtsoSymbol, tokenFtsoSymbol
    )
    em.persist(collateralTypeAdded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // agent

  protected async onAgentVaultCreated(em: EntityManager, evmLog: EvmLog, logArgs: AgentVaultCreatedEvent.OutputTuple): Promise<AgentVault> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const { 0: owner, 1: agentVault } = logArgs
    const [ collateralPool, collateralPoolToken, underlyingAddress, vaultCollateralToken, poolWNatToken,
      feeBIPS, poolFeeShareBIPS, mintingVaultCollateralRatioBIPS, mintingPoolCollateralRatioBIPS,
      buyFAssetByAgentFactorBIPS, poolExitCollateralRatioBIPS, poolTopupCollateralRatioBIPS, poolTopupTokenPriceFactorBIPS
    ] = (logArgs as any).creationData
    const agentOwnerEntity = await em.findOneOrFail(AgentOwner, { manager: { address: { hex: owner }}})
    // addresses
    const agentEvmAddress = await findOrCreateEvmAddress(em, agentVault, AddressType.AGENT)
    const agentUnderlyingAddress = await findOrCreateUnderlyingAddress(em, underlyingAddress, AddressType.AGENT)
    const collateralPoolEvmAddress = await findOrCreateEvmAddress(em, collateralPool, AddressType.AGENT)
    const collateralPoolTokenEvmAddress = await findOrCreateEvmAddress(em, collateralPoolToken!, AddressType.AGENT)
    // create agent vault
    const agentVaultEntity = new AgentVault(
      fasset,
      agentEvmAddress, agentUnderlyingAddress,
      collateralPoolEvmAddress,
      collateralPoolTokenEvmAddress,
      agentOwnerEntity, false
    )
    const vaultCollateralTokenEntity = await em.findOneOrFail(CollateralTypeAdded, { address: { hex: vaultCollateralToken }, fasset })
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
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
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
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
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
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
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
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ , collateralReservationId,,, poolFeeUBA ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId), fasset })
    const mintingExecuted = new MintingExecuted(evmLog, fasset, collateralReserved, poolFeeUBA)
    em.persist(mintingExecuted)
  }

  protected async onMintingPaymentDefault(em: EntityManager, evmLog: EvmLog, logArgs: MintingPaymentDefaultEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId), fasset })
    const mintingPaymentDefault = new MintingPaymentDefault(evmLog, fasset, collateralReserved)
    em.persist(mintingPaymentDefault)
  }

  protected async onCollateralReservationDeleted(em: EntityManager, evmLog: EvmLog, logArgs: CollateralReservationDeletedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, collateralReservationId, ] = logArgs
    const collateralReserved = await em.findOneOrFail(CollateralReserved, { collateralReservationId: Number(collateralReservationId), fasset })
    const collateralReservationDeleted = new CollateralReservationDeleted(evmLog, fasset, collateralReserved)
    em.persist(collateralReservationDeleted)
  }

  protected async onSelfMint(em: EntityManager, evmLog: EvmLog, logArgs: SelfMintEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, mintFromFreeUnderlying, mintedAmountUBA, depositedAmountUBA, poolFeeUBA ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const selfMint = new SelfMint(evmLog, fasset, agentVaultEntity, mintFromFreeUnderlying, mintedAmountUBA, depositedAmountUBA, poolFeeUBA)
    em.persist(selfMint)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // redemptions

  protected async onRedemptionRequested(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
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
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash,, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId), fasset })
    const redemptionPerformed = new RedemptionPerformed(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPerformed)
  }

  protected async onRedemptionDefault(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionDefaultEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, requestId,, redeemedVaultCollateralWei, redeemedPoolCollateralWei ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId), fasset })
    const redemptionDefault = new RedemptionDefault(evmLog, fasset, redemptionRequested, redeemedVaultCollateralWei, redeemedPoolCollateralWei)
    em.persist(redemptionDefault)
  }

  protected async onRedemptionPaymentBlocked(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentBlockedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash,, spentUnderlyingUBA ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId), fasset })
    const redemptionPaymentBlocked = new RedemptionPaymentBlocked(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA)
    em.persist(redemptionPaymentBlocked)
  }

  protected async onRedemptionPaymentFailed(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionPaymentFailedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, transactionHash, spentUnderlyingUBA, failureReason ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId), fasset })
    const redemptionPaymentFailed = new RedemptionPaymentFailed(evmLog, fasset, redemptionRequested, transactionHash, spentUnderlyingUBA, failureReason)
    em.persist(redemptionPaymentFailed)
  }

  protected async onRedemptionRejected(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRejectedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ ,, requestId, ] = logArgs
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested, { requestId: Number(requestId), fasset })
    const redemptionRejected = new RedemptionRejected(evmLog, fasset, redemptionRequested)
    em.persist(redemptionRejected)
  }

  protected async onRedeemedInCollateral(em: EntityManager, evmLog: EvmLog, logArgs: RedeemedInCollateralEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, redeemer, redemptionAmountUBA, paidVaultCollateralWei ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const redeemerEvmAddress = await findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const redeemedInCollateral = new RedeemedInCollateral(
      evmLog, fasset, agentVaultEntity, redeemerEvmAddress,
      redemptionAmountUBA, paidVaultCollateralWei
    )
    em.persist(redeemedInCollateral)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // liquidations

  protected async onAgentInCCB(em: EntityManager, evmLog: EvmLog, logArgs: AgentInCCBEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const agentInCCB = new AgentInCCB(evmLog, fasset, agentVaultEntity, Number(timestamp))
    em.persist(agentInCCB)
  }

  protected async onLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationStartedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationStarted = new LiquidationStarted(evmLog, fasset, agentVaultEntity, Number(timestamp))
    em.persist(liquidationStarted)
  }

  protected async onFullLiquidationStarted(em: EntityManager, evmLog: EvmLog, logArgs: FullLiquidationStartedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, timestamp ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const fullLiquidationStarted = new FullLiquidationStarted(evmLog, fasset, agentVaultEntity, Number(timestamp))
    em.persist(fullLiquidationStarted)
  }

  protected async onLiquidationPerformed(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationPerformedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, liquidator, valueUBA, paidVaultCollateralWei, paidPoolCollateralWei ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidatorEvmAddress = await findOrCreateEvmAddress(em, liquidator, AddressType.USER)
    const liquidationPerformed = new LiquidationPerformed(evmLog, fasset,
      agentVaultEntity, liquidatorEvmAddress, valueUBA, paidVaultCollateralWei, paidPoolCollateralWei)
    em.persist(liquidationPerformed)
  }

  protected async onLiquidationEnded(em: EntityManager, evmLog: EvmLog, logArgs: LiquidationEndedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const liquidationEnded = new LiquidationEnded(evmLog, fasset, agentVaultEntity)
    em.persist(liquidationEnded)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // challenges

  protected async onIllegalPaymentConfirmed(em: EntityManager, evmLog: EvmLog, logArgs: IllegalPaymentConfirmedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, transactionHash ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const illegalPaymentConfirmed = new IllegalPaymentConfirmed(evmLog, fasset, agentVaultEntity, transactionHash)
    em.persist(illegalPaymentConfirmed)
  }

  protected async onDuplicatePaymentConfirmed(em: EntityManager, evmLog: EvmLog, logArgs: DuplicatePaymentConfirmedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, transactionHash1, transactionHash2 ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const duplicatePaymentConfirmed = new DuplicatePaymentConfirmed(evmLog, fasset, agentVaultEntity, transactionHash1, transactionHash2)
    em.persist(duplicatePaymentConfirmed)
  }

  protected async onUnderlyingBalanceTooLow(em: EntityManager, evmLog: EvmLog, logArgs: UnderlyingBalanceTooLowEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ agentVault, balance, requiredBalance ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const underlyingBalanceTooLow = new UnderlyingBalanceTooLow(evmLog, fasset, agentVaultEntity, balance, requiredBalance)
    em.persist(underlyingBalanceTooLow)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // dangerous events

  protected async onRedemptionPaymentIncomplete(em: EntityManager, evmLog: EvmLog, logArgs: RedemptionRequestIncompleteEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ redeemer, remainingLots ] = logArgs
    const redeemerEvmAddress = await findOrCreateEvmAddress(em, redeemer, AddressType.USER)
    const redemptionRequestIncomplete = new RedemptionRequestIncomplete(evmLog, fasset, redeemerEvmAddress, remainingLots)
    em.persist(redemptionRequestIncomplete)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // collateral pool

  protected async onCollateralPoolEntered(em: EntityManager, evmLog: EvmLog, logArgs: EnteredEvent.OutputTuple): Promise<void> {
    const agentVault = await em.findOneOrFail(AgentVault, { collateralPool: { hex: evmLog.address.hex }})
    const [ tokenHolder, amountNatWei, receivedTokensWei, addedFAssetFeesUBA, newFAssetFeeDebt, timelockExpiresAt ] = logArgs
    const tokenHolderEvmAddress = await findOrCreateEvmAddress(em, tokenHolder, AddressType.USER)
    const collateralPoolEntered = new CollateralPoolEntered(evmLog, agentVault.fasset,
      tokenHolderEvmAddress, amountNatWei, receivedTokensWei, addedFAssetFeesUBA, newFAssetFeeDebt, Number(timelockExpiresAt)
    )
    em.persist(collateralPoolEntered)
  }

  protected async onCollateralPoolExited(em: EntityManager, evmLog: EvmLog, logArgs: ExitedEvent.OutputTuple): Promise<void> {
    const agentVault = await em.findOneOrFail(AgentVault, { collateralPool: { hex: evmLog.address.hex }})
    const [ tokenHolder, burnedTokensWei, receivedNatWei, receviedFAssetFeesUBA, closedFAssetsUBA, newFAssetFeeDebt ] = logArgs
    const tokenHolderEvmAddress = await findOrCreateEvmAddress(em, tokenHolder, AddressType.USER)
    const collateralPoolExited = new CollateralPoolExited(evmLog, agentVault.fasset,
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
    await this.increaseTokenBalance(em, evmLog.address, toEvmAddress, value)
    await this.increaseTokenBalance(em, evmLog.address, fromEvmAddress, -value)
  }

  private async increaseTokenBalance(em: EntityManager, token: EvmAddress, holder: EvmAddress, amount: bigint): Promise<void> {
    let balance = await em.findOne(TokenBalance, { token, holder })
    if (balance === null) {
      balance = new TokenBalance(token, holder, amount)
    } else {
      balance.amount += amount
    }
    em.persist(balance)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // agent ping

  protected async onAgentPing(em: EntityManager, evmLog: EvmLog, logArgs: AgentPingEvent.OutputTuple): Promise<void> {
    const [ agentVault, sender, query ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const senderEvmAddress = await findOrCreateEvmAddress(em, sender, AddressType.USER)
    const agentPing = new AgentPing(evmLog, agentVaultEntity.fasset, agentVaultEntity, senderEvmAddress, query)
    em.persist(agentPing)
  }

  protected async onAgentPingResponse(em: EntityManager, evmLog: EvmLog, logArgs: AgentPingResponseEvent.OutputTuple): Promise<void> {
    const [ agentVault,, query, response ] = logArgs
    const agentVaultEntity = await em.findOneOrFail(AgentVault, { address: { hex: agentVault }})
    const agentPingResponse = new AgentPingResponse(evmLog, agentVaultEntity.fasset, agentVaultEntity, query, response)
    em.persist(agentPingResponse)
  }

  // system

  protected async onCurrentUnderlyingBlockUpdated(em: EntityManager, evmLog: EvmLog, logArgs: CurrentUnderlyingBlockUpdatedEvent.OutputTuple): Promise<void> {
    const fasset = this.lookup.assetManagerAddressToFAssetType(evmLog.address.hex)
    const [ underlyingBlockNumber, underlyingBlockTimestamp, updatedAt ] = logArgs
    const currentUnderlyingBlockUpdated = new CurrentUnderlyingBlockUpdated(evmLog, fasset,
      Number(underlyingBlockNumber), Number(underlyingBlockTimestamp), Number(updatedAt))
    em.persist(currentUnderlyingBlockUpdated)
  }

  // price publisher

  protected async onPublishedPrices(em: EntityManager, evmLog: EvmLog, logArgs: PricesPublishedEvent.OutputTuple): Promise<PricesPublished> {
    const [ votingRoundId ] = logArgs
    const pricesPublished = new PricesPublished(evmLog, Number(votingRoundId))
    em.persist(pricesPublished)
    return pricesPublished
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////
  // helpers

  private async createLogEntity(em: EntityManager, log: Event): Promise<EvmLog> {
    const transactionSource = await findOrCreateEvmAddress(em, log.transactionSource, AddressType.SYSTEM)
    const transactionTarget = log.transactionTarget === null ? undefined
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