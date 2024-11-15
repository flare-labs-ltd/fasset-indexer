import { Controller, Get, ParseBoolPipe, ParseIntPipe, Query, UseInterceptors } from '@nestjs/common'
import { CacheInterceptor } from '@nestjs/cache-manager'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { FAssetIndexerService } from '../services/indexer.service'
import { apiResponse, type ApiResponse } from '../shared/api-response'
import { MAX_RETURNED_OBJECTS, MAX_TIMESERIES_PTS, MAX_TIMESPAN_PTS } from '../constants'
import {
  type AmountResult,
  type TimeSeries, type Timespan, type TokenPortfolio,
  type FAssetTimespan, type FAssetCollateralPoolScore,
  type FAssetValueResult, type FAssetAmountResult,
  type RedemptionDefault,
  FAssetType
} from 'fasset-indexer-core'


@ApiTags('Dashboard')
@UseInterceptors(CacheInterceptor)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly appService: FAssetIndexerService) { }

  //////////////////////////////////////////////////////////////////////
  // system

  @Get('fasset-holder-count')
  @ApiOperation({ summary: 'Number of fasset token holders' })
  getFAssetHolderCount(): Promise<ApiResponse<FAssetAmountResult>> {
    return apiResponse(this.appService.fAssetholderCount(), 200)
  }

  @Get('total-liquidation-count')
  @ApiOperation({ summary: 'Number of performed liquidations' })
  getLiquidationCount(): Promise<ApiResponse<AmountResult>> {
    return apiResponse(this.appService.liquidationCount(), 200)
  }

  @Get('redemption-default?')
  redemptionDefault(@Query('id') id: number, @Query('fasset') fasset: string): Promise<ApiResponse<RedemptionDefault>> {
    return apiResponse(this.appService.redemptionDefault(id, FAssetType[fasset]), 200)
  }

  //////////////////////////////////////////////////////////////////////
  // agents

  @Get('agent-minting-executed-count?')
  getAgentMintingExecutedCount(@Query('agent') agent: string): Promise<ApiResponse<AmountResult>> {
    return apiResponse(this.appService.agentMintingExecutedCount(agent), 200)
  }

  @Get('agent-redemption-success-rate?')
  getAgentRedemptionSuccessRate(@Query('agent') agent: string): Promise<ApiResponse<AmountResult>> {
    return apiResponse(this.appService.agentRedemptionSuccessRate(agent), 200)
  }

  @Get('agent-liquidation-count?')
  getAgentLiquidationCount(@Query('agent') agent: string): Promise<ApiResponse<AmountResult>> {
    return apiResponse(this.appService.agentLiquidationCount(agent), 200)
  }

  /////////////////////////////////////////////////////////////////////
  // collateral pools

  @Get('collateral-pool-transactions-count')
  @ApiOperation({ summary: 'Number of FAsset transactions related to collateral pools' })
  getPoolTransactionCount(): Promise<ApiResponse<AmountResult>> {
    return apiResponse(this.appService.poolTransactionsCount(), 200)
  }

  @Get('best-performing-collateral-pools?')
  @ApiOperation({ summary: 'The main collateral pools to advertise' })
  @ApiQuery({ name: "minLots", type: Number, required: false })
  getBestCollateralPools(
    @Query('n', ParseIntPipe) n: number,
    @Query('minLots', new ParseIntPipe({ optional: true })) minLots?: number
  ): Promise<ApiResponse<FAssetCollateralPoolScore>> {
    const err = this.restrictReturnedObjects(n)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.bestCollateralPools(n, minLots ?? 100), 200)
  }

  @Get('user-collateral-pool-token-portfolio?')
  @ApiOperation({ summary: 'User\'s collateral pool token portfolio' })
  getUserCollateralPoolTokenPortfolio(
    @Query('user') user: string
  ): Promise<ApiResponse<TokenPortfolio>> {
    return apiResponse(this.appService.userCollateralPoolTokenPortfolio(user), 200)
  }

  @Get('total-claimed-pool-fees?')
  @ApiOperation({ summary: 'Total claimed collateral pool fees' })
  @ApiQuery({ name: "pool", type: String, required: false })
  @ApiQuery({ name: "user", type: String, required: false })
  getTotalClaimedPoolFees(
    @Query('pool') pool?: string,
    @Query('user') user?: string
  ): Promise<ApiResponse<FAssetValueResult>> {
    return apiResponse(this.appService.totalClaimedPoolFees(pool, user), 200)
  }

  //////////////////////////////////////////////////////////////////////
  // timespan

  @Get('/timespan/fasset-supply?')
  @ApiOperation({ summary: 'Timespan of fasset supply along timestamps' })
  @ApiQuery({ name: 'timestamps', type: Number, isArray: true })
  getFassetSupplyDiff(
    @Query('timestamps') timestamps: string | string[]
  ): Promise<ApiResponse<FAssetTimespan<bigint>>> {
    const ts = this.parseTimestamps(timestamps)
    const er = this.restrictTimespan(ts)
    if (er !== null) return apiResponse(Promise.reject(er), 400)
    return apiResponse(this.appService.fAssetSupplyTimespan(ts), 200)
  }

  @Get('/timespan/pool-collateral?')
  @ApiOperation({ summary: 'Timespan of pool collateral along timestamps' })
  @ApiQuery({ name: 'timestamps', type: Number, isArray: true })
  @ApiQuery({ name: "pool", type: String, required: false })
  getPoolCollateralDiff(
    @Query('timestamps') timestamps: string | string[],
    @Query('pool') pool?: string
  ): Promise<ApiResponse<Timespan<bigint>>> {
    console.log(timestamps)
    const ts = this.parseTimestamps(timestamps)
    console.log(ts)
    const er = this.restrictTimespan(ts)
    if (er !== null) return apiResponse(Promise.reject(er), 400)
    return apiResponse(this.appService.poolCollateralTimespan(ts, pool), 200)
  }

  @Get('/timespan/claimed-pool-fees?')
  @ApiOperation({ summary: 'Timespan of collected pool fees along timestamps' })
  @ApiQuery({ name: "timestamps", type: Number, isArray: true })
  @ApiQuery({ name: "pool", type: String, required: false })
  @ApiQuery({ name: "usd", type: Boolean, required: false })
  getPoolFeesDiff(
    @Query('timestamps') timestamps: string | string[],
    @Query('pool') pool?: string,
    @Query('usd', new ParseBoolPipe({ optional: true })) usd?: boolean
  ): Promise<ApiResponse<FAssetTimespan<bigint> | Timespan<bigint>>> {
    const ts = this.parseTimestamps(timestamps)
    const er = this.restrictTimespan(ts)
    if (er !== null) return apiResponse(Promise.reject(er), 400)
    if (usd === true) {
      return apiResponse(this.appService.totalClaimedPoolFeesAggregateTimespan(ts), 200)
    } else {
      return apiResponse(this.appService.totalClaimedPoolFeesTimespan(ts, pool, undefined), 200)
    }
  }

  ///////////////////////////////////////////////////////////////
  // timeseries

  @Get('/timeseries/redeemed?')
  @ApiOperation({ summary: 'Time series of the total $ value of redeemed FAssets' })
  @ApiQuery({ name: "startTime", type: Number, required: false })
  getTimeSeriesRedeemed(
    @Query('endtime', ParseIntPipe) end: number,
    @Query('npoints', ParseIntPipe) npoints: number,
    @Query('startTime', new ParseIntPipe({ optional: true })) start?: number
  ): Promise<ApiResponse<TimeSeries<bigint>>> {
    const err = this.restrictPoints(end, npoints, start)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.redeemedAggregateTimeSeries(end, npoints, start), 200)
  }

  @Get('/timeseries/minted?')
  @ApiOperation({ summary: 'Time series of the total $ value of minted FAssets' })
  @ApiQuery({ name: "startTime", type: Number, required: false })
  getTimeSeriesMinted(
    @Query('endtime', ParseIntPipe) end: number,
    @Query('npoints', ParseIntPipe) npoints: number,
    @Query('startTime', new ParseIntPipe({ optional: true })) start?: number
  ): Promise<ApiResponse<TimeSeries<bigint>>> {
    const err = this.restrictPoints(end, npoints, start)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.mintedAggregateTimeSeries(end, npoints, start), 200)
  }

  //////////////////////////////////////////////////////////////////////
  // helpers

  protected parseTimestamps(timestamps: string | string[]): number[] {
    if (typeof timestamps === 'string') {
      return timestamps.split(',').map(x => parseInt(x))
    }
    return timestamps.map(x => parseInt(x))
  }

  private restrictTimespan(timespan: number[]): Error | null {
    if (timespan.length > MAX_TIMESPAN_PTS) {
      return new Error(`Timespan must be an array of maximum ${MAX_TIMESPAN_PTS} timestamps`)
    }
    return null
  }

  private restrictPoints(end: number, npoints: number, start?: number): Error | null {
    if (npoints > MAX_TIMESERIES_PTS) {
      return new Error(`Cannot request more than ${MAX_TIMESERIES_PTS} points`)
    }
    return null
  }

  private restrictReturnedObjects(n: number): Error | null {
    if (n > MAX_RETURNED_OBJECTS) {
      return new Error(`Cannot request more than ${MAX_RETURNED_OBJECTS} objects`)
    }
    return null
  }
}