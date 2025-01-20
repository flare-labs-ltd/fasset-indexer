import { Injectable, Inject } from '@nestjs/common'
import { DashboardAnalytics } from 'fasset-indexer-core/analytics'
import type { ApiContext } from 'src/config/context'


@Injectable()
export class DashboardService extends DashboardAnalytics {

  constructor(@Inject('apiContext') config: ApiContext) {
    super(config.orm, config.chain, config.loader.addressesJson)
  }
}