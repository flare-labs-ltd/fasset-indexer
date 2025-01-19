import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
import { MetadataAnalytics } from 'fasset-indexer-core/analytics'
import type { DatabaseConfig } from '../config'


@Injectable()
export class MetadataService extends MetadataAnalytics {

  constructor(
    @Inject('config') config: DatabaseConfig,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super(config.orm)
  }

  keys(): Promise<string[]> {
    return this.cacheManager.store.keys()
  }
}