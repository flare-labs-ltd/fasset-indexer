import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { FAssetIndexerService } from '../app.service'
import { apiResponse, type ApiResponse } from '../common/api-response'
import { MAX_GRAPH_POINTS, MAX_RETURNED_OBJECTS, MINUTE, DAY, WEEK, MONTH, YEAR } from 'src/common/constants'
import type { AggregateTimeSeries, ClaimedFees, PoolScore, TokenPortfolio, FAssetDiffs } from 'fasset-indexer-core'


@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly appService: FAssetIndexerService) { }

  /////////////////////////////////////////////////////////////////
  // info

  @Get('fasset-supply-diff')
  @ApiOperation({ summary: 'Difference between fasset supplies between now and now - lookback' })
  @ApiQuery({ name: "now", type: Number, required: false })
  getFassetSupplyDiff(
    @Query('lookback') lookback: string,
    @Query('now') now?: number
  ): Promise<ApiResponse<FAssetDiffs>> {
    let seconds = null
    if (lookback === "day") {
      seconds = DAY
    } else if (lookback === "week") {
      seconds = WEEK
    } else if (lookback === "month") {
      seconds = MONTH
    } else if (lookback === "year") {
      seconds = YEAR
    } else {
      seconds = parseInt(lookback)
      if (isNaN(seconds)) return apiResponse(Promise.reject(`Invalid input lookback=${lookback}`), 400)
    }
    now = now ?? Math.floor(Date.now() / 1000)
    return apiResponse(this.appService.fAssetSupplyDiff(now - seconds, now), 200)
  }

  @Get('collateral-pool-transactions-count')
  @ApiOperation({ summary: 'Number of FAsset transactions related to collateral pools' })
  getPoolTransactionCount(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.poolTransactionsCount(), 200)
  }

  @Get('best-performing-collateral-pools:n')
  @ApiOperation({ summary: 'The main collateral pools to advertise' })
  @ApiQuery({ name: "minLots", type: Number, required: false })
  getBestCollateralPools(
    @Query('n') n: number,
    @Query('minLots') minLots?: number
  ): Promise<ApiResponse<PoolScore>> {
    const err = this.restrictReturnedObjects(n)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.bestCollateralPools(n, minLots ?? 100), 200)
  }

  @Get('user-collateral-pool-token-portfolio:user')
  @ApiOperation({ summary: 'User\'s collateral pool token portfolio' })
  getUserCollateralPoolTokenPortfolio(
    @Query('user') user: string
  ): Promise<ApiResponse<TokenPortfolio>> {
    return apiResponse(this.appService.userCollateralPoolTokenPortfolio(user), 200)
  }

  @Get('total-claimed-pool-fees')
  @ApiOperation({ summary: 'Total claimed collateral pool fees' })
  @ApiQuery({ name: "user", type: String, required: false })
  getTotalClaimedPoolFees(
    @Query('user') user?: string
  ): Promise<ApiResponse<ClaimedFees>> {
    return apiResponse(
      user === undefined
        ? this.appService.totalClaimedPoolFees()
        : this.appService.totalClaimedPoolFeesByUser(user),
      200
    )
  }

  @Get('total-claimed-pool-fees:pool:user')
  @ApiOperation({ summary: 'Total claimed collateral pool fees' })
  getTotalClaimedPoolFeesByPool(
    @Query('pool') pool: string,
    @Query('user') user: string
  ): Promise<ApiResponse<bigint>> {
    return apiResponse(this.appService.totalClaimedPoolFeesByPoolAndUser(pool, user), 200)
  }

  ///////////////////////////////////////////////////////////////
  // time-series

  @Get('/time-series/redeemed:endtime:npoints')
  @ApiOperation({ summary: 'Time series of the total $ value of redeemed FAssets' })
  @ApiQuery({ name: "startTime", type: Number, required: false })
  getTimeSeriesRedeemed(
    @Query('endtime') end: number,
    @Query('npoints') npoints: number,
    @Query('startTime') start?: number
  ): Promise<ApiResponse<AggregateTimeSeries>> {
    const err = this.restrictPoints(end, npoints, start)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.redeemedAggregateTimeSeries(end, npoints, start), 200)
  }

  @Get('/time-series/minted:endtime:points')
  @ApiOperation({ summary: 'Time series of the total $ value of minted FAssets' })
  @ApiQuery({ name: "startTime", type: Number, required: false })
  getTimeSeriesMinted(
    @Query('endtime') end: number,
    @Query('npoints') npoints: number,
    @Query('startTime') start?: number
  ): Promise<ApiResponse<AggregateTimeSeries>> {
    const err = this.restrictPoints(end, npoints, start)
    if (err !== null) return apiResponse(Promise.reject(err), 400)
    return apiResponse(this.appService.mintedAggregateTimeSeries(end, npoints, start), 200)
  }

  //////////////////////////////////////////////////////////////////////
  // helpers

  private restrictPoints(end: number, npoints: number, start?: number): Error | null {
    if (npoints > MAX_GRAPH_POINTS) {
      return new Error(`Cannot request more than ${MAX_GRAPH_POINTS} points`)
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