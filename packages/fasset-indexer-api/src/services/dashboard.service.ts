import { Injectable, Inject } from '@nestjs/common'
import { DashboardAnalytics, type ORM } from 'fasset-indexer-core'


@Injectable()
export class DashboardService extends DashboardAnalytics {

  constructor(@Inject('ORM') orm: ORM) {
    super(orm)
  }
}