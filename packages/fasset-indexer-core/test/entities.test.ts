import { describe, beforeEach, afterEach, it } from "mocha"
import { use, expect } from "chai"
import chaiAsPromised from "chai-as-promised"
import { unlink } from "fs"
import { FAssetType } from "../src/database/entities/events/_bound"
import { EvmLog } from "../src/database/entities/evm/log"
import { AgentVaultCreated } from "../src/database/entities/events/agent"
import { AgentVault } from "../src/database/entities/agent"
import { AgentVaultSettings } from "../src/database/entities/state/agent"
import { CollateralTypeAdded } from "../src/database/entities/events/token"
import { EventFixture } from "./fixtures/event"
import {
  CollateralReservationDeleted, CollateralReserved,
  MintingExecuted, MintingPaymentDefault
} from "../src/database/entities/events/minting"
import {
  RedemptionDefault, RedemptionPaymentBlocked, RedemptionPaymentFailed,
  RedemptionPerformed, RedemptionRejected, RedemptionRequested
} from "../src/database/entities/events/redemption"
import { EventStorer } from "../src/indexer/eventlib/event-storer"
import { Context } from "../src/context"
import { CONFIG } from "./fixtures/config"


const ASSET_MANAGER_FXRP = "AssetManager_FTestXRP"
const ASSET_MANAGER_FBTC = "AssetManager_FTestBTC"

use(chaiAsPromised)

