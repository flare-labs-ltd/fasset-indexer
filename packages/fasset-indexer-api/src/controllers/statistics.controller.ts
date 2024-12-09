import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common"
import { ApiQuery, ApiTags } from "@nestjs/swagger"
import { ApiResponse, apiResponse } from "../shared/api-response"
import { StatisticsService } from "src/services/statistics.service"
import { unixnow } from "src/shared/utils"

const STAT_LIMIT = 100

@ApiTags("Statistics")
@Controller("api/statistics")
export class StatisticsController {
  constructor(private readonly service: StatisticsService) { }

  @Get('/collateral-pool-score?')
  @ApiQuery({ name: 'pool', type: String, required: true })
  @ApiQuery({ name: 'delta', type: Number, required: true })
  getCollateralPoolScore(
    @Query('pool') pool: string,
    @Query('delta', ParseIntPipe) delta: number
  ): Promise<ApiResponse<bigint>> {
    return apiResponse(this.service.collateralPoolScore(pool, unixnow(), delta, STAT_LIMIT), 200)
  }

}