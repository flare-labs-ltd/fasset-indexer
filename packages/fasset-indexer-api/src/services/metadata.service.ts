import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
import { MetadataAnalytics, type ORM } from 'fasset-indexer-core'


@Injectable()
export class MetadataService extends MetadataAnalytics {

  constructor(@Inject('ORM') orm: ORM, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super(orm)
  }

  keys(): Promise<string[]> {
    return this.cacheManager.store.keys()
  }
}