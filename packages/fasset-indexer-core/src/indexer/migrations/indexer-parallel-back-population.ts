import { EventIndexer } from "../indexer"
import { EventIndexerBackPopulation } from "./indexer-back-population"
import { logger } from "../../logger"
import type { Context } from "../../context/context"


const BLOCK_INDEX_NUMBER = 92
const NEW_BLOCKS_BEFORE_INDEX = 15

export class EventIndexerParallelBackPopulation {
  readonly eventIndexer: EventIndexer
  readonly backIndexer: EventIndexerBackPopulation

  constructor(context: Context, backInsertionEvents: string[], updateName: string, frontInsertionEvents?: string[]) {
    this.eventIndexer = new EventIndexer(context, frontInsertionEvents)
    this.backIndexer = new EventIndexerBackPopulation(context, backInsertionEvents, updateName)
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