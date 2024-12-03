import { raw } from "@mikro-orm/core"
import { ZeroAddress } from "ethers"
import { FAsset, FAssetType } from "../shared"
import { EvmAddress } from "../database/entities/address"
import { EvmLog } from "../database/entities/evm/log"
import { ERC20Transfer } from "../database/entities/events/token"
import { FAssetEventBound } from "../database/entities/events/_bound"
import { MintingExecuted } from "../database/entities/events/minting"
import { RedemptionDefault, RedemptionPerformed, RedemptionRequested } from "../database/entities/events/redemption"
import { CollateralPoolEntered, CollateralPoolExited } from "../database/entities/events/collateralPool"
import { LiquidationPerformed } from "../database/entities/events/liquidation"
import { TokenBalance } from "../database/entities/state/balance"
import { fassetToUsdPrice } from "./utils/prices"
import { ContractLookup } from "../context/contracts"
import { EVENTS, FASSETS, MIN_EVM_BLOCK_NUMBER_DB_KEY, PRICE_FACTOR } from "../config/constants"
import { BEST_COLLATERAL_POOLS, COLLATERAL_POOL_PORTFOLIO_SQL } from "./utils/rawSql"
import type { EntityManager, SelectQueryBuilder } from "@mikro-orm/knex"
import type { ORM } from "../database/interface"
import type {
  AmountResult,
  TimeSeries, Timespan, FAssetTimeSeries, FAssetTimespan,
  TokenPortfolio, FAssetCollateralPoolScore,
  FAssetValueResult, FAssetAmountResult
} from "./interface"
import { getVar } from "../utils"
import { EvmBlock } from "../database/entities/evm/block"

/**
 * DashboardAnalytics provides a set of analytics functions for the FAsset UI's dashboard.
 * It is seperated in case of UI's opensource release, and subsequent simplified indexer deployment.
 */
export class DashboardAnalytics {
  contracts: ContractLookup
  private zeroAddressId: number | null = null

  constructor(public readonly orm: ORM) {
    this.contracts = new ContractLookup()
  }

  //////////////////////////////////////////////////////////////////////
  // system

  async transactionCount(): Promise<AmountResult> {
    const qb = this.orm.em.qb(EvmLog)
    const result = await qb.count().where({ name: {
      $in: [
        EVENTS.COLLATERAL_POOL_EXIT,
        EVENTS.COLLATERAL_POOL_ENTER,
        EVENTS.REDEMPTION_REQUESTED,
        EVENTS.COLLATERAL_RESERVED
      ]
    }}).execute()
    return { amount: result[0].count }
  }

