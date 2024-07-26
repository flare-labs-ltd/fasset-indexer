import { EventIndexer } from "../indexer"
import { EventIndexerBackInsertion } from "./back-insertion-indexer"
import type { Context } from "../../context"


const BLOCK_INDEX_NUMBER = 92
const NEW_BLOCKS_BEFORE_INDEX = 15

export class EventIndexerBackAndFrontInsertion {
  readonly eventIndexer: EventIndexer
  readonly backIndexer: EventIndexerBackInsertion

  constructor(context: Context) {
    this.eventIndexer = new EventIndexer(context)
    this.backIndexer = new EventIndexerBackInsertion(context)
  }

  async run() {
    while (true) {
      // back index first
      try {
        const firstUnhandledBlockBack = await this.backIndexer.getFirstUnhandledBlock()
        const lastBlockToHandleBack = await this.backIndexer.lastBlockToHandle()
        if (firstUnhandledBlockBack <= lastBlockToHandleBack) {
          await this.backIndexer.runHistoric(firstUnhandledBlockBack, firstUnhandledBlockBack + BLOCK_INDEX_NUMBER)
        }
      } catch (e: any) {
        console.error(`Error running back indexer: ${e}`)
      }
      // then front index
      try {
        const firstUnhandledBlock = await this.eventIndexer.getFirstUnhandledBlock()
        const lastUnhandledBlock = await this.eventIndexer.lastBlockToHandle()
        if (lastUnhandledBlock - firstUnhandledBlock > NEW_BLOCKS_BEFORE_INDEX) {
          await this.eventIndexer.runHistoric(firstUnhandledBlock, firstUnhandledBlock + BLOCK_INDEX_NUMBER)
        }
      } catch (e: any) {
        console.error(`Error running front indexer: ${e}`)
      }
    }
  }
}