import { Injectable, Inject } from '@nestjs/common'
import { NotificationAnalytics, type ORM } from 'fasset-indexer-core'


@Injectable()
export class NotificationService extends NotificationAnalytics {

  constructor(@Inject('ORM') orm: ORM) {
    super(orm)
  }
}