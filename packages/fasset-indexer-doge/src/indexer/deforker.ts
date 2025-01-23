import { setVar, type EntityManager } from "fasset-indexer-core/database"
import { DogeBlock, DogeVoutReference } from "fasset-indexer-core/entities"
import { DogeContext } from "../context"
import { FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY } from "../config/constants"
import { logger } from "fasset-indexer-core/logger"


export class DogeDeforker {
  constructor(public readonly context: DogeContext) { }

  async defork(): Promise<void> {
    const em = this.context.orm.em.fork()
    const lastBlock = await this.dbBlockHeight(em)
    if (lastBlock === null) return
    for (let i = lastBlock; i >= 0; i -= 1) {
      const dbBlock = this.required(await this.dbBlockAt(em, i))
      const rpcBlock = this.required(await this.context.dogecoin.dogeBlock(i))
      if (dbBlock.hash !== rpcBlock.hash) {
        logger.alert(`purging blocks at height ${i} due to found fork`)
        await this.purgeDataAtHeight(i)
      } else {
        break
      }
    }
  }

  protected async purgeDataAtHeight(height: number): Promise<void> {
    await this.context.orm.em.transactional(async em => {
      await em.nativeDelete(DogeBlock, { height })
      await em.nativeDelete(DogeVoutReference, { block: { height } })
      await setVar(em, FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY, height.toString())
    })
  }

  protected async dbBlockHeight(em: EntityManager): Promise<number | null> {
    const lastBlock = await em.findAll(DogeBlock, { orderBy: { height: 'DESC' }, limit: 1 })
    return lastBlock?.[0]?.height ?? null
  }

  protected async dbBlockAt(em: EntityManager, height: number): Promise<DogeBlock | null> {
    return em.findOne(DogeBlock, { height })
  }

  private required<T>(val: T | null): T {
    if (val == null) {
      throw new Error(`Unexpected null value ${val}`)
    }
    return val
  }

}