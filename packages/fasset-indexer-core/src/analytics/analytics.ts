import { createOrm } from "../database/utils"
import { getVar } from "../utils"
import { EvmLog } from "../database/entities/evm/log"
import { AgentVaultInfo } from "../database/entities/state/agent"
import { CollateralReserved, MintingExecuted } from "../database/entities/events/minting"
import { RedemptionRequested } from "../database/entities/events/redemption"
import { FullLiquidationStarted, LiquidationPerformed } from "../database/entities/events/liquidation"
import { DuplicatePaymentConfirmed, IllegalPaymentConfirmed, UnderlyingBalanceTooLow } from "../database/entities/events/challenge"
import { DashboardAnalytics } from "./dashboard"
import {
  FIRST_UNHANDLED_EVENT_BLOCK,
  FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE,
  END_EVENT_BLOCK_FOR_CURRENT_UPDATE,
  MAX_DATABASE_ENTRIES_FETCH,
  FIRST_UNHANDLED_BTC_BLOCK
} from "../config/constants"
import type { ORM } from "../database/interface"
import type { IUserDatabaseConfig } from "../config/interface"


export class Analytics extends DashboardAnalytics {

  constructor(public readonly orm: ORM) {
    super(orm)
  }

  async create(config: IUserDatabaseConfig): Promise<Analytics> {
    const orm = await createOrm(config, 'safe')
    return new Analytics(orm)
  }

  ///////////////////////////////////////////////////////////////
  // metadata

  async currentBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async currentBtcBlock(): Promise<number | null> {
    const v = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_BTC_BLOCK)
    return (v && v.value) ? parseInt(v.value) : null
  }

  async blocksToBackSync(): Promise<number | null> {
    const start = await getVar(this.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE)
    if (start === null || start.value === undefined) return null
    const end = await getVar(this.orm.em.fork(), END_EVENT_BLOCK_FOR_CURRENT_UPDATE)
    if (end === null || end.value === undefined)  return null
    return parseInt(end.value) - parseInt(start.value) + 1
  }

  //////////////////////////////////////////////////////////////////////
  // aggregators

  async totalRedemptionRequesters(): Promise<number> {
    const qb = this.orm.em.qb(RedemptionRequested, 'r')
    const result = await qb.count('r.redeemer', true).execute()
    return result[0].count
  }

  async totalCollateralReservers(): Promise<number> {
    const qb = this.orm.em.qb(CollateralReserved, 'c')
    const result = await qb.count('c.minter', true).execute()
    return result[0].count
  }

  async totalLiquidators(): Promise<number> {
    const qb = this.orm.em.qb(LiquidationPerformed, 'l')
    const result = await qb.count('l.liquidator', true).execute()
    return result[0].count
  }

  //////////////////////////////////////////////////////////////////////
  // liquidation data

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
    const qb = this.orm.em.fork().qb(CollateralReserved)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}})
    const result = await qb.execute()
    return result[0].count
  }

  ////////////////////////////////////////////////////////////////////
  // executor

  async executorRedemptionRequests(executor: string): Promise<number> {
    const qb = this.orm.em.fork().qb(RedemptionRequested)
    qb.count().where({ executor: { hex: executor }})
    const result = await qb.execute()
    return result[0].count
  }

  async executorMintingPerformed(executor: string): Promise<number> {
    const qb = this.orm.em.fork().qb(MintingExecuted)
    qb.count().where({ collateralReserved: { executor: { hex: executor }}})
    const result = await qb.execute()
    return result[0].count
  }

  async totalMintingExecutions(): Promise<number> {
    const qb = this.orm.em.fork().qb(MintingExecuted)
    const result = await qb.count().execute()
    return result[0].count
  }

  //////////////////////////////////////////////////////////////////////
  // system health

  async totalFreeLots(): Promise<{
    publicLots: bigint,
    privateLots: bigint,
    liquidationLots: bigint,
    normalLots: bigint
  }> {
    const publicLots = await this._totalFreeLots(true)
    const privateLots = await this._totalFreeLots(false)
    const liquidationLots = await this._totalFreeLots(undefined, true)
    const normalLots = await this._totalFreeLots(undefined, false)
    return { publicLots, privateLots, liquidationLots, normalLots }
  }

  private async _totalFreeLots(publicAgents?: boolean, inLiquidation?: boolean): Promise<bigint> {
    const publicFilter = (publicAgents !== undefined) ? `AND avi.publicly_available = ${publicAgents}` : ""
    const liquidationFilter = (inLiquidation !== undefined) ? `AND avi.status ${inLiquidation ? `> 0`: `= 0`}` : ""
    const em = this.orm.em.fork()
    const result = await em.getConnection('read').execute(`
      SELECT SUM(avi.free_collateral_lots) as total
      FROM agent_vault_info avi
      INNER JOIN agent_vault av ON avi.agent_vault_address_id = av.address_id
      WHERE av.destroyed = FALSE ${publicFilter} ${liquidationFilter}
    `)
    return result[0].total
  }

  async agentsInLiquidation(): Promise<[number, number]> {
    const nAgentsInLiquidation = await this.orm.em.fork().count(AgentVaultInfo, { status: 2 })
    const nAgents = await this.orm.em.fork().count(AgentVaultInfo)
    return [nAgentsInLiquidation, nAgents]
  }

  async eventsPerInterval(seconds: number = 60): Promise<number> {
    return this.orm.em.fork().count(EvmLog, { block: { timestamp: { $gt: Date.now() / 1000 - seconds }}})
  }

  async fullLiquidationReason(agent: string): Promise<IllegalPaymentConfirmed | DuplicatePaymentConfirmed | UnderlyingBalanceTooLow | null> {
    const em = this.orm.em.fork()
    const illegal = await em.findOne(IllegalPaymentConfirmed, { agentVault: { address: { hex: agent }}},
      { populate: ['evmLog.block', 'agentVault.address', 'agentVault.underlyingAddress'] }
    )
    if (illegal) return illegal
    const duplicate = await em.findOne(DuplicatePaymentConfirmed, { agentVault: { address: { hex: agent }}},
      { populate: ['evmLog.block', 'agentVault.address', 'agentVault.underlyingAddress'] }
    )
    if (duplicate) return duplicate
    const balance = await em.findOne(UnderlyingBalanceTooLow, { agentVault: { address: { hex: agent }}},
      { populate: ['evmLog.block', 'agentVault.address', 'agentVault.underlyingAddress'] }
    )
    return balance
  }
}

/* import { Context } from "../context/context"
import { config } from "../config/config"
async function main() {
  const context = await Context.create(config)
  const analytics = new Analytics(context.orm)
  const resp = await analytics.totalClaimedPoolFees(
    '0xE4EC8B31Ac446EC57b1063C978b818F3c2c2889E',
    '0xe2465d57a8719B3f0cCBc12dD095EFa1CC55A997'
  )
  console.log(resp)
  const resp1 = await analytics.totalClaimedPoolFees('0xE4EC8B31Ac446EC57b1063C978b818F3c2c2889E')
  console.log(resp1)
  const resp2 = await analytics.totalClaimedPoolFees(undefined, '0xe2465d57a8719B3f0cCBc12dD095EFa1CC55A997')
  console.log(resp2)
  const resp3 = await analytics.totalClaimedPoolFees()
  console.log(resp3)
  await context.orm.close()
}

main() */