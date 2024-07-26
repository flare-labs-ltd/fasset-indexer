import { getOrmConfig } from "../config/utils"
import { createOrm } from "../database/utils"
import { getVar } from "../indexer/shared"
import { EvmLog } from "../database/entities/logs"
import { AgentVault } from "../database/entities/agent"
import { CollateralReserved, MintingExecuted } from "../database/entities/events/minting"
import { RedemptionPerformed, RedemptionRequested } from "../database/entities/events/redemption"
import { FullLiquidationStarted, LiquidationPerformed } from "../database/entities/events/liquidation"
import { END_EVENT_BLOCK__UPDATE_1, FIRST_UNHANDLED_EVENT_BLOCK, FIRST_UNHANDLED_EVENT_BLOCK__UPDATE_1, MAX_DATABASE_ENTRIES_FETCH } from "../config/constants"
import type { ORM } from "../database/interface"
import type { IUserDatabaseConfig } from "../config/interface"


export class Analytics {

  constructor(public readonly orm: ORM) {}

  static async create(config: IUserDatabaseConfig): Promise<Analytics> {
    const ormOptions = getOrmConfig(config)
    const orm = await createOrm(ormOptions, "safe")
    return new Analytics(orm)
  }

  ///////////////////////////////////////////////////////////////
  // metadata

  async currentBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async blocksToBackSync(): Promise<number | null> {
    const start = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK__UPDATE_1)
    if (start === null || start.value === undefined) return null
    const end = await getVar(this.orm.em.fork(), END_EVENT_BLOCK__UPDATE_1)
    if (end === null || end.value === undefined)  return null
    return parseInt(end.value) - parseInt(start.value) + 1
  }

  async logsWithoutSenders(): Promise<number> {
    const qb = this.orm.em.qb(EvmLog, 'o')
    qb.select('o').where({ transactionSource: null })
    const result = await qb.count('o.id').execute()
    return result[0].count
  }

  async agentsWithoutCPT(): Promise<number> {
    const qb = this.orm.em.qb(AgentVault, 'o')
    qb.select('o').where({ collateralPoolToken: null })
    const result = await qb.count('o.address_id').execute()
    return result[0].count
  }

  //////////////////////////////////////////////////////////////
  // mintings

  async totalReserved(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(cr.value_uba) as total
      FROM collateral_reserved cr
    `)
    return result[0].total
  }

  async totalMinted(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(cr.value_uba) as total
      FROM minting_executed me
      INNER JOIN collateral_reserved cr ON me.collateral_reserved_collateral_reservation_id = cr.collateral_reservation_id
    `)
    return result[0].total
  }

  async totalMintingDefaulted(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(cr.value_uba) as total
      FROM minting_payment_default mpd
      INNER JOIN collateral_reserved cr ON mpd.collateral_reserved_collateral_reservation_id = cr.collateral_reservation_id
    `)
    return result[0].total
  }

  //////////////////////////////////////////////////////////////////
  // redemptions

  async totalRedemptionRequested(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(value_uba) as total
      FROM redemption_requested
    `)
    return result[0].total
  }

  async totalRedeemed(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(rr.value_uba) as total
      FROM redemption_requested rr
      INNER JOIN redemption_performed rp ON rp.redemption_requested_request_id = rr.request_id
    `)
    return result[0].total
  }

  async totalRedemptionDefaulted(): Promise<bigint> {
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(rr.value_uba) as total
      FROM redemption_requested rr
      INNER JOIN redemption_default rd ON rd.redemption_requested_request_id = rr.request_id
    `)
    return result[0].total
  }

  async totalRedemptionRequesters(): Promise<number> {
    const qb = this.orm.em.qb(RedemptionRequested, 'o')
    const result = await qb.count('o.redeemer', true).execute()
    return result[0].count
  }

  async totalCollateralReservers(): Promise<number> {
    const qb = this.orm.em.qb(CollateralReserved, 'o')
    const result = await qb.count('o.minter', true).execute()
    return result[0].count
  }

  async totalLiquidators(): Promise<number> {
    const qb = this.orm.em.qb(LiquidationPerformed, 'o')
    const result = await qb.count('o.liquidator', true).execute()
    return result[0].count
  }

  async redemptionRequestFromSecondsAgo(seconds: number): Promise<number> {
    const timestamp = Date.now() / 1000 - seconds
    const result = await this.orm.em.getConnection('read').execute(`
      SELECT COUNT(rr.request_id) AS count
      FROM redemption_requested rr
      INNER JOIN evm_log el
      ON rr.evm_log_id = el.id
      WHERE el.timestamp >= ${timestamp}
    `)
    return result[0].count
  }

  async fullLiquidations(): Promise<FullLiquidationStarted[]> {
    return this.orm.em.fork().findAll(FullLiquidationStarted,
      { populate: ['agentVault'], limit: MAX_DATABASE_ENTRIES_FETCH })
  }

  async liquidations(): Promise<LiquidationPerformed[]> {
    return this.orm.em.fork().find(LiquidationPerformed,
      { valueUBA: { $gt: 0 } },
      { populate: ['agentVault'], limit: MAX_DATABASE_ENTRIES_FETCH }
    )
  }

  ////////////////////////////////////////////////////////////////////
  // agent specific (liquidation count, mint count, redeem count, percent of successful redemptions

  async agentCollateralReservationCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(CollateralReserved, 'o')
    qb.select('o.collateral_reservation_id').where({ agentVault: { address: agentAddress }})
    const result = await qb.count('o.collateral_reservation_id').execute()
    return result[0].count
  }

  async agentMintingExecutedCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(MintingExecuted, 'o')
    qb.select('o.collateral_reserved_collateral_reservation_id')
      .where({ collateralReserved: { agentVault: { address: agentAddress }}})
    const result = await qb.count('o.collateral_reserved_collateral_reservation_id').execute()
    return result[0].count
  }

  async agentRedemptionRequestCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(RedemptionRequested, 'o')
    qb.select('o.request_id').where({ agentVault: { address: agentAddress }})
    const result = await qb.count('o.request_id').execute()
    return result[0].count
  }

  async agentRedemptionPerformedCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(RedemptionPerformed, 'o')
    qb.select('o.redemption_requested_request_id')
      .where({ redemptionRequested: { agentVault: { address: agentAddress }}})
    const result = await qb.count('o.redemption_requested_request_id').execute()
    return result[0].count
  }

  async agentRedemptionSuccessRate(agentAddress: string): Promise<number> {
    const requested = await this.agentRedemptionRequestCount(agentAddress)
    const executed = await this.agentRedemptionPerformedCount(agentAddress)
    return requested > 0 ? executed / requested : 0
  }

  async agentLiquidationCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(LiquidationPerformed, 'o')
    qb.select('o.id').where({ agentVault: { address: agentAddress }, valueUBA: { $gt: 0 } })
    const result = await qb.count('o.id').execute()
    return result[0].count
  }


  //////////////////////////////////////////////////////////////////////
  // user specific

}