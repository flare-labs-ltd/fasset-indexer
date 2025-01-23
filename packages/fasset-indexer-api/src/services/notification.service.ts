import { Injectable, Inject } from '@nestjs/common'
import { NotificationAnalytics } from '../analytics/notification'
import type { ApiContext } from 'src/config/context'


@Injectable()
export class NotificationService extends NotificationAnalytics {

  constructor(@Inject('apiContext') context: ApiContext) {
    super(context.orm)
  }
}