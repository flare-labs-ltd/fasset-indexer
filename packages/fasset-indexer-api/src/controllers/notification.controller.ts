import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { apiResponse, type ApiResponse } from '../shared/api-response'
import { NotificationService } from 'src/services/notification.service'


@ApiTags("Notification")
@Controller("api/notification")
export class NotificationController {

  constructor(
    private readonly service: NotificationService,
  ) {}

  @Get('/events-per-interval?')
  getEventsPerSecond(@Query('seconds') seconds: number): Promise<ApiResponse<number>> {
    return apiResponse(this.service.eventsPerInterval(seconds), 200)
  }

  @Get('/total-free-lots')
  getTotalFreeLots(): Promise<ApiResponse<{
    publicLots: bigint,
    privateLots: bigint,
    liquidationLots: bigint,
    normalLots: bigint
  }>> {
    return apiResponse(this.service.totalFreeLots(), 200)
  }

  @Get('/agents-in-liquidation')
  getAgentsInLiquidation(): Promise<ApiResponse<{ totalAgents: number, agentsInLiquidation: number }>> {
    return apiResponse(this.service.agentsInLiquidation().then(x => ({
      totalAgents: x[1],
      agentsInLiquidation: x[0]
    })), 200)
  }

  @Get('/full-liquidation-reason?')
  fullLiquidationReason(@Query('agent') agent: string): Promise<ApiResponse<any>> {
    return apiResponse(this.service.fullLiquidationReason(agent), 200)
  }

}
