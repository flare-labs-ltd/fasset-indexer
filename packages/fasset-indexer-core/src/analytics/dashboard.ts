import { raw } from "@mikro-orm/core"
import { ZeroAddress } from "ethers"
import { FAsset, FAssetType } from "../shared"
import { EvmAddress } from "../database/entities/address"
import { ERC20Transfer } from "../database/entities/events/token"
import { FAssetEventBound } from "../database/entities/events/_bound"
import { MintingExecuted } from "../database/entities/events/minting"
import { RedemptionRequested } from "../database/entities/events/redemption"
import { CollateralPoolExited } from "../database/entities/events/collateralPool"
import { fassetToUsdPrice } from "./utils"
import { ContractLookup } from "../context/contracts"
import { MIN_EVM_BLOCK_TIMESTAMP, PRICE_FACTOR } from "../config/constants"
import { BEST_COLLATERAL_POOLS, COLLATERAL_POOL_PORTFOLIO_SQL } from "./rawSql"
import type { SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../database/interface"
import type { AggregateTimeSeries, ClaimedFees, FAssetDiffs, FAssetHolderCount, PoolScore, TimeSeries, TokenPortfolio } from "./interface"
import { TokenBalance } from "../database/entities/state/balance"

/**
 * DashboardAnalytics provides a set of analytics functions for the FAsset UI's dashboard.
 * It is seperated in case of UI's opensource release, and subsequent simplified indexer deployment.
 */
export abstract class DashboardAnalytics {
  contracts: ContractLookup

  constructor(public readonly orm: ORM) {
    this.contracts = new ContractLookup()
  }

  async fAssetholderCount(): Promise<FAssetHolderCount> {
    const res = await this.orm.em.createQueryBuilder(TokenBalance, 'tb')
      .select(['tk.hex as token_address', raw('COUNT(DISTINCT tb.holder_id) as n_token_holders')])
      .join('tb.token', 'tk')
      .where({ 'tb.amount': { $gt: 0 }, 'tk.hex': { $in: this.contracts.fassetTokens }})
      .groupBy('tk.hex')
      .execute()
    const ret: FAssetHolderCount = []
    for (const r of res) {
      // @ts-ignore
      const address = r.token_address
      if (!address) continue
      // @ts-ignore
      const nholders = Number(r.n_token_holders || 0)
      const fasset = this.contracts.fAssetAddressToFAssetType(address)
      ret.push({ fasset: FAssetType[fasset] as FAsset, nholders })
    }
    return ret
  }

  ///////////////////////////////////////////////////////////////
  // diffs

  async fAssetSupplyDiff(compareBefore: number, compareAfter: number): Promise<FAssetDiffs> {
    const ret = [] as FAssetDiffs
    const em = this.orm.em.fork()
    const zeroAddress = await em.findOne(EvmAddress, { hex: ZeroAddress })
    if (zeroAddress === null) return ret
    for (const fassetType in FAssetType) {
      const fasset = FAssetType[fassetType] as FAsset
      let fAssetAddress: string | null = null
      try {
        fAssetAddress = this.contracts.fAssetTypeToFAssetAddress(FAssetType[fasset])
      } catch (err: any) {
        continue // fasset not supported yet
      }
      const fAssetEvmAddress = await em.findOne(EvmAddress, { hex: fAssetAddress })
      if (fAssetEvmAddress === null) continue
      const amountBefore = await this.tokenSupplyAt(fAssetEvmAddress.id, compareBefore, zeroAddress.id)
      const amountAfter = await this.tokenSupplyAt(fAssetEvmAddress.id, compareAfter, zeroAddress.id)
      ret.push({ fasset, amountBefore, amountAfter })
    }
    return ret
  }

  private async tokenSupplyAt(tokenId: number, timestamp: number, zeroAddressId: number): Promise<bigint> {
    if (zeroAddressId === null) return BigInt(0)
    const minted = await this.orm.em.createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as minted')])
      .join('evmLog', 'el')
      .join('el.block', 'block')
      .where({ 't.from_id': zeroAddressId, 'el.address': tokenId, 'block.timestamp': { $lte: timestamp } })
      .execute()
    // @ts-ignore
    const mintedValue = BigInt(minted[0]?.minted || 0)
    if (mintedValue == BigInt(0)) return BigInt(0)
    const burned = await this.orm.em.createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as burned')])
      .join('evmLog', 'el')
      .join('el.block', 'block')
      .where({ 't.to_id': zeroAddressId, 'el.address': tokenId, 'block.timestamp': { $lte: timestamp } })
      .execute()
    // @ts-ignore
    const burnedValue = BigInt(burned[0]?.burned || 0)
    return mintedValue - burnedValue
  }

  //////////////////////////////////////////////////////////////////////
  // collateral pools

  async poolTransactionsCount(): Promise<number> {
    const em = this.orm.em.fork()
    const entered = await em.count(CollateralPoolExited)
    const exited = await em.count(CollateralPoolExited)
    return entered + exited
  }

  async bestCollateralPools(n: number, minLots: number): Promise<PoolScore> {
    const con = this.orm.em.getConnection('read')
    const res = await con.execute(BEST_COLLATERAL_POOLS, [minLots, n])
    const ret = {} as PoolScore
    for (const r of res) {
      const fasset = FAssetType[r.fasset] as FAsset
      if (ret[fasset] === undefined) {
        ret[fasset] = []
      }
      const claimedResp = await this.totalClaimedPoolFeesByPool(r.hex)
      const claimed = claimedResp[0]?.claimedUBA || BigInt(0)
      ret[fasset].push({ pool: r.hex, score: r.fee_score, claimed })
    }
    return ret
  }

  async userCollateralPoolTokenPortfolio(user: string): Promise<TokenPortfolio> {
    const con = this.orm.em.getConnection('read')
    const res = await con.execute(COLLATERAL_POOL_PORTFOLIO_SQL, [user])
    return res.map(x => ({ token: x.cpt_address, balance: x.balance }))
  }

  async totalClaimedPoolFees(): Promise<ClaimedFees> {
    const resp = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimed_uba')])
      .groupBy('cpe.fasset')
      .execute()
    return resp.map(x => ({
      // @ts-ignore
      claimedUBA: BigInt(x?.claimed_uba || 0),
      fasset: FAssetType[x.fasset] as FAsset
    }))
  }

  async totalClaimedPoolFeesByUser(user: string): Promise<ClaimedFees> {
    const resp = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimed_uba')])
      .join('cpe.tokenHolder', 'th')
      .where({ 'th.hex': user })
      .groupBy('cpe.fasset')
      .execute()
    return resp.map(x => ({
      // @ts-ignore
      claimedUBA: BigInt(x?.claimed_uba || 0),
      fasset: FAssetType[x.fasset] as FAsset
    }))
  }

  async totalClaimedPoolFeesByPool(pool: string): Promise<ClaimedFees> {
    const resp = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimed_uba')])
      .join('cpe.evmLog', 'el')
      .join('el.address', 'ela')
      .where({ 'ela.hex': pool })
      .groupBy('cpe.fasset')
      .execute()
    return resp.map(x => ({
      // @ts-ignore
      claimedUBA: BigInt(x?.claimed_uba || 0),
      fasset: FAssetType[x.fasset] as FAsset
    }))
  }

  async totalClaimedPoolFeesByPoolAndUser(pool: string, user: string): Promise<ClaimedFees> {
    const resp = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(received_fasset_fees_uba) as claimed_uba')])
      .join('cpe.tokenHolder', 'th')
      .join('cpe.evmLog', 'el')
      .join('el.address', 'ela')
      .where({
        'ela.hex': pool,
        'th.hex': user
      })
      .groupBy('cpe.fasset')
      .execute()
    const fassetType = resp[0]?.fasset
    if (fassetType === undefined) return []
    return [{
      fasset: FAssetType[fassetType] as FAsset,
      // @ts-ignore
      claimedUBA: BigInt(resp[0]?.claimed_uba || 0),
    }]
  }

  //////////////////////////////////////////////////////////////////////
  // price graphs

  async mintedAggregateTimeSeries(end: number, npoints: number, start?: number): Promise<AggregateTimeSeries> {
    const timeseries = await this.mintedTimeSeries(end, npoints, start)
    return this.aggregateTimeSeries(timeseries)
  }

  async redeemedAggregateTimeSeries(end: number, npoints: number, start?: number): Promise<AggregateTimeSeries> {
    const timeseries = await this.redeemedTimeSeries(end, npoints, start)
    return this.aggregateTimeSeries(timeseries)
  }

  async mintedTimeSeries(end: number, npoints: number, start?: number): Promise<TimeSeries> {
    const em = this.orm.em.fork()
    return this.getTimeSeries(
      ($gt, $lt) => em.createQueryBuilder(MintingExecuted, 'me')
        .select(['me.fasset', raw('SUM(cr.value_uba) as value')])
        .join('me.collateralReserved', 'cr')
        .join('me.evmLog', 'el')
        .join('el.block', 'block')
        .where({ 'block.timestamp': { $gt, $lt } })
        .groupBy('fasset'),
      end, npoints, start
    )
  }

  async redeemedTimeSeries(end: number, npoints: number, start?: number): Promise<TimeSeries> {
    const em = this.orm.em.fork()
    return this.getTimeSeries(
      ($gt, $lt) => em.createQueryBuilder(RedemptionRequested, 'rr')
        .select(['rr.fasset', raw('SUM(rr.value_uba) as value')])
        .join('rr.evmLog', 'log')
        .join('log.block', 'block')
        .where({ 'block.timestamp': { $gt, $lt } })
        .groupBy('fasset'),
      end, npoints, start
    )
  }

  protected async getTimeSeries<T extends FAssetEventBound>(
    query: (si: number, ei: number) => SelectQueryBuilder<T>,
    end: number, npoints: number, start?: number
  ): Promise<TimeSeries> {
    if (start === undefined) {
      start = MIN_EVM_BLOCK_TIMESTAMP
    }
    const interval = (end - start) / npoints
    const data = {} as TimeSeries
    for (let i = 0; i < npoints; i++) {
      const si = start + i * interval
      const ei = start + (i + 1) * interval
      const results = await query(si, ei).execute()
      for (const result of results) {
        // @ts-ignore - minted_uba
        const value = BigInt(result.value)
        const fasset = FAssetType[result.fasset] as FAsset
        if (data[fasset] === undefined) {
          data[fasset] = []
        }
        data[fasset].push({ index: i, start: si, end: ei, value })
      }
    }
    return data
  }

  protected async aggregateTimeSeries(timeseries: TimeSeries): Promise<AggregateTimeSeries> {
    const em = this.orm.em.fork()
    const agg = {} as { [index: number]: { start: number, end: number, value: bigint } }
    for (const fasset in timeseries) {
      const [priceMul, priceDiv] = await fassetToUsdPrice(em, FAssetType[fasset as FAsset])
      for (const point of timeseries[fasset as FAsset]) {
        const value = PRICE_FACTOR * point.value * priceMul / priceDiv
        if (agg[point.index] === undefined) {
          agg[point.index] = { start: point.start, end: point.end, value }
          continue
        }
        agg[point.index].value += value
      }
    }
    return Object.keys(agg).map(_index => {
      const index = parseInt(_index)
      return { index, ...agg[index] }
    })
  }
}