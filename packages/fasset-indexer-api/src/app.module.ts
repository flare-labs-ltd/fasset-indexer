import { Module } from '@nestjs/common'
import { FAssetIndexerService } from './app.service'
import { MiscController } from './controllers/main.controller'
import { DashboardController } from './controllers/dashboard.controller'
import { createOrm, getUserDatabaseConfig, getOrmConfig } from 'fasset-indexer-core'


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
  imports: [],
  controllers: [DashboardController, MiscController],
  providers: [fAssetIndexerServiceProvider]
})
export class FAssetIndexerModule {}
