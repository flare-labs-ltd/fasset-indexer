import { raw } from "@mikro-orm/core"
import { FAssetEventBound, FAssetType } from "../database/entities/events/_bound"
import { MintingExecuted } from "../database/entities/events/minting"
import { RedemptionRequested } from "../database/entities/events/redemption"
import { CollateralPoolExited } from "../database/entities/events/collateralPool"
import { COLLATERAL_POOL_PORTFOLIO_SQL } from "./rawSql"
import { MIN_EVM_BLOCK_TIMESTAMP } from "../config/constants"
import type { SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../database/interface"
import type { TimeSeries } from "./interface"


/**
 * DashboardAnalytics provides a set of analytics functions for the FAsset UI's dashboard.
 * It is seperated in case of UI's opensource release, and subsequent simplified indexer deployment.
 */
export abstract class DashboardAnalytics {
  constructor(public readonly orm: ORM) { }

  //////////////////////////////////////////////////////////////////////
  // collateral pool activity

  async poolTransactionCount(): Promise<number> {
    const entered = await this.orm.em.count(CollateralPoolExited)
    const exited = await this.orm.em.count(CollateralPoolExited)
    return entered + exited
  }

  async userCollateralPoolTokenPortfolio(user: string): Promise<
    { collateralPoolToken: string, balance: bigint }[]
  > {
    const con = this.orm.em.getConnection('read')
    const res = await con.execute(COLLATERAL_POOL_PORTFOLIO_SQL(user))
    // @ts-ignore
    return res.map(x => ({ collateralPoolToken: x.cpt_address, balance: x.balance }))
  }

  async totalClaimedPoolFees(): Promise<
    { fasset: FAssetType, claimedUBA: bigint }[]
  > {
    return this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimedUBA')])
      .groupBy('cpe.fasset')
      .execute()
  }

  async totalClaimedPoolFeesByUser(user: string): Promise<
    { fasset: FAssetType, claimedUBA: bigint }[]
  > {
    return this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimedUBA')])
      .join('cpe.tokenHolder', 'th')
      .where({ 'th.hex': user })
      .groupBy('cpe.fasset')
      .execute()
  }

  async totalClaimedPoolFeesByPoolAndUser(pool: string, user: string): Promise<bigint> {
    const resp = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(raw('SUM(received_fasset_fees_uba) as claimedUBA'))
      .join('cpe.tokenHolder', 'th')
      .join('cpe.evmLog', 'el')
      .join('el.address', 'ela')
      .where({
        'ela.hex': pool,
        'th.hex': user
      })
      .execute()
    // @ts-ignore - bigint
    return resp[0]?.claimedUBA || BigInt(0)
  }

  //////////////////////////////////////////////////////////////////////
  // price graphs

  async mintedTimeSeries(end: number, npoints: number, start?: number): Promise<TimeSeries> {
    const em = this.orm.em.fork()
    return this.getTimeSeries(
      ($gt, $lt) => em.createQueryBuilder(MintingExecuted, 'me')
        .select(['me.fasset', raw('SUM(cr.value_uba) as value')])
        .join('me.collateralReserved', 'cr')
        .join('me.evmLog', 'el')
        .join('el.block', 'block')
        .where({ 'block.timestamp': { $gt, $lt }})
        .groupBy('fasset'),
      end, npoints, start
    )
  }

  async redeemedTimeSeries(_start: number, end: number, npoints: number): Promise<TimeSeries> {
    const em = this.orm.em.fork()
    return this.getTimeSeries(
      ($gt, $lt) => em.createQueryBuilder(RedemptionRequested, 'rr')
        .select(['rr.fasset', raw('SUM(rr.value_uba) as value')])
        .join('me.evmLog', 'log')
        .join('log.block', 'block')
        .where({ 'block.timestamp': { $gt, $lt }})
        .groupBy('fasset'),
      end, npoints
    )
  }

  private async getTimeSeries<T extends FAssetEventBound>(
    query: (si: number, ei: number) => SelectQueryBuilder<T>,
    end: number, npoints: number, start?: number
  ): Promise<TimeSeries> {
    if (start === undefined) {
      start = MIN_EVM_BLOCK_TIMESTAMP
    }
    const interval = (end - start) / npoints
    const data = this.timeSeriesTemplate()
    for (let i = 0; i < npoints; i++) {
      const si = start + i * interval
      const ei = start + (i + 1) * interval
      const results = await query(si, ei).execute()
      for (const result of results) {
        // @ts-ignore - minted_uba
        const value = result.value
        data[result.fasset].push({ start: si, end: ei, value })
      }
    }
    return data
  }

  private timeSeriesTemplate(): TimeSeries {
    return {
      [FAssetType.FXRP]: [],
      [FAssetType.FBTC]: [],
      [FAssetType.FDOGE]: [],
      [FAssetType.FLTC]: [],
      [FAssetType.FALG]: [],
      [FAssetType.FSIMCOINX]: [],
    }
  }
}