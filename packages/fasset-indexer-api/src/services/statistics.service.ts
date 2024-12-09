import { Injectable, Inject } from '@nestjs/common'
import { Statistics } from 'fasset-indexer-core'
import type { DatabaseConfig } from '../config'


@Injectable()
export class StatisticsService extends Statistics {

  constructor(@Inject('config') config: DatabaseConfig) {
    super(config.orm)
  }
}