import { createOrm } from "../database/utils"
import { getVar } from "../utils"
import { EvmLog } from "../database/entities/evm/log"
import { AgentVaultInfo } from "../database/entities/state/agent"
import { CollateralReserved, MintingExecuted } from "../database/entities/events/minting"
import { RedemptionDefault, RedemptionPerformed, RedemptionRequested } from "../database/entities/events/redemption"
import { FullLiquidationStarted, LiquidationPerformed } from "../database/entities/events/liquidation"
import { DuplicatePaymentConfirmed, IllegalPaymentConfirmed, UnderlyingBalanceTooLow } from "../database/entities/events/challenge"
import { DashboardAnalytics } from "./dashboard"
import {
  FIRST_UNHANDLED_EVENT_BLOCK, FIRST_UNHANDLED_EVENT_BLOCK_FOR_CURRENT_UPDATE, END_EVENT_BLOCK_FOR_CURRENT_UPDATE,
  MAX_DATABASE_ENTRIES_FETCH,
  FIRST_UNHANDLED_BTC_BLOCK,
  EVENTS
} from "../config/constants"
import type { ORM } from "../database/interface"
import type { IUserDatabaseConfig } from "../config/interface"
import type { FAssetType } from "../shared"


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

  async totalUiRelevantTransactions(): Promise<number> {
    const qb = this.orm.em.qb(EvmLog)
    const result = await qb.count().where({ name: {
      $in: [
        EVENTS.COLLATERAL_POOL_EXIT,
        EVENTS.COLLATERAL_POOL_ENTER,
        EVENTS.REDEMPTION_REQUESTED,
        EVENTS.COLLATERAL_RESERVED
      ]
    }}).execute()
    return result[0].count
  }

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

  //////////////////////////////////////////////////////////////////////
  // selectors

  async redemptionDefault(id: number, fasset: FAssetType): Promise<RedemptionDefault | null> {
    const em = this.orm.em.fork()
    const redemptionDefault = await em.findOne(RedemptionDefault,
      { fasset: fasset, redemptionRequested: { requestId: id }},
      { populate: [
        'redemptionRequested.redeemer',
        'redemptionRequested.paymentAddress',
        'redemptionRequested.agentVault.address',
        'redemptionRequested.agentVault.underlyingAddress',
        'redemptionRequested.executor'
      ]}
    )
    return redemptionDefault
  }

  ////////////////////////////////////////////////////////////////////
  // agent specific (liquidation count, mint count, redeem count, percent of successful redemptions

  async agentCollateralReservationCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(CollateralReserved)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}})
    const result = await qb.execute()
    return result[0].count
  }

  async agentMintingExecutedCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(MintingExecuted)
    qb.count().where({ collateralReserved: { agentVault: { address: { hex: agentAddress }}}})
    const result = await qb.execute()
    return result[0].count
  }

  async agentRedemptionRequestCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(RedemptionRequested)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}})
    const result = await qb.execute()
    return result[0].count
  }

  async agentRedemptionPerformedCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(RedemptionPerformed)
    qb.count().where({ redemptionRequested: { agentVault: { address: { hex: agentAddress }}}})
    const result = await qb.execute()
    return result[0].count
  }

  async agentRedemptionSuccessRate(agentAddress: string): Promise<number> {
    const requested = await this.agentRedemptionRequestCount(agentAddress)
    const executed = await this.agentRedemptionPerformedCount(agentAddress)
    return Number(requested) > 0 ? Number(executed) / Number(requested) : 0
  }

  async agentLiquidationCount(agentAddress: string): Promise<number> {
    const qb = this.orm.em.fork().qb(LiquidationPerformed)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}, valueUBA: { $gt: 0 } })
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

/*   async getBalance(token: string, address: string) {
    const em = this.orm.em.fork()
    const balance = await em.findOne(TokenBalance, { token: { hex: token }, holder: { hex: address }})
    console.log(balance)
    const balance2 = await em.createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as balance')])
      .join('evmLog', 'l')
      .join('t.from', 'ad')
      .join('l.address', 'tk')
      .where({ 'tk.hex': token, 'ad.hex': address })
      .execute()
    const balance3 = await em.createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as balance')])
      .join('evmLog', 'l')
      .join('t.to', 'ad')
      .join('l.address', 'tk')
      .where({ 'tk.hex': token, 'ad.hex': address })
      .execute()
    // @ts-ignore
    console.log(balance3[0].balance - balance2[0].balance)
  } */
}

/* import { Context } from "../context/context"
import { config } from "../config/config"
import { ERC20Transfer } from "../database/entities/events/token"
import { raw } from "@mikro-orm/core"
async function main() {
  const context = await Context.create(config)
  const analytics = new Analytics(context.orm)
  const resp = await analytics.totalClaimedPoolFeesByPoolAndUser(
    '0xE4EC8B31Ac446EC57b1063C978b818F3c2c2889E',
    '0x28637E84DeeB3499BCE0c3dA7C708823f354eF9C'
  )
  //const resp7 = await analytics.totalClaimedPoolFeesAggregateTimespan([1728751614, 1730100814])
  //console.log(resp7)
  await analytics.getBalance('0x51B1ac96027e55c29Ece8a6fD99DdDdd01F22F6c', '0xe2465d57a8719B3f0cCBc12dD095EFa1CC55A997')

  await context.orm.close()
}

main() */