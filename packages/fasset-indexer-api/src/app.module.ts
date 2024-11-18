import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { DashboardService } from './services/dashboard.service'
import { NotificationService } from './services/notification.service'
import { MetadataService } from './services/metadata.service'
import { NotificationController } from './controllers/notification.controller'
import { DashboardController } from './controllers/dashboard.controller'
import { createOrm, getUserDatabaseConfig, getOrmConfig } from 'fasset-indexer-core'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from './constants'
import { MetadataController } from './controllers/metadata.controller'

const ormProvider = {
  provide: "ORM",
  useFactory: async () => {
    const databaseConfig = getUserDatabaseConfig()
    const ormConfig = getOrmConfig(databaseConfig)
    return createOrm(ormConfig, 'safe')
  }
}

@Module({
  imports: [CacheModule.register({ ttl: CACHE_TTL_MS, max: CACHE_MAX_ENTRIES })],
  controllers: [DashboardController, NotificationController, MetadataController],
  providers: [ormProvider, DashboardService, NotificationService, MetadataService]
})
export class FAssetIndexerModule {}
