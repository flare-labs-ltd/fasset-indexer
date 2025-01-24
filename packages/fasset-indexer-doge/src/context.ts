import { createOrm, type ORM } from "fasset-indexer-core/orm"
import { DogeClient } from "./client/dogecoin"
import { DogeConfigLoader } from "./config/config"


export class DogeContext {

  constructor(
    public readonly dogecoin: DogeClient,
    public readonly orm: ORM
  ) { }

  static async create(config: DogeConfigLoader) {
    const dogecoin = new DogeClient(
      config.dogeRpcUrl,
      config.dogeRpcApiKey,
      config.dogeRpcAuth
    )
    const orm = await createOrm(config.dbConfig, 'safe')
    return new DogeContext(dogecoin, orm)
  }
}