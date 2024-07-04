import { sleep } from '../utils'
import { getVar, setVar } from './shared'
import { StateUpdater } from './eventlib/state-updater'
import { EventScraper, type FullLog } from './eventlib/event-scraper'
import {
  FIRST_UNHANDLED_EVENT_BLOCK, LOG_FETCH_SIZE,
  MID_CHAIN_FETCH_SLEEP_MS, MIN_BLOCK_NUMBER, LOG_FETCH_SLEEP_MS,
  BLOCK_HEIGHT_OFFSET
} from '../constants'
import type { Context } from '../context'


export class EventIndexer {
  readonly eventScraper: EventScraper
  readonly stateUpdater: StateUpdater

  constructor(public readonly context: Context) {
    this.eventScraper = new EventScraper(context)
    this.stateUpdater = new StateUpdater(context)
  }

  async run(startBlock?: number): Promise<void> {
    while (true) {
      try {
        await this.runHistoric(startBlock)
      } catch (e: any) {
        console.error(`Error running indexer: ${e}`)
      }
      await sleep(LOG_FETCH_SLEEP_MS)
    }
  }

  async runHistoric(startBlock?: number, endBlock?: number): Promise<void> {
    const firstUnhandledBlock = await this.getFirstUnhandledBlock()
    if (startBlock === undefined || firstUnhandledBlock > startBlock) {
      startBlock = firstUnhandledBlock
    }
    if (endBlock === undefined) {
      endBlock = await this.lastBlockToHandle()
    }
    for (let i = startBlock; i <= endBlock; i += LOG_FETCH_SIZE + 1) {
      const endLoopBlock = Math.min(endBlock, i + LOG_FETCH_SIZE)
      const logs = await this.eventScraper.getLogs(i, endLoopBlock)
      await this.storeLogs(logs)
      await this.setFirstUnhandledBlock(endLoopBlock + 1)
      console.log(`Processed logs from block ${i} to block ${endLoopBlock}`)
      if (endLoopBlock !== endBlock) await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

  protected async storeLogs(logs: FullLog[]): Promise<void> {
    let lastHandledBlock: number | null = null
    for (const log of logs) {
      await this.stateUpdater.onNewEvent(log)
      if (lastHandledBlock === null || lastHandledBlock < log.blockNumber) {
        lastHandledBlock = log.blockNumber
        await this.setFirstUnhandledBlock(lastHandledBlock)
      }
    }
  }

  protected async lastBlockToHandle(): Promise<number> {
    const blockHeight = await this.context.provider.getBlockNumber()
    return blockHeight - BLOCK_HEIGHT_OFFSET
  }

  protected async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK)
    return firstUnhandled !== null ? parseInt(firstUnhandled!.value!) : MIN_BLOCK_NUMBER
  }

  protected async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK, blockNumber.toString())
  }

}