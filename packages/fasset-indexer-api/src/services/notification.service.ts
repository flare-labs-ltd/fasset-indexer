import { Injectable, Inject } from '@nestjs/common'
import { NotificationAnalytics } from 'fasset-indexer-core'
import type { DatabaseConfig } from '../config'


@Injectable()
export class NotificationService extends NotificationAnalytics {

  constructor(@Inject('config') config: DatabaseConfig) {
    super(config.orm)
  }
}