  async fAssetholderCount(): Promise<FAssetAmountResult> {
    const ret = {} as FAssetAmountResult
    const res = await this.orm.em.fork().createQueryBuilder(TokenBalance, 'tb')
      .select(['tk.hex as token_address', raw('COUNT(DISTINCT tb.holder_id) as n_token_holders')])
      .join('tb.token', 'tk')
      .where({ 'tb.amount': { $gt: 0 }, 'tk.hex': { $in: this.contracts.fassetTokens }})
      .groupBy('tk.hex')
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

  async liquidationCount(): Promise<AmountResult> {
    const amount = await this.orm.em.fork().count(LiquidationPerformed, { valueUBA: { $gt: 0 }})
    return { amount }
  }

  async mintingExecutedCount(): Promise<AmountResult> {
    const amount = await this.orm.em.fork().count(MintingExecuted)
    return { amount }
  }

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

  //////////////////////////////////////////////////////////////////////
  // agents

  async agentRedemptionSuccessRate(agentAddress: string): Promise<AmountResult> {
    const requested = await this.agentRedemptionRequestCount(agentAddress)
    const executed = await this.agentRedemptionPerformedCount(agentAddress)
    const rate = requested.amount > 0 ? executed.amount / requested.amount : 0
    return { amount: rate }
  }

  async agentMintingExecutedCount(agentAddress: string): Promise<AmountResult> {
    const qb = this.orm.em.fork().qb(MintingExecuted)
    qb.count().where({ collateralReserved: { agentVault: { address: { hex: agentAddress }}}})
    const result = await qb.execute()
    return { amount: Number(result[0].count || 0) }
  }

  async agentRedemptionRequestCount(agentAddress: string): Promise<AmountResult> {
    const qb = this.orm.em.fork().qb(RedemptionRequested)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}})
    const result = await qb.execute()
    return { amount: Number(result[0].count || 0) }
  }

  async agentRedemptionPerformedCount(agentAddress: string): Promise<AmountResult> {
    const qb = this.orm.em.fork().qb(RedemptionPerformed)
    qb.count().where({ redemptionRequested: { agentVault: { address: { hex: agentAddress }}}})
    const result = await qb.execute()
    return { amount: Number(result[0].count || 0) }
  }

  async agentLiquidationCount(agentAddress: string): Promise<AmountResult> {
    const qb = this.orm.em.fork().qb(LiquidationPerformed)
    qb.count().where({ agentVault: { address: { hex: agentAddress }}, valueUBA: { $gt: 0 } })
    const result = await qb.execute()
    return { amount: Number(result[0].count || 0) }
  }

  //////////////////////////////////////////////////////////////////////
  // collateral pools

  async poolTransactionsCount(): Promise<AmountResult> {
    const em = this.orm.em.fork()
    const entered = await em.count(CollateralPoolEntered)
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

  async totalClaimedPoolFees(pool?: string, user?: string): Promise<FAssetValueResult> {
    return this.totalClaimedPoolFeesAt(pool, user)
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
      const value = await this.poolCollateralAt(pool, undefined, timestamp)
      ret.push({ timestamp, value })
    }
    return ret
  }

  async totalClaimedPoolFeesTimespan(timestamps: number[], pool?: string, user?: string): Promise<FAssetTimespan<bigint>> {
    const timespans = {} as FAssetTimespan<bigint>
    for (const timestamp of timestamps) {
      const claimedFees = await this.totalClaimedPoolFeesAt(pool, user, timestamp)
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
    if (start == null) {
      start = await this.getMinTimestamp(em)
    }
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
    if (start == null) {
      start = await this.getMinTimestamp(em)
    }
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
    end: number, npoints: number, start: number
  ): Promise<FAssetTimeSeries<bigint>> {
    const ret = {} as FAssetTimeSeries<bigint>
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

  private async poolCollateralAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const entered = await this.poolCollateralEnteredAt(pool, user, timestamp)
    if (entered === BigInt(0)) return BigInt(0)
    const exited = await this.poolCollateralExitedAt(pool, user, timestamp)
    return entered - exited
  }

  private async poolCollateralEnteredAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const enteredCollateral = await this.filterEnterOrExitQueryBy(
      this.orm.em.fork().createQueryBuilder(CollateralPoolEntered, 'cpe')
        .select([raw('SUM(cpe.amount_nat_wei) as collateral')]),
      'cpe', pool, user, timestamp
    ).execute()
    // @ts-ignore
    return BigInt(enteredCollateral[0]?.collateral || 0)
  }

  private async poolCollateralExitedAt(pool?: string, user?: string, timestamp?: number): Promise<bigint> {
    const exitedCollateral = await this.filterEnterOrExitQueryBy(
      this.orm.em.fork().createQueryBuilder(CollateralPoolExited, 'cpe')
        .select([raw('SUM(cpe.received_nat_wei) as collateral')]),
      'cpe', pool, user, timestamp
    ).execute()
    // @ts-ignore
    return BigInt(exitedCollateral[0]?.collateral || 0)
  }

  private async totalClaimedPoolFeesAt(pool?: string, user?: string, timestamp?: number): Promise<FAssetValueResult> {
    const ret = {} as FAssetValueResult
    const enteredFees = await this.filterEnterOrExitQueryBy(
      this.orm.em.fork().createQueryBuilder(CollateralPoolExited, 'cpe')
        .select(['cpe.fasset', raw('SUM(cpe.received_fasset_fees_uba) as fees')])
        .groupBy('cpe.fasset'),
      'cpe', pool, user, timestamp
    ).execute()
    for (const x of enteredFees) {
      // @ts-ignore
      const claimedFees = BigInt(x?.fees || 0)
      ret[FAssetType[x.fasset] as FAsset] = { value: claimedFees }
    }
    return ret
  }

  private async tokenSupplyAt(tokenId: number, timestamp: number, zeroAddressId: number): Promise<bigint> {
    if (zeroAddressId === null) return BigInt(0)
    const minted = await this.orm.em.fork().createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as minted')])
      .join('evmLog', 'el')
      .join('el.block', 'block')
      .where({ 't.from_id': zeroAddressId, 'el.address': tokenId, 'block.timestamp': { $lte: timestamp } })
      .execute()
    // @ts-ignore
    const mintedValue = BigInt(minted[0]?.minted || 0)
    if (mintedValue == BigInt(0)) return BigInt(0)
    const burned = await this.orm.em.fork().createQueryBuilder(ERC20Transfer, 't')
      .select([raw('SUM(t.value) as burned')])
      .where({ 't.to_id': zeroAddressId, 'el.address': tokenId, 'block.timestamp': { $lte: timestamp } })
      .join('evmLog', 'el')
      .join('el.block', 'block')
      .execute()
    // @ts-ignore
    const burnedValue = BigInt(burned[0]?.burned || 0)
    return mintedValue - burnedValue
  }

  private filterEnterOrExitQueryBy<T extends object>(
    qb: SelectQueryBuilder<T>, alias: string,
    pool?: string, user?: string, timestamp?: number
  ): SelectQueryBuilder<T> {
    if (timestamp !== undefined || pool !== undefined) {
      qb = qb.join(`${alias}.evmLog`, 'el')
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
    if (user !== undefined) {
      qb = qb
        .join(`${alias}.tokenHolder`, 'th')
        .andWhere({ 'th.hex': user })
    }
    return qb
  }

  private async getMinTimestamp(em: EntityManager): Promise<number> {
    const minBlockVar = await getVar(em, MIN_EVM_BLOCK_NUMBER_DB_KEY)
    if (minBlockVar === null) return 0
    const minBlockNum = parseInt(minBlockVar.value!)
    const block = await em.findOne(EvmBlock, { index: minBlockNum })
    return block === null ? 0 : block.timestamp
  }
}

/* import { config } from "../config/config"
import { Context } from "../context/context"
async function main() {
  const context = await Context.create(config)
  const analytics = new DashboardAnalytics(context.orm)
  const result = await analytics.fAssetholderCount()
  console.log(result)
  await context.orm.close()
}

main() */