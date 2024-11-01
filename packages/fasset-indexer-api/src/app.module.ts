import { APP_INTERCEPTOR } from '@nestjs/core'
import { Module } from '@nestjs/common'
import { CACHE_TTL_METADATA, CacheInterceptor, CacheModule } from '@nestjs/cache-manager'
import { FAssetIndexerService } from './services/indexer.service'
import { MiscController } from './controllers/main.controller'
import { DashboardController } from './controllers/dashboard.controller'
import { createOrm, getUserDatabaseConfig, getOrmConfig } from 'fasset-indexer-core'
import { CacheService } from './services/cache.service'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from './constants'


const fAssetIndexerServiceProvider = {
  provide: FAssetIndexerService,
  useFactory: async () => {
    const databaseConfig = getUserDatabaseConfig()
    const ormConfig = getOrmConfig(databaseConfig)
    const orm = await createOrm(ormConfig, 'safe')
    return new FAssetIndexerService(orm)
  }
}

@Module({
  imports: [CacheModule.register({ ttl: CACHE_TTL_MS, max: CACHE_MAX_ENTRIES })],
  controllers: [DashboardController, MiscController],
  providers: [fAssetIndexerServiceProvider, CacheService]
})
export class FAssetIndexerModule {}
