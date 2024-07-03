/* import { describe, beforeEach, afterEach, it } from "mocha"
import { expect } from "chai"
import { unlink } from "fs"
import { resolve } from "path"
import { createOrm } from "../src/database/utils"
import {
  AgentManager, AgentOwner, AgentVault
} from "../src/database/entities/agent"
import {
  CollateralReservationDeleted, CollateralReserved,
  MintingExecuted, MintingPaymentDefault
} from "../src/database/entities/events/minting"
import {
  RedemptionRequested, RedemptionPerformed, RedemptionDefault,
  RedemptionPaymentBlocked, RedemptionPaymentFailed, RedemptionRejected
} from "../src/database/entities/events/redemption"
import {
  storeAgentFixture, logFixtureToEntity,
  collateralReservedFixtureToEntity,
  mintingExecutedFixtureToEntity,
  mintingPaymentDefaultFixtureToEntity,
  collateralReservationDeletedFixtureToEntity,
  redemptionRequestedFixtureToEntity,
  redemptionPerformedFixtureToEntity,
  redemptionPaymentDefaultFixtureToEntity,
  redemptionPaymentBlockedFixtureToEntity,
  redemptionPaymentFailedFixtureToEntity,
  redemptionRejectedFixtureToEntity,
  liquidationStartedFixtureToEntity
} from "./utils"
import { randomLog } from "./fixtures/utils"
import {
  COLLATERAL_RESERVATION_DELETED, COLLATERAL_RESERVED,
  LIQUIDATION_STARTED,
  MINTING_EXECUTED, MINTING_PAYMENT_DEFAULT,
  REDEMPTION_DEFAULT,
  REDEMPTION_PAYMENT_BLOCKED,
  REDEMPTION_PAYMENT_FAILED,
  REDEMPTION_PERFORMED,
  REDEMPTION_REJECTED,
  REDEMPTION_REQUESTED
} from "../src/constants"
import { CONFIG } from "./fixtures/config"
import { AGENT_FIXTURE } from "./fixtures/agent"
import { MINTING_FIXTURE } from "./fixtures/minting"
import { REDEMPTION_FIXTURE } from "./fixtures/redemption"
import { LIQUIDATION_FIXTURE } from "./fixtures/liquidation"
import type { ORM } from "../src/database/interface"
import { LiquidationStarted } from "../src/database/entities/events/liquidation"


describe("ORM: Agent", () => {
  let orm: ORM

  beforeEach(async () => {
    orm = await createOrm(CONFIG.db, "safe")
  })

  afterEach(async () => {
    await orm.close()
    unlink(resolve(CONFIG.db.name!), () => {})
  })

  it("should test storing agent managers/owners/vaults from fixtures", async () => {
    await storeAgentFixture(orm, AGENT_FIXTURE)
    const em = orm.em.fork()
    for (const agentManagerFixture of AGENT_FIXTURE) {
      const agentManager = await em.findOneOrFail(AgentManager, { address: { hex: agentManagerFixture.address }})
      expect(agentManager).to.exist
      expect(agentManager.address).to.equal(agentManagerFixture.address)
      await agentManager.agents.load()
      // check if agent manager entity has agent owner and vaults stored
      for (const agentFixture of agentManagerFixture.agents) {
        const agentOwner = agentManager.agents.find(agent => agent.address.hex === agentFixture.address)!
        expect(agentOwner).to.exist
        expect(agentOwner.address).to.equal(agentFixture.address)
        await agentOwner.vaults.load()
        for (const vaultFixture of agentFixture.vaults) {
          const agentVault = agentOwner.vaults.find(vault => vault.address.hex === vaultFixture.address)!
          expect(agentVault).to.exist
          expect(agentVault.address).to.equal(vaultFixture.address)
          expect(agentVault.underlyingAddress).to.equal(vaultFixture.underlyingAddress)
          expect(agentVault.collateralPool).to.equal(vaultFixture.collateralPool)
        }
      }
      // check if vaults and owners are stored in the database
      for (const agentFixture of agentManager.agents) {
        const agentOwner = await em.findOneOrFail(AgentOwner, { address: agentFixture.address })
        expect(agentOwner).to.exist
        expect(agentOwner.address).to.equal(agentFixture.address)
        for (const vaultFixture of agentFixture.vaults) {
          const agentVault = await em.findOneOrFail(AgentVault, { address: vaultFixture.address })
          expect(agentVault).to.exist
          expect(agentVault.address).to.equal(vaultFixture.address)
          expect(agentVault.underlyingAddress).to.equal(vaultFixture.underlyingAddress)
          expect(agentVault.collateralPool).to.equal(vaultFixture.collateralPool)
        }
      }
    }
  })

  it("should test storing mintings from fixture", async () => {
    await storeAgentFixture(orm, AGENT_FIXTURE)
    await orm.em.transactional(async (em) => {
      for (const collateralReservedFixture of MINTING_FIXTURE.COLLATERAL_RESERVED) {
        const evmLog = logFixtureToEntity(randomLog(COLLATERAL_RESERVED))
        const collateralReserved = await collateralReservedFixtureToEntity(em, collateralReservedFixture, evmLog)
        em.persist(collateralReserved)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const mintingExecutedFixture of MINTING_FIXTURE.MINTING_EXECUTED) {
        const evmLog = logFixtureToEntity(randomLog(MINTING_EXECUTED))
        const mintingExecuted = await mintingExecutedFixtureToEntity(em, mintingExecutedFixture, evmLog)
        em.persist(mintingExecuted)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const mintingPaymentDefaultFixture of MINTING_FIXTURE.MINTING_PAYMENT_DEFAULT) {
        const evmLog = logFixtureToEntity(randomLog(MINTING_PAYMENT_DEFAULT))
        const collateralReserved = await mintingPaymentDefaultFixtureToEntity(em, mintingPaymentDefaultFixture, evmLog)
        em.persist(collateralReserved)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const mintingReservationDeleted of MINTING_FIXTURE.COLLATERAL_RESERVATION_DELETED) {
        const evmLog = logFixtureToEntity(randomLog(COLLATERAL_RESERVATION_DELETED))
        const collateralReserved = await collateralReservationDeletedFixtureToEntity(em, mintingReservationDeleted, evmLog)
        em.persist(collateralReserved)
      }
    })
    for (const collateralReservedFixture of MINTING_FIXTURE.COLLATERAL_RESERVED) {
      const collateralReserved = await orm.em.fork().findOneOrFail(CollateralReserved,
        { collateralReservationId: collateralReservedFixture.collateralReservationId },
        { populate: ["agentVault"] })
      expect(collateralReserved).to.exist
      expect(collateralReserved.collateralReservationId).to.equal(collateralReservedFixture.collateralReservationId)
      expect(collateralReserved.agentVault.address).to.equal(collateralReservedFixture.agentVault)
      expect(collateralReserved.minter).to.equal(collateralReservedFixture.minter)
      expect(collateralReserved.valueUBA).to.equal(collateralReservedFixture.valueUBA)
      expect(collateralReserved.feeUBA).to.equal(collateralReservedFixture.feeUBA)
      expect(collateralReserved.firstUnderlyingBlock).to.equal(collateralReservedFixture.firstUnderlyingBlock)
      expect(collateralReserved.lastUnderlyingBlock).to.equal(collateralReservedFixture.lastUnderlyingBlock)
      expect(collateralReserved.lastUnderlyingTimestamp).to.equal(collateralReservedFixture.lastUnderlyingTimestamp)
      expect(collateralReserved.paymentAddress).to.equal(collateralReservedFixture.paymentAddress)
      expect(collateralReserved.paymentReference).to.equal(collateralReservedFixture.paymentReference)
      expect(collateralReserved.executor).to.equal(collateralReservedFixture.executor)
      expect(collateralReserved.executorFeeNatWei).to.equal(collateralReservedFixture.executorFeeNatWei)
    }
    for (const mintingExecutedFixture of MINTING_FIXTURE.MINTING_EXECUTED) {
      const { collateralReservationId } = mintingExecutedFixture
      const mintingExecuted = await orm.em.fork().findOneOrFail(MintingExecuted,
        { collateralReserved: { collateralReservationId: collateralReservationId }},
        { populate: ["collateralReserved"] })
      expect(mintingExecuted).to.exist
      expect(mintingExecuted.poolFeeUBA).to.equal(mintingExecutedFixture.poolFeeUBA)
      expect(mintingExecuted.collateralReserved.collateralReservationId)
        .to.equal(collateralReservationId)
    }
    for (const mintingPaymentDefaultFixture of MINTING_FIXTURE.MINTING_PAYMENT_DEFAULT) {
      const { collateralReservationId } = mintingPaymentDefaultFixture
      const mintingPaymentDefault = await orm.em.fork().findOneOrFail(MintingPaymentDefault,
        { collateralReserved: { collateralReservationId: collateralReservationId }},
        { populate: ["collateralReserved"] })
      expect(mintingPaymentDefault).to.exist
      expect(mintingPaymentDefault.collateralReserved.collateralReservationId)
        .to.equal(collateralReservationId)
    }
    for (const collateralReservationDeletedFixture of MINTING_FIXTURE.COLLATERAL_RESERVATION_DELETED) {
      const { collateralReservationId } = collateralReservationDeletedFixture
      const collateralReservationDeleted = await orm.em.fork().findOneOrFail(
        CollateralReservationDeleted,
        { collateralReserved: { collateralReservationId: collateralReservationId }},
        { populate: ["collateralReserved"] })
      expect(collateralReservationDeleted).to.exist
      expect(collateralReservationDeleted.collateralReserved.collateralReservationId)
        .to.equal(collateralReservationId)
    }
  })

  it.only("should test storing redemptions from fixture", async () => {
    await storeAgentFixture(orm, AGENT_FIXTURE)
    await orm.em.transactional(async (em) => {
      for (const redemptionRequestedFixture of REDEMPTION_FIXTURE.REDEMPTION_REQUESTED) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_REQUESTED))
        const redemptionRequested = await redemptionRequestedFixtureToEntity(em, redemptionRequestedFixture, evmLog)
        em.persist(redemptionRequested)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const redemptionPerformedFixture of REDEMPTION_FIXTURE.REDEMPTION_PERFORMED) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_PERFORMED))
        const redemptionPerformed = await redemptionPerformedFixtureToEntity(em, redemptionPerformedFixture, evmLog)
        em.persist(redemptionPerformed)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const redemptionDefaultFixture of REDEMPTION_FIXTURE.REDEMPTION_DEFAULT) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_DEFAULT))
        const redemptionPaymentDefault = await redemptionPaymentDefaultFixtureToEntity(em, redemptionDefaultFixture, evmLog)
        em.persist(redemptionPaymentDefault)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const redemptionPaymentBlockedFixture of REDEMPTION_FIXTURE.REDEMPTION_PAYMENT_BLOCKED) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_PAYMENT_BLOCKED))
        const redemptionPaymentBlocked = await redemptionPaymentBlockedFixtureToEntity(em, redemptionPaymentBlockedFixture, evmLog)
        em.persist(redemptionPaymentBlocked)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const redemptionPaymentFailedFixture of REDEMPTION_FIXTURE.REDEMPTION_PAYMENT_FAILED) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_PAYMENT_FAILED))
        const redemptionPaymentFailed = await redemptionPaymentFailedFixtureToEntity(em, redemptionPaymentFailedFixture, evmLog)
        em.persist(redemptionPaymentFailed)
      }
    })
    await orm.em.transactional(async (em) => {
      for (const redemptionRejectedFixture of REDEMPTION_FIXTURE.REDEMPTION_REJECTED) {
        const evmLog = logFixtureToEntity(randomLog(REDEMPTION_REJECTED))
        const redemptionRejected = await redemptionRejectedFixtureToEntity(em, redemptionRejectedFixture, evmLog)
        em.persist(redemptionRejected)
      }
    })
    for (const redemptionRequestedFixture of REDEMPTION_FIXTURE.REDEMPTION_REQUESTED) {
      const redemptionRequested = await orm.em.fork().findOneOrFail(RedemptionRequested,
        { requestId: redemptionRequestedFixture.requestId },
        { populate: ["agentVault"] })
      expect(redemptionRequested).to.exist
      expect(redemptionRequested.requestId).to.equal(redemptionRequestedFixture.requestId)
      expect(redemptionRequested.agentVault.address).to.equal(redemptionRequestedFixture.agentVault)
      expect(redemptionRequested.redeemer).to.equal(redemptionRequestedFixture.redeemer)
      expect(redemptionRequested.paymentAddress).to.equal(redemptionRequestedFixture.paymentAddress)
      expect(redemptionRequested.valueUBA).to.equal(redemptionRequestedFixture.valueUBA)
      expect(redemptionRequested.feeUBA).to.equal(redemptionRequestedFixture.feeUBA)
      expect(redemptionRequested.firstUnderlyingBlock).to.equal(redemptionRequestedFixture.firstUnderlyingBlock)
      expect(redemptionRequested.lastUnderlyingBlock).to.equal(redemptionRequestedFixture.lastUnderlyingBlock)
      expect(redemptionRequested.lastUnderlyingTimestamp).to.equal(redemptionRequestedFixture.lastUnderlyingTimestamp)
      expect(redemptionRequested.paymentReference).to.equal(redemptionRequestedFixture.paymentReference)
      expect(redemptionRequested.executor).to.equal(redemptionRequestedFixture.executor)
      expect(redemptionRequested.executorFeeNatWei).to.equal(redemptionRequestedFixture.executorFeeNatWei)
    }
    for (const redemptionPerformedFixture of REDEMPTION_FIXTURE.REDEMPTION_PERFORMED) {
      const { requestId } = redemptionPerformedFixture
      const redemptionPerformed = await orm.em.fork().findOneOrFail(RedemptionPerformed,
        { redemptionRequested: { requestId: requestId }},
        { populate: ["redemptionRequested"] })
      expect(redemptionPerformed).to.exist
      expect(redemptionPerformed.redemptionRequested.requestId).to.equal(requestId)
      expect(redemptionPerformed.transactionHash).to.equal(redemptionPerformedFixture.transactionHash)
      //expect(redemptionPerformed.spentUnderlyingUBA).to.equal(redemptionPerformedFixture.spentUnderlyingUBA)
    }
    for (const redemptionDefaultFixture of REDEMPTION_FIXTURE.REDEMPTION_DEFAULT) {
      const { requestId } = redemptionDefaultFixture
      const redemptionDefault = await orm.em.fork().findOneOrFail(RedemptionDefault,
        { redemptionRequested: { requestId: requestId }},
        { populate: ["redemptionRequested"] })
      expect(redemptionDefault).to.exist
      expect(redemptionDefault.redeemedPoolCollateralWei).to.equal(redemptionDefaultFixture.redeemedPoolCollateralWei)
      expect(redemptionDefault.redeemedVaultCollateralWei).to.equal(redemptionDefaultFixture.redeemedVaultCollateralWei)
      expect(redemptionDefault.redemptionRequested.requestId).to.equal(requestId)
    }
    for (const redemptionPaymentBlockedFixture of REDEMPTION_FIXTURE.REDEMPTION_PAYMENT_BLOCKED) {
      const { requestId } = redemptionPaymentBlockedFixture
      const redemptionPaymentBlocked = await orm.em.fork().findOneOrFail(RedemptionPaymentBlocked,
        { redemptionRequested: { requestId: requestId }},
        { populate: ["redemptionRequested"] })
      expect(redemptionPaymentBlocked).to.exist
      expect(redemptionPaymentBlocked.transactionHash).to.equal(redemptionPaymentBlockedFixture.transactionHash)
      //expect(redemptionPaymentBlocked.spentUnderlyingUBA).to.equal(redemptionPaymentBlockedFixture.spentUnderlyingUBA)
      expect(redemptionPaymentBlocked.redemptionRequested.requestId).to.equal(requestId)
    }
    for (const redemptionPaymentFailedFixture of REDEMPTION_FIXTURE.REDEMPTION_PAYMENT_FAILED) {
      const { requestId } = redemptionPaymentFailedFixture
      const redemptionPaymentFailed = await orm.em.fork().findOneOrFail(RedemptionPaymentFailed,
        { redemptionRequested: { requestId: requestId }},
        { populate: ["redemptionRequested"] })
      expect(redemptionPaymentFailed).to.exist
      expect(redemptionPaymentFailed.transactionHash).to.equal(redemptionPaymentFailedFixture.transactionHash)
      //expect(redemptionPaymentFailed.spentUnderlyingUBA).to.equal(redemptionPaymentFailedFixture.spentUnderlyingUBA)
      expect(redemptionPaymentFailed.redemptionRequested.requestId).to.equal(requestId)
    }
    for (const redemptionRejectedFixture of REDEMPTION_FIXTURE.REDEMPTION_REJECTED) {
      const { requestId } = redemptionRejectedFixture
      const redemptionRejected = await orm.em.fork().findOneOrFail(RedemptionRejected,
        { redemptionRequested: { requestId: requestId }},
        { populate: ["redemptionRequested"] })
      expect(redemptionRejected).to.exist
      expect(redemptionRejected.redemptionRequested.requestId).to.equal(requestId)
    }
  })

  it("should test liquidation from entities", async () => {
    await storeAgentFixture(orm, AGENT_FIXTURE)
    await orm.em.transactional(async (em) => {
      for (const liquidationStartedFixture of LIQUIDATION_FIXTURE.LIQUIDATION_STARTED) {
        const evmLog = logFixtureToEntity(randomLog(LIQUIDATION_STARTED))
        const liquidationStarted = await liquidationStartedFixtureToEntity(em, liquidationStartedFixture, evmLog)
        em.persist(liquidationStarted)
      }
    })
    const liquidationStarted = await orm.em.fork().findOneOrFail(LiquidationStarted, {
      agentVault: { address: { hex: LIQUIDATION_FIXTURE.LIQUIDATION_STARTED[0].agentVault }}
    })
    console.log(liquidationStarted)
  })
}) */