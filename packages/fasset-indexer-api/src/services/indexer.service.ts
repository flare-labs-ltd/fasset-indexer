import { Injectable, Inject } from '@nestjs/common'
import { Analytics, type ORM } from 'fasset-indexer-core'


@Injectable()
export class FAssetIndexerService extends Analytics {

  constructor(@Inject('ORM') orm: ORM) {
    super(orm)
  }
}