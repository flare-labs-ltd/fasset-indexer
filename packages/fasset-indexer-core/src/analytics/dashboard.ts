import { raw } from "@mikro-orm/core"
import { ZeroAddress } from "ethers"
import { FAsset, FAssetType } from "../shared"
import { EvmAddress } from "../database/entities/address"
import { ERC20Transfer } from "../database/entities/events/token"
import { FAssetEventBound } from "../database/entities/events/_bound"
import { AgentVault } from "../database/entities/agent"
import { MintingExecuted } from "../database/entities/events/minting"
import { RedemptionRequested } from "../database/entities/events/redemption"
import { CollateralPoolEntered, CollateralPoolExited } from "../database/entities/events/collateralPool"
import { TokenBalance } from "../database/entities/state/balance"
import { fassetToUsdPrice } from "./utils"
import { ContractLookup } from "../context/contracts"
import { FASSETS, MIN_EVM_BLOCK_TIMESTAMP, PRICE_FACTOR } from "../config/constants"
import { BEST_COLLATERAL_POOLS, COLLATERAL_POOL_PORTFOLIO_SQL } from "./rawSql"
import type { QueryBuilder, SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../database/interface"
import type {
  AmountResult,
  TimeSeries, Timespan, FAssetTimeSeries, FAssetTimespan,
  TokenPortfolio, FAssetCollateralPoolScore,
  FAssetValueResult, FAssetAmountResult
} from "./interface"

/**
 * DashboardAnalytics provides a set of analytics functions for the FAsset UI's dashboard.
 * It is seperated in case of UI's opensource release, and subsequent simplified indexer deployment.
 */
export abstract class DashboardAnalytics {
  contracts: ContractLookup
  private zeroAddressId: number | null = null

  constructor(public readonly orm: ORM) {
    this.contracts = new ContractLookup()
  }

  async fAssetholderCount(): Promise<FAssetAmountResult> {
    const ret = {} as FAssetAmountResult
    const res = await this.orm.em.createQueryBuilder(TokenBalance, 'tb')
      .select(['tk.hex as token_address', raw('COUNT(DISTINCT tb.holder_id) as n_token_holders')])
      .join('tb.token', 'tk')
      .where({ 'tb.amount': { $gt: 0 }, 'tk.hex': { $in: this.contracts.fassetTokens }})
      .groupBy('tk.hex')
      .execute()
    for (const r of res) {
      // @ts-ignore
      const address = r.token_address
      if (!address) continue
      // @ts-ignore
      const amount = Number(r.n_token_holders || 0)
      const fasset = this.contracts.fAssetAddressToFAssetType(address)
      ret[FAssetType[fasset] as FAsset] = { amount }
    }
    return ret
  }

  ///////////////////////////////////////////////////////////////
  // timespans

  async fAssetSupplyTimespan(timestamps: number[]): Promise<FAssetTimespan<bigint>> {
    const ret = {} as FAssetTimespan<bigint>
    await this.ensureZeroAddressId()
    if (this.zeroAddressId === null) return ret
    const em = this.orm.em.fork()
    for (const fasset of FASSETS) {
      let fAssetAddress: string | null = null
      try {
        fAssetAddress = this.contracts.fAssetTypeToFAssetAddress(FAssetType[fasset])
      } catch (err: any) {
        continue // fasset not supported yet
      }
      const fAssetEvmAddress = await em.findOne(EvmAddress, { hex: fAssetAddress })
      if (fAssetEvmAddress === null) continue
      ret[fasset] = []
      for (const timestamp of timestamps) {
        const value = await this.tokenSupplyAt(fAssetEvmAddress.id, timestamp, this.zeroAddressId)
        ret[fasset].push({ timestamp, value })
      }
    }
    return ret
  }

  async poolCollateralTimespan(timestamps: number[], pool?: string): Promise<Timespan<bigint>> {
    const ret = [] as Timespan<bigint>
    for (const timestamp of timestamps) {
      const value = await this.poolCollateralAt(pool, timestamp)
      ret.push({ timestamp, value })
    }
    return ret
  }

  async totalClaimedPoolFeesByPoolTimespan(pool: string, timestamps: number[]): Promise<FAssetTimespan<bigint>> {
    const ret = {} as FAssetTimespan<bigint>
    const data = [] as Timespan<bigint>
    let fasset = null as FAsset | null
    for (const timestamp of timestamps) {
      const claimedFees = await this.totalClaimedPoolFeesAt(pool, timestamp)
      if (fasset === null || fasset === undefined) {
        // @ts-ignore
        fasset = Object.keys(claimedFees)[0] as FAsset
      }
      // @ts-ignore
      const value = claimedFees[fasset]?.value || BigInt(0)
      data.push({ timestamp, value })
    }
    if (fasset) {
      ret[fasset] = data
    }
    return ret
  }

  async totalClaimedPoolFeesTimespan(timestamps: number[]): Promise<FAssetTimespan<bigint>> {
    const timespans = {} as FAssetTimespan<bigint>
    for (const timestamp of timestamps) {
      const claimedFees = await this.totalClaimedPoolFeesAt(undefined, timestamp)
      for (const [fasset, { value }] of Object.entries(claimedFees)) {
        const timespan = timespans[fasset as FAsset]
        if (timespan === undefined) {
          timespans[fasset as FAsset] = [{ timestamp, value }]
          continue
        }
        timespans[fasset as FAsset].push({ timestamp, value })
      }
    }
    return timespans
  }

  async totalClaimedPoolFeesAggregateTimespan(timestamps: number[]): Promise<Timespan<bigint>> {
    const timespans = await this.totalClaimedPoolFeesTimespan(timestamps)
    return this.aggregateFAssetTimespans(timespans)
  }

  //////////////////////////////////////////////////////////////////////
  // collateral pools

  async poolTransactionsCount(): Promise<AmountResult> {
    const em = this.orm.em.fork()
    const entered = await em.count(CollateralPoolExited)
    const exited = await em.count(CollateralPoolExited)
    return { amount: entered + exited }
  }

  async bestCollateralPools(n: number, minLots: number): Promise<FAssetCollateralPoolScore> {
    const ret = {} as FAssetCollateralPoolScore
    const con = this.orm.em.getConnection('read')
    const res = await con.execute(BEST_COLLATERAL_POOLS, [minLots, n])
    for (const r of res) {
      const fasset = FAssetType[r.fasset] as FAsset
      const claimedResp = await this.totalClaimedPoolFeesAt(r.hex)
      const claimed = claimedResp[fasset]?.value || BigInt(0)
      if (ret[fasset] === undefined) {
        ret[fasset] = []
      }
      ret[fasset].push({ pool: r.hex, score: r.fee_score, claimed })
    }
    return ret
  }

  async userCollateralPoolTokenPortfolio(user: string): Promise<TokenPortfolio> {
    const ret = {} as TokenPortfolio
    const con = this.orm.em.getConnection('read')
    const res = await con.execute(COLLATERAL_POOL_PORTFOLIO_SQL, [user])
    for (const r of res) {
      ret[r.cpt_address] = { balance: BigInt(r.balance) }
    }
    return ret
  }

  async totalClaimedPoolFees(): Promise<FAssetValueResult> {
    return this.totalClaimedPoolFeesAt()
  }

  async totalClaimedPoolFeesByUser(user: string): Promise<FAssetValueResult> {
    const ret = {} as FAssetValueResult
    const res = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(cpe.received_fasset_fees_uba) as claimed_uba')])
      .join('cpe.tokenHolder', 'th')
      .where({ 'th.hex': user })
      .groupBy('cpe.fasset')
      .execute()
    for (const x of res) {
      // @ts-ignore
      const value = BigInt(x?.claimed_uba || 0)
      ret[FAssetType[x.fasset] as FAsset] = { value }
    }
    return ret
  }

  async totalClaimedPoolFeesByPool(pool: string): Promise<FAssetValueResult> {
    return this.totalClaimedPoolFeesAt(pool)
  }

  async totalClaimedPoolFeesByPoolAndUser(pool: string, user: string): Promise<FAssetValueResult> {
    const ret = {} as FAssetValueResult
    const res = await this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
      .select(['cpe.fasset', raw('SUM(cpe.received_fasset_fees_uba) as claimed_uba')])
      .join('cpe.tokenHolder', 'th')
      .join('cpe.evmLog', 'el')
      .join('el.address', 'ela')
      .where({ 'ela.hex': pool, 'th.hex': user })
      .groupBy('cpe.fasset')
      .execute()
    const fassetType = res[0]?.fasset
    if (fassetType !== undefined) {
      // @ts-ignore
      const value = BigInt(res[0]?.claimed_uba || 0)
      ret[FAssetType[fassetType] as FAsset] = { value }
    }
    return ret
  }

  //////////////////////////////////////////////////////////////////////
  // timeseries

  async mintedAggregateTimeSeries(end: number, npoints: number, start?: number): Promise<TimeSeries<bigint>> {
    const timeseries = await this.mintedTimeSeries(end, npoints, start)
    return this.aggregateTimeSeries(timeseries)
  }

  async redeemedAggregateTimeSeries(end: number, npoints: number, start?: number): Promise<TimeSeries<bigint>> {
    const timeseries = await this.redeemedTimeSeries(end, npoints, start)
    return this.aggregateTimeSeries(timeseries)
  }

  async mintedTimeSeries(end: number, npoints: number, start?: number): Promise<FAssetTimeSeries<bigint>> {
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

  async redeemedTimeSeries(end: number, npoints: number, start?: number): Promise<FAssetTimeSeries<bigint>> {
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

  //////////////////////////////////////////////////////////////////////
  // helpers

  protected async ensureZeroAddressId(): Promise<void> {
    if (this.zeroAddressId !== null) return
    this.zeroAddressId = await this.orm.em.fork().findOne(EvmAddress, { hex: ZeroAddress })
      .then(zeroAddress => this.zeroAddressId = zeroAddress?.id ?? null)
  }

  protected async getTimeSeries<T extends FAssetEventBound>(
    query: (si: number, ei: number) => SelectQueryBuilder<T>,
    end: number, npoints: number, start?: number
  ): Promise<FAssetTimeSeries<bigint>> {
    const ret = {} as FAssetTimeSeries<bigint>
    if (start === undefined) {
      start = MIN_EVM_BLOCK_TIMESTAMP
    }
    const interval = (end - start) / npoints
    for (let i = 0; i < npoints; i++) {
      const si = start + i * interval
      const ei = start + (i + 1) * interval
      const results = await query(si, ei).execute()
      for (const fasset of FASSETS) {
        if (i === 0) ret[fasset] = []
        ret[fasset].push({ index: i, start: si, end: ei, value: BigInt(0) })
      }
      for (const result of results) {
        // @ts-ignore - value
        const value = BigInt(result.value)
        const fasset = FAssetType[result.fasset] as FAsset
        ret[fasset][i].value += value
      }
    }
    return ret
  }

  protected async aggregateTimeSeries(timeseries: FAssetTimeSeries<bigint>): Promise<TimeSeries<bigint>> {
    const em = this.orm.em.fork()
    const acc = {} as { [index: number]: { start: number, end: number, value: bigint } }
    for (const fasset in timeseries) {
      const [priceMul, priceDiv] = await fassetToUsdPrice(em, FAssetType[fasset as FAsset])
      for (const point of timeseries[fasset as FAsset]) {
        const value = PRICE_FACTOR * point.value * priceMul / priceDiv
        if (acc[point.index] === undefined) {
          acc[point.index] = { start: point.start, end: point.end, value }
          continue
        }
        acc[point.index].value += value
      }
    }
    return Object.entries(acc).map(([ index, data ]) => ({ index: parseInt(index), ...data }))
  }

  protected async aggregateFAssetTimespans(timespans: FAssetTimespan<bigint>): Promise<Timespan<bigint>> {
    const acc: { [timestamp: number]: bigint } = {}
    const em = this.orm.em.fork()
    for (const [ fasset, timespan ] of Object.entries(timespans)) {
      const [priceMul, priceDiv] = await fassetToUsdPrice(em, FAssetType[fasset as FAsset])
      for (const point of timespan) {
        const value = PRICE_FACTOR * point.value * priceMul / priceDiv
        if (acc[point.timestamp] === undefined) {
          acc[point.timestamp] = value
          continue
        }
        acc[point.timestamp] += value
      }
    }
    return Object.entries(acc).map(([timestamp, value]) => ({ timestamp: parseInt(timestamp), value }))
  }

  //////////////////////////////////////////////////////////////////////
  // generalizations

  private async poolCollateralAt(pool?: string, timestamp?: number): Promise<bigint> {
    const entered = await this.poolCollateralEnteredAt(pool, timestamp)
    if (entered === BigInt(0)) return BigInt(0)
    const exited = await this.poolCollateralExitedAt(pool, timestamp)
    return entered - exited
  }

  private async poolCollateralEnteredAt(pool?: string, timestamp?: number): Promise<bigint> {
    const enteredCollateralQb = this.limitPoolAndTimestamp(
      this.orm.em.createQueryBuilder(CollateralPoolEntered, 'cpe')
        .select([raw('SUM(cpe.amount_nat_wei) as collateral')]),
      pool, timestamp
    )
    const enteredCollateralRes = await enteredCollateralQb.execute()
    // @ts-ignore
    return BigInt(enteredCollateralRes[0]?.collateral || 0)
  }

  private async poolCollateralExitedAt(pool?: string, timestamp?: number): Promise<bigint> {
    const exitedCollateralQb = this.limitPoolAndTimestamp(
      this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
        .select([raw('SUM(cpe.received_nat_wei) as collateral')]),
      pool, timestamp
    )
    const exitedCollateralRes = await exitedCollateralQb.execute()
    // @ts-ignore
    return BigInt(exitedCollateralRes[0]?.collateral || 0)
  }

  private async totalClaimedPoolFeesAt(pool?: string, timestamp?: number): Promise<FAssetValueResult> {
    const enteredFeesQb = this.limitPoolAndTimestamp(
      this.orm.em.createQueryBuilder(CollateralPoolExited, 'cpe')
        .select(['cpe.fasset', raw('SUM(cpe.received_fasset_fees_uba) as fees')])
        .groupBy('cpe.fasset'),
      pool, timestamp
    )
    const enteredFeesRes = await enteredFeesQb.execute()
    const ret = {} as FAssetValueResult
    for (const x of enteredFeesRes) {
      // @ts-ignore
      const claimedFees = BigInt(x?.fees || 0)
      ret[FAssetType[x.fasset] as FAsset] = { value: claimedFees }
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
      .where({ 't.to_id': zeroAddressId, 'el.address': tokenId, 'block.timestamp': { $lte: timestamp } })
      .join('evmLog', 'el')
      .join('el.block', 'block')
      .execute()
    // @ts-ignore
    const burnedValue = BigInt(burned[0]?.burned || 0)
    return mintedValue - burnedValue
  }

  private limitPoolAndTimestamp<T extends object>(
    qb: SelectQueryBuilder<T>, pool?: string, timestamp?: number
  ): SelectQueryBuilder<T> {
    if (timestamp !== undefined || pool !== undefined) {
      console.log('neki')
      qb = qb.join('cpe.evmLog', 'el')
      if (timestamp !== undefined) {
        qb = qb
          .join('el.block', 'block')
          .where({ 'block.timestamp': { $lte: timestamp }})
      }
      if (pool !== undefined) {
        qb = qb
          .join('el.address', 'ela')
          .andWhere({ 'ela.hex': pool })
      }
    }
    return qb
  }
}