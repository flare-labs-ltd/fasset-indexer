import { createOrm } from "../../database/utils"
import { EvmLog } from "../../database/entities/evm/log"
import { AgentVaultInfo } from "../../database/entities/state/agent"
import { DuplicatePaymentConfirmed, IllegalPaymentConfirmed, UnderlyingBalanceTooLow } from "../../database/entities/events/challenge"
import { ConfigLoader } from "../../config"
import { EVENTS } from "../../config/constants"
import type { ORM } from "../../database/interface"


export class NotificationAnalytics {
  constructor(public readonly orm: ORM) {}

  async create(loader: ConfigLoader): Promise<NotificationAnalytics> {
    const orm = await createOrm(loader.dbConfig, 'safe')
    return new NotificationAnalytics(orm)
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

  async lastCollateralPoolClaim(pool: string): Promise<number> {
    const last = await this.orm.em.fork().find(EvmLog,
      { name: EVENTS.COLLATERAL_POOL.EXIT, address: { hex: pool }},
      { orderBy: { block: 'desc' }, populate: ['block'], limit: 1 }
    )
    return last[0]?.block.timestamp ?? 0
  }
}