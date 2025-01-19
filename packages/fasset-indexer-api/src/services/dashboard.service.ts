import { Injectable, Inject } from '@nestjs/common'
import { DashboardAnalytics } from 'fasset-indexer-core/analytics'
import type { DatabaseConfig } from '../config'


@Injectable()
export class DashboardService extends DashboardAnalytics {

  constructor(@Inject('config') config: DatabaseConfig) {
    super(config.orm, config.chain, config.addressesJson)
  }
}