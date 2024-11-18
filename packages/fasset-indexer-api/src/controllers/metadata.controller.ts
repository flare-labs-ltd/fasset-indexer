import { Controller, Get } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { ApiResponse, apiResponse } from "../shared/api-response"
import { MetadataService } from "../services/metadata.service"

@ApiTags("Metadata")
@Controller("api/indexer")
export class MetadataController {

  constructor(
    private readonly service: MetadataService,
  ) {}

  @Get('/cache')
  getCache(): Promise<any> {
    return this.service.keys()
  }

  @Get('/current-block')
  getCurrentBlock(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.service.currentBlock(), 200)
  }

  @Get('/current-btc-block')
  getCurrentBtcBlock(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.service.currentBtcBlock(), 200)
  }

  @Get('/blocks-to-back-sync')
  getBlocksToBackSync(): Promise<ApiResponse<number | null>> {
    return apiResponse(this.service.blocksToBackSync(), 200)
  }

}