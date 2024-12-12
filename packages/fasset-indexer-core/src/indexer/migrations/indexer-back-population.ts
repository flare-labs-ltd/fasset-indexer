import { sleep, getVar, setVar } from "../../utils"
import { EventIndexer } from "../indexer"
import { logger } from "../../logger"
import { EVM_LOG_FETCH_SLEEP_MS } from "../../config/constants"
import type { Log } from "ethers"
import type { Context } from "../../context/context"


export class EventIndexerBackPopulation extends EventIndexer {
  private endEventBlockForCurrentUpdateKey: string
  private firstEventBlockForCurrentUpdateKey: string
  private insertionTopics: Set<string>

  constructor(context: Context, public insertionEvents: string[], public updateName: string) {
    super(context, insertionEvents)
    this.insertionTopics = new Set(context.getTopicToIfaceMap(insertionEvents).keys())
    this.endEventBlockForCurrentUpdateKey = `endEventBlock_${updateName}`
    this.firstEventBlockForCurrentUpdateKey = `firstUnhandledEventBlock_${updateName}`
  }

  override async run(startBlock?: number): Promise<void> {
    logger.info(`starting ${this.context.chain} indexer with back-population`)
    while (true) {
      try {
        await this.runHistoric(startBlock)
        logger.info('finished with back-population')
        return
      } catch (e: any) {
        logger.error(`error running indexer with back-population: ${e}`)
      }
      await sleep(EVM_LOG_FETCH_SLEEP_MS)
    }
  }

  override async lastBlockToHandle(): Promise<number> {
    const endBlock = await getVar(this.context.orm.em.fork(), this.endEventBlockForCurrentUpdateKey)
    if (endBlock === null) {
      const endBlock = await super.getFirstUnhandledBlock()
      await setVar(this.context.orm.em.fork(), this.endEventBlockForCurrentUpdateKey, endBlock.toString())
      return endBlock
    }
    return parseInt(endBlock.value!)
  }

  override async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), this.firstEventBlockForCurrentUpdateKey)
    return firstUnhandled !== null ? parseInt(firstUnhandled.value!) : await this.minBlockNumber()
  }

  override async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), this.firstEventBlockForCurrentUpdateKey, blockNumber.toString())
  }

  override async storeLogs(logs: Log[]): Promise<void> {
    logs = logs.filter(log => this.insertionTopics.has(log.topics[0]))
    await super.storeLogs(logs)
  }
}

