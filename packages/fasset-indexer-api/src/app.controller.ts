import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FAssetIndexerService } from './app.service'
import { apiResponse, type ApiResponse } from './common/api-response'
import type { LiquidationPerformed, FullLiquidationStarted } from 'fasset-indexer-core'


@ApiTags("Indexer")
@Controller("api/indexer")
export class FAssetIndexerController {

  constructor(private readonly appService: FAssetIndexerService) {}

  @Get('/current-block')
  getCurrentBlock(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.appService.currentBlock(), 200)
  }

  @Get('/blocks-to-back-sync')
  getBlocksToBackSync(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.appService.blocksToBackSync(), 200)
  }

  @Get('/logs-without-senders')
  getLogsWithoutSenders(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.logsWithoutSenders(), 200)
  }

  @Get('/agents-without-cpt')
  getAgentsWithoutCPT(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.agentsWithoutCPT(), 200)
  }

  @Get('/total-minted')
  getTotalMinted(): Promise<ApiResponse<string>> {
    return apiResponse(this.appService.totalMinted().then(String), 200)
  }

  @Get('/total-reserved')
  getTotalReserved(): Promise<ApiResponse<string>> {
    return apiResponse(this.appService.totalReserved().then(String), 200)
  }

  @Get('/redemption-requests?:seconds')
  getRedemptionRequests(@Param('seconds') seconds: number): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.redemptionRequestFromSecondsAgo(seconds), 200)
  }

  @Get('/total-minting-defaulted')
  getTotalMintingDefaulted(): Promise<ApiResponse<string>> {
    return apiResponse(this.appService.totalMintingDefaulted().then(String), 200)
  }

  @Get('/total-redemption-requested')
  getTotalRedemptionRequested(): Promise<ApiResponse<string>> {
    return apiResponse(this.appService.totalRedemptionRequested().then(String), 200)
  }

  @Get('/total-redeemed')
  getTotalRedeemed(): Promise<ApiResponse<string>> {
    return apiResponse(this.appService.totalRedeemed().then(String), 200)
  }

  @Get('/total-redemption-requesters')
  getTotalRedemptionRequesters(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalRedemptionRequesters(), 200)
  }

  @Get('/total-collateral-reservers')
  getTotalCollateralReservers(): Promise<ApiResponse<number>> {
    return apiResponse(this.appService.totalCollateralReservers(), 200)
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
    console.log(agent)
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
}
