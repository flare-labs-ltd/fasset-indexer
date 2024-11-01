import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
import { Injectable, Inject } from '@nestjs/common'


@Injectable()
export class CacheService {

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  keys(): Promise<string[]> {
    return this.cacheManager.store.keys()
  }
}