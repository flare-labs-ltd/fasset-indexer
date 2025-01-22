import { getVar, setVar } from "../../utils"
import { EventIndexer } from "../indexer"
import { logger } from "../../logger"
import type { Context } from "../../context/context"


const BLOCK_INDEX_NUMBER = 92
const NEW_BLOCKS_BEFORE_INDEX = 15

export class EventIndexerParallelRacePopulation {
  readonly eventIndexer: EventIndexer
  readonly backIndexer: EventIndexer

  constructor(context: Context, backInsertionEvents: string[], updateName: string, frontInsertionEvents?: string[]) {
    this.eventIndexer = new EventIndexer(context, frontInsertionEvents)
    this.backIndexer = new EventIndexer(context, backInsertionEvents, updateName)
  }

  async run() {
    while (true) {
      // back index first
      try {
        const firstUnhandledBlockBack = await this.backIndexer.firstUnhandledBlock()
        const lastBlockToHandleBack = await this.backIndexer.lastBlockToHandle()
        if (firstUnhandledBlockBack <= lastBlockToHandleBack) {
          await this.backIndexer.runHistoric(firstUnhandledBlockBack, firstUnhandledBlockBack + BLOCK_INDEX_NUMBER)
        }
      } catch (e: any) {
        logger.error(`Error running back indexer: ${e}`)
      }
      const stopFrontIndexer = await getVar(this.eventIndexer.context.orm.em.fork(), 'stop_front_indexer')
      if (stopFrontIndexer != null) {
        continue
      }
      const firstUnhandledBlockBack = await this.backIndexer.firstUnhandledBlock()
      const firstUnhandledBlockFront = await this.eventIndexer.firstUnhandledBlock()
      if (firstUnhandledBlockBack > firstUnhandledBlockFront) {
        // switch back indexer for the front indexer
        this.backIndexer.firstUnhandledEventBlockName = this.eventIndexer.firstUnhandledEventBlockName
        await setVar(this.eventIndexer.context.orm.em.fork(), 'stop_front_indexer', 'true')
        await this.backIndexer.setFirstUnhandledBlock(firstUnhandledBlockBack)
        continue
      }
      // then front index
      try {
        const firstUnhandledBlock = await this.eventIndexer.firstUnhandledBlock()
        const lastUnhandledBlock = await this.eventIndexer.lastBlockToHandle()
        if (lastUnhandledBlock - firstUnhandledBlock > NEW_BLOCKS_BEFORE_INDEX) {
          await this.eventIndexer.runHistoric(firstUnhandledBlock, firstUnhandledBlock + BLOCK_INDEX_NUMBER)
        }
      } catch (e: any) {
        logger.error(`Error running front indexer: ${e}`)
      }
    }
  }
}