import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { DashboardService } from './services/dashboard.service'
import { NotificationService } from './services/notification.service'
import { MetadataService } from './services/metadata.service'
import { NotificationController } from './controllers/notification.controller'
import { DashboardController } from './controllers/dashboard.controller'
import { createOrm, getUserDatabaseConfig, getOrmConfig, getVar } from 'fasset-indexer-core'
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from './constants'
import { MetadataController } from './controllers/metadata.controller'
import { apiConfig, DatabaseConfig } from './config'


const configProvider = {
  provide: "config",
  useFactory: async () => {
    const databaseConfig = getUserDatabaseConfig()
    const ormConfig = getOrmConfig(databaseConfig)
    const orm = await createOrm(ormConfig, 'safe')
    const chain = await getVar(orm.em.fork(), 'chain')
    if (chain == null) throw new Error('Chain not set in database')
    const addressesJson = apiConfig.addressesJson
    return { orm, chain: chain.value!, addressesJson } as DatabaseConfig
  }
}

@Module({
  imports: [CacheModule.register({ ttl: CACHE_TTL_MS, max: CACHE_MAX_ENTRIES })],
  controllers: [DashboardController, NotificationController, MetadataController],
  providers: [configProvider, DashboardService, NotificationService, MetadataService]
})
export class FAssetIndexerModule {}
