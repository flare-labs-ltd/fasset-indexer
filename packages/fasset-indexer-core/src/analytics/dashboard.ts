import { raw } from "@mikro-orm/core";
import { FAssetType } from "../database/entities/events/_bound";
import { CollateralPoolEntered, CollateralPoolExited } from "../database/entities/events/collateralPool";
import type { ORM } from "../database/interface"
import { COLLATERAL_POOL_PORTFOLIO_SQL } from "./rawSql";


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

  async mintValueGraph(period: number): Promise<{ timestamp: number, value: bigint }[]> {

  }
}