import { Injectable, Inject } from '@nestjs/common'
import { Statistics } from 'fasset-indexer-core/analytics'
import type { ApiContext } from 'src/config/context'


@Injectable()
export class StatisticsService extends Statistics {

  constructor(@Inject('apiContext') context: ApiContext) {
    super(context.orm)
  }
}