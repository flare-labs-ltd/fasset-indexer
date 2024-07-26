import { Module } from '@nestjs/common'
import { FAssetIndexerService } from './app.service'
import { FAssetIndexerController } from './app.controller'
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
  controllers: [FAssetIndexerController],
  providers: [fAssetIndexerServiceProvider]
})
export class FAssetIndexerModule {}
