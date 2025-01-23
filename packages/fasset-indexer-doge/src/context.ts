import { createOrm, type ORM } from "fasset-indexer-core/database"
import { DogeCoin } from "./client/dogecoin"
import { DogeConfigLoader } from "./config/config"


export class DogeContext {

  constructor(
    public readonly dogecoin: DogeCoin,
    public readonly orm: ORM
  ) { }

  static async create(config: DogeConfigLoader) {
    const dogecoin = new DogeCoin(
      config.dogeRpcUrl,
      config.dogeRpcApiKey,
      config.dogeRpcAuth
    )
    const orm = await createOrm(config.dbConfig, 'safe')
    return new DogeContext(dogecoin, orm)
  }
}