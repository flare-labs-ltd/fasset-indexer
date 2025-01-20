import { createOrm, getVar, type ORM } from "fasset-indexer-core/database"
import type { ApiConfigLoader } from "./loader"


export class ApiContext {
    constructor(
      public readonly loader: ApiConfigLoader,
      public readonly orm: ORM,
      public readonly chain: string
    ) {}

    static async create(loader: ApiConfigLoader): Promise<ApiContext> {
      const orm = await createOrm(loader.dbConfig, 'safe')
      const chain = await this.getChain(orm)
      return new ApiContext(loader, orm, chain)
    }

    private static async getChain(orm: ORM): Promise<string> {
      const chain = await getVar(orm.em.fork(), 'chain')
      if (chain == null) throw new Error('Chain not set in database')
      return chain.value!
    }
  }