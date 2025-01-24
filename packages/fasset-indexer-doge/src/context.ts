import { createOrm, type ORM } from "fasset-indexer-core/orm"
import { DogeClient } from "./client/doge-client"
import { DogeConfigLoader } from "./config/config"

function decodeAuthHeader(header: string): { username: string, password: string } {
  const base64 = header.split(' ')[1]
  const decoded = Buffer.from(base64, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  return { username, password }
}


export class DogeContext {

  constructor(
    public readonly dogecoin: DogeClient,
    public readonly orm: ORM
  ) { }

  static async create(config: DogeConfigLoader) {
    const dogecoin = new DogeClient(
      config.dogeRpcUrl,
      config.dogeRpcUser,
      config.dogeRpcPassword,
      config.dogeRpcApiKey
    )
    const orm = await createOrm(config.dbConfig, 'safe')
    return new DogeContext(dogecoin, orm)
  }
}