import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FAssetIndexerService } from './app.service'
import { apiResponse, type ApiResponse } from './common/api-response'
import { LiquidationPerformed, FullLiquidationStarted, RedemptionDefault, FAssetType } from 'fasset-indexer-core'


@ApiTags("Indexer")
@Controller("api/indexer")
export class FAssetIndexerController {

  constructor(private readonly appService: FAssetIndexerService) {}

  @Get('/current-block')
  getCurrentBlock(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.appService.currentBlock(), 200)
  }

  @Get('/current-btc-block')
  getCurrentBtcBlock(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.appService.currentBtcBlock(), 200)
  }

  @Get('/blocks-to-back-sync')
  getBlocksToBackSync(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.appService.blocksToBackSync(), 200)
  }

  @Get('/total-redemption-requesters')
  getTotalRedemptionRequesters(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalRedemptionRequesters(), 200)
  }

  @Get('/total-collateral-reservers')
  getTotalCollateralReservers(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalCollateralReservers(), 200)
  }

  @Get('/total-ui-relevant-transactions')
  getTotalUiRelevantTransactions(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalUiRelevantTransactions(), 200)
  }

  // Liquidations

  @Get('/liquidations')
  getPerformedLiquidations(): Promise<ApiResponse<LiquidationPerformed[]>> {
    return apiResponse(this.appService.liquidations(), 200)
  }

  @Get('/full-liquidations')
  getFullLiquidations(): Promise<ApiResponse<FullLiquidationStarted[]>> {
    return apiResponse(this.appService.fullLiquidations(), 200)
  }

  @Get('/liquidators')
  getLiquidators(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalLiquidators(), 200)
  }

  //////////////////////////////////////////////////////////////////////////////
  // agents

  @Get('/agent-minting-executed-count?')
  getAgentMintingExecutedCount(@Query('agent') agent: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentMintingExecutedCount(agent), 200)
  }

  @Get('/agent-redemption-request-count?')
  getAgentRedemptionRequestCount(@Query('agent') agent: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentRedemptionRequestCount(agent), 200)
  }

  @Get('/agent-redemption-performed-count?')
  getAgentRedemptionPerformedCount(@Query('agent') agent: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentRedemptionPerformedCount(agent), 200)
  }

  @Get('/agent-redemption-success-rate?')
  getAgentRedemptionSuccessRate(@Query('agent') agent: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentRedemptionSuccessRate(agent), 200)
  }

  @Get('/agent-liquidation-count?')
  getAgentLiquidationCount(@Query('agent') agent: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentLiquidationCount(agent), 200)
  }

  @Get('/events-per-interval?')
  getEventsPerSecond(@Query('seconds') seconds: number): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.eventsPerInterval(seconds), 200)
  }

  @Get('/total-free-lots')
  getTotalFreeLots(): Promise<ApiResponse<{
    publicLots: bigint,
    privateLots: bigint,
    liquidationLots: bigint,
    normalLots: bigint
  }>> {
    return apiResponse(this.appService.totalFreeLots(), 200)
  }

  @Get('/agents-in-liquidation')
  getAgentsInLiquidation(): Promise<ApiResponse<{ totalAgents: number, agentsInLiquidation: number }>> {
    return apiResponse(this.appService.agentsInLiquidation().then(x => ({
      totalAgents: x[1],
      agentsInLiquidation: x[0]
    })), 200)
  }

  @Get('/minting-executed-with-executor?')
  mintingExecutedWithExecutor(@Query('executor') executor: string): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.executorMintingPerformed(executor), 200)
  }

  @Get('/total-minting-executions?')
  totalMintingExecutions(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalMintingExecutions(), 200)
  }

  @Get('/redemption-default?')
  redemptionDefault(@Query('id') id: number, @Query('fasset') fasset: string, ): Promise<ApiResponse<RedemptionDefault>> {
    return apiResponse(this.appService.redemptionDefault(id, FAssetType[fasset]), 200)
  }
}