describe("ORM: Agent", () => {
  let context: Context
  let fixture: EventFixture
  let storer: EventStorer

  beforeEach(async () => {
    context = await Context.create(CONFIG)
    fixture = new EventFixture(context.orm)
    storer = new EventStorer(context)
  })

  afterEach(async () => {
    await context.orm.close()
    unlink(CONFIG.db.dbName!, () => {})
  })

  it("should store agent created event", async () => {
    const assetManager = context.getContractAddress(ASSET_MANAGER_FXRP)
    await fixture.storeInitialAgents()
    const em = context.orm.em.fork()
    // add initial collateral token type
    const collateralTypeAddedEvent = await fixture.generateEvent('CollateralTypeAdded', assetManager)
    await storer.processEvent(em, collateralTypeAddedEvent)
    const collateralTypeAdded = await em.findOneOrFail(CollateralTypeAdded,
      { evmLog: { index: collateralTypeAddedEvent.logIndex, block: { index: collateralTypeAddedEvent.blockNumber }}},
      { populate: ['address'] })
    expect(collateralTypeAdded).to.exist
    expect(collateralTypeAdded.address.hex).to.equal(collateralTypeAddedEvent.args[1])
    expect(collateralTypeAdded.fasset).to.equal(FAssetType.FXRP)
    // create agent
    const agentVaultCreatedEvent = await fixture.generateEvent('AgentVaultCreated', assetManager)
    await storer.processEvent(em, agentVaultCreatedEvent)
    // check that vault was created
    const agentVault = await em.findOneOrFail(AgentVault,
      { address: { hex: agentVaultCreatedEvent.args[1] }},
      { populate: ['address', 'underlyingAddress', 'collateralPool'] })
    expect(agentVault).to.exist
    expect(agentVault.address.hex).to.equal(agentVaultCreatedEvent.args[1])
    expect(agentVault.collateralPool.hex).to.equal(agentVaultCreatedEvent.args[2])
    expect(agentVault.underlyingAddress.text).to.equal(agentVaultCreatedEvent.args[3])
    // check that event was logged
    const agentVaultCreated = await em.findOneOrFail(AgentVaultCreated,
      { evmLog: { index: agentVaultCreatedEvent.logIndex, block: { index: agentVaultCreatedEvent.blockNumber }}},
      { populate: ['agentVault'] })
    expect(agentVaultCreated).to.exist
    expect(agentVaultCreated.agentVault).to.equal(agentVault)
    // check that agent vault settings were created
    const agentVaultSettings = await em.findOneOrFail(AgentVaultSettings, { agentVault },
      { populate: ['agentVault', 'collateralToken'] })
    expect(agentVaultSettings).to.exist
    expect(agentVaultSettings.agentVault).to.equal(agentVault)
    expect(agentVaultSettings.collateralToken).to.equal(collateralTypeAdded)
    expect(agentVaultSettings.feeBIPS).to.equal(agentVaultCreatedEvent.args[5])
  })

  it("should store all minting events", async () => {
    const assetManager = context.getContractAddress(ASSET_MANAGER_FXRP)
    await fixture.storeInitialAgents()
    const em = context.orm.em.fork()
    // collateral reserved event
    const collateralReservedEvent = await fixture.generateEvent('CollateralReserved', assetManager)
    await storer.processEvent(em, collateralReservedEvent)
    const collateralReserved = await em.findOneOrFail(CollateralReserved,
      { evmLog: { index: collateralReservedEvent.logIndex, block: { index: collateralReservedEvent.blockNumber }}},
      { populate: ['agentVault', 'minter', 'paymentAddress', 'executor'] })
    expect(collateralReserved).to.exist
    expect(collateralReserved.minter.hex).to.equal(collateralReservedEvent.args[1])
    expect(collateralReserved.collateralReservationId).to.equal(Number(collateralReservedEvent.args[2]))
    expect(collateralReserved.valueUBA).to.equal(collateralReservedEvent.args[3])
    expect(collateralReserved.feeUBA).to.equal(collateralReservedEvent.args[4])
    expect(collateralReserved.firstUnderlyingBlock).to.equal(Number(collateralReservedEvent.args[5]))
    expect(collateralReserved.lastUnderlyingBlock).to.equal(Number(collateralReservedEvent.args[6]))
    expect(collateralReserved.lastUnderlyingTimestamp).to.equal(Number(collateralReservedEvent.args[7]))
    expect(collateralReserved.paymentAddress.text).to.equal(collateralReservedEvent.args[8])
    expect(collateralReserved.paymentReference).to.equal(collateralReservedEvent.args[9])
    expect(collateralReserved.executor.hex).to.equal(collateralReservedEvent.args[10])
    expect(collateralReserved.executorFeeNatWei).to.equal(collateralReservedEvent.args[11])
    // minting executed event
    const mintingExecutedEvent = await fixture.generateEvent('MintingExecuted', assetManager)
    await storer.processEvent(em, mintingExecutedEvent)
    const mintingExecuted = await em.findOneOrFail(MintingExecuted,
      { evmLog: { index: mintingExecutedEvent.logIndex, block: { index: mintingExecutedEvent.blockNumber }}},
      { populate: ['collateralReserved'] })
    expect(mintingExecuted).to.exist
    expect(mintingExecuted.collateralReserved.collateralReservationId).to.equal(Number(mintingExecutedEvent.args[1]))
    expect(mintingExecuted.poolFeeUBA).to.equal(mintingExecutedEvent.args[4])
    // minting payment default event
    const mintingPaymentDefaultEvent = await fixture.generateEvent('MintingPaymentDefault', assetManager)
    await storer.processEvent(em, mintingPaymentDefaultEvent)
    const mintingPaymentDefault = await em.findOneOrFail(MintingPaymentDefault,
      { evmLog: { index: mintingPaymentDefaultEvent.logIndex, block: { index: mintingPaymentDefaultEvent.blockNumber }}},
      { populate: ['collateralReserved'] })
    expect(mintingPaymentDefault).to.exist
    expect(mintingPaymentDefault.collateralReserved.collateralReservationId).to.equal(Number(mintingPaymentDefaultEvent.args[2]))
    // collateral reservation deleted
    const collateralReservationDeletedEvent = await fixture.generateEvent('CollateralReservationDeleted', assetManager)
    await storer.processEvent(em, collateralReservationDeletedEvent)
    const collateralReservationDeleted = await em.findOneOrFail(CollateralReservationDeleted,
      { evmLog: { index: collateralReservationDeletedEvent.logIndex, block: { index: collateralReservationDeletedEvent.blockNumber }}},
      { populate: ['collateralReserved'] })
    expect(collateralReservationDeleted).to.exist
    expect(collateralReservationDeleted.collateralReserved.collateralReservationId).to.equal(Number(collateralReservationDeletedEvent.args[2]))
  })

  it("should store all redemption events", async () => {
    const assetManager = context.getContractAddress(ASSET_MANAGER_FXRP)
    await fixture.storeInitialAgents()
    const em = context.orm.em.fork()
    // redemption requested event
    const redemptionRequestedEvent = await fixture.generateEvent('RedemptionRequested', assetManager)
    await storer.processEvent(em, redemptionRequestedEvent)
    const redemptionRequested = await em.findOneOrFail(RedemptionRequested,
      { evmLog: { index: redemptionRequestedEvent.logIndex, block: { index: redemptionRequestedEvent.blockNumber }}},
      { populate: ['agentVault', 'redeemer', 'paymentAddress', 'executor'] })
    expect(redemptionRequested).to.exist
    expect(redemptionRequested.redeemer.hex).to.equal(redemptionRequestedEvent.args[1])
    expect(redemptionRequested.requestId).to.equal(Number(redemptionRequestedEvent.args[2]))
    expect(redemptionRequested.paymentAddress.text).to.equal(redemptionRequestedEvent.args[3])
    expect(redemptionRequested.valueUBA).to.equal(redemptionRequestedEvent.args[4])
    expect(redemptionRequested.feeUBA).to.equal(redemptionRequestedEvent.args[5])
    expect(redemptionRequested.firstUnderlyingBlock).to.equal(Number(redemptionRequestedEvent.args[6]))
    expect(redemptionRequested.lastUnderlyingBlock).to.equal(Number(redemptionRequestedEvent.args[7]))
    expect(redemptionRequested.lastUnderlyingTimestamp).to.equal(Number(redemptionRequestedEvent.args[8]))
    expect(redemptionRequested.paymentReference).to.equal(redemptionRequestedEvent.args[9])
    expect(redemptionRequested.executor.hex).to.equal(redemptionRequestedEvent.args[10])
    expect(redemptionRequested.executorFeeNatWei).to.equal(redemptionRequestedEvent.args[11])
    // redemption performed event
    const redemptionPerformedEvent = await fixture.generateEvent('RedemptionPerformed', assetManager)
    await storer.processEvent(em, redemptionPerformedEvent)
    const redemptionPerformed = await em.findOneOrFail(RedemptionPerformed,
      { evmLog: { index: redemptionPerformedEvent.logIndex, block: { index: redemptionPerformedEvent.blockNumber }}},
      { populate: ['redemptionRequested'] })
    expect(redemptionPerformed).to.exist
    expect(redemptionPerformed.redemptionRequested.redeemer.hex).to.equal(redemptionPerformedEvent.args[1])
    expect(redemptionPerformed.redemptionRequested.requestId).to.equal(Number(redemptionPerformedEvent.args[2]))
    expect(redemptionPerformed.transactionHash).to.equal(redemptionPerformedEvent.args[3])
    expect(redemptionPerformed.spentUnderlyingUBA).to.equal(redemptionPerformedEvent.args[5])
    // redemption default event
    const redemptionDefaultEvent = await fixture.generateEvent('RedemptionDefault', assetManager)
    await storer.processEvent(em, redemptionDefaultEvent)
    const redemptionDefault = await em.findOneOrFail(RedemptionDefault,
      { evmLog: { index: redemptionDefaultEvent.logIndex, block: { index: redemptionDefaultEvent.blockNumber }}},
      { populate: ['redemptionRequested'] })
    expect(redemptionDefault).to.exist
    expect(redemptionDefault.redemptionRequested.redeemer.hex).to.equal(redemptionDefaultEvent.args[1])
    expect(redemptionDefault.redemptionRequested.requestId).to.equal(Number(redemptionDefaultEvent.args[2]))
    expect(redemptionDefault.redeemedVaultCollateralWei).to.equal(redemptionDefaultEvent.args[4])
    expect(redemptionDefault.redeemedPoolCollateralWei).to.equal(redemptionDefaultEvent.args[5])
    // redemption rejected event
    const redemptionRejectedEvent = await fixture.generateEvent('RedemptionRejected', assetManager)
    await storer.processEvent(em, redemptionRejectedEvent)
    const redemptionRejected = await em.findOneOrFail(RedemptionRejected,
      { evmLog: { index: redemptionRejectedEvent.logIndex, block: { index: redemptionRejectedEvent.blockNumber }}},
      { populate: ['redemptionRequested'] })
    expect(redemptionRejected).to.exist
    expect(redemptionRejected.redemptionRequested.requestId).to.equal(Number(redemptionRejectedEvent.args[2]))
    // redemption payment blocked
    const redemptionPaymentBlockedEvent = await fixture.generateEvent('RedemptionPaymentBlocked', assetManager)
    await storer.processEvent(em, redemptionPaymentBlockedEvent)
    const redemptionPaymentBlocked = await em.findOneOrFail(RedemptionPaymentBlocked,
      { evmLog: { index: redemptionPaymentBlockedEvent.logIndex, block: { index: redemptionPaymentBlockedEvent.blockNumber }}},
      { populate: ['redemptionRequested'] })
    expect(redemptionPaymentBlocked).to.exist
    expect(redemptionPaymentBlocked.redemptionRequested.requestId).to.equal(Number(redemptionPaymentBlockedEvent.args[2]))
    expect(redemptionPaymentBlocked.transactionHash).to.equal(redemptionPaymentBlockedEvent.args[3])
    expect(redemptionPaymentBlocked.spentUnderlyingUBA).to.equal(redemptionPaymentBlockedEvent.args[5])
    // redemption payment failed
    const redemptionPaymentFailedEvent = await fixture.generateEvent('RedemptionPaymentFailed', assetManager)
    await storer.processEvent(em, redemptionPaymentFailedEvent)
    const redemptionPaymentFailed = await em.findOneOrFail(RedemptionPaymentFailed,
      { evmLog: { index: redemptionPaymentFailedEvent.logIndex, block: { index: redemptionPaymentFailedEvent.blockNumber }}},
      { populate: ['redemptionRequested'] })
    expect(redemptionPaymentFailed).to.exist
    expect(redemptionPaymentFailed.redemptionRequested.requestId).to.equal(Number(redemptionPaymentFailedEvent.args[2]))
    expect(redemptionPaymentFailed.transactionHash).to.equal(redemptionPaymentFailedEvent.args[3])
    expect(redemptionPaymentFailed.spentUnderlyingUBA).to.equal(redemptionPaymentFailedEvent.args[4])
    expect(redemptionPaymentFailed.failureReason).to.equal(redemptionPaymentFailedEvent.args[5])
  })

  it("should store all liquidation events", async () => {

  })

  describe("edge cases", () => {

    it("should be able to store collateral reserved events with same ids, from different fassets", async () => {
      const assetManagerXrp = context.getContractAddress(ASSET_MANAGER_FXRP)
      const assetManagerBtc = context.getContractAddress(ASSET_MANAGER_FBTC)
      await fixture.storeInitialAgents()
      const event1 = await fixture.generateEvent('CollateralReserved', assetManagerXrp)
      const event2 = await fixture.generateEvent('CollateralReserved', assetManagerBtc)
      event2.args[2] = event1.args[2]
      const em = context.orm.em.fork()
      await storer.processEvent(em, event1)
      await storer.processEvent(em, event2)
      const collateralReserved = await em.findOneOrFail(CollateralReserved, { fasset: FAssetType.FXRP })
      expect(collateralReserved.collateralReservationId).to.equal(Number(event1.args[2]))
      expect(collateralReserved.fasset).to.equal(FAssetType.FXRP)
      const collateralReservedBtc = await em.findOneOrFail(CollateralReserved, { fasset: FAssetType.FBTC })
      expect(collateralReservedBtc.collateralReservationId).to.equal(Number(event2.args[2]))
      expect(collateralReservedBtc.fasset).to.equal(FAssetType.FBTC)
    })

    it("should not confuse collatearl reserved from different fassets", async () => {
      const assetManagerXrp = context.getContractAddress(ASSET_MANAGER_FXRP)
      const assetManagerBtc = context.getContractAddress(ASSET_MANAGER_FBTC)
      await fixture.storeInitialAgents()
      const em = context.orm.em.fork()
      const event1 = await fixture.generateEvent('CollateralReserved', assetManagerXrp)
      await storer.processEvent(em, event1)
      await em.flush()
      const event2 = await fixture.generateEvent('MintingExecuted', assetManagerBtc)
      event2.args[1] = event1.args[2]
      expect(storer.processEvent(em, event2)).to.eventually.be.rejected
    })

    it("should not allow two events with same log index and block index", async () => {
      const event1 = await fixture.generateEvent('CollateralTypeAdded')
      const event2 = await fixture.generateEvent('CollateralTypeAdded')
      event2.logIndex = event1.logIndex
      event2.blockNumber = event1.blockNumber
      const em = context.orm.em.fork()
      await storer.processEvent(em, event1)
      await storer.processEvent(em, event2)
      const logs = await em.findAll(EvmLog)
      expect(logs).to.have.length(1)
    })

    it("should not store an event that is not processed", async () => {
      const collateralTypeAddedEvent = await fixture.generateEvent('CollateralTypeAdded')
      collateralTypeAddedEvent.name = 'ShmollateralShmypeAShmadded'
      const em = context.orm.em.fork()
      await storer.processEvent(em, collateralTypeAddedEvent)
      const evmLogs = await em.findAll(EvmLog)
      expect(evmLogs).to.be.empty
    })
  })

})