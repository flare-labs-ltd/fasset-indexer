import { sleep } from '../utils'
import { getVar, setVar } from '../utils'
import { StateUpdater } from './eventlib/state-updater'
import { EventParser } from './eventlib/event-parser'
import { EventScraper } from './eventlib/event-scraper'
import { logger } from '../logger'
import {
  FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY,
  EVM_LOG_FETCH_SIZE,
  MID_CHAIN_FETCH_SLEEP_MS,
  EVM_LOG_FETCH_SLEEP_MS,
  EVM_BLOCK_HEIGHT_OFFSET,
  MIN_EVM_BLOCK_NUMBER_DB_KEY
} from '../config/constants'
import type { Log } from 'ethers'
import type { Context } from '../context/context'


export class EventIndexer {
  eventScraper: EventScraper
  eventParser: EventParser
  stateUpdater: StateUpdater

  constructor(public readonly context: Context, eventnames?: string[],
    public firstUnhandledEventBlockName = FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY
  ) {
    this.eventScraper = new EventScraper(context)
    this.eventParser = new EventParser(context, eventnames)
    this.stateUpdater = new StateUpdater(context)
  }

  async run(startBlock?: number): Promise<void> {
    while (true) {
      try {
        await this.runHistoric(startBlock)
      } catch (e: any) {
        logger.error(`error running event indexer: ${e}`)
        await sleep(MID_CHAIN_FETCH_SLEEP_MS)
        continue
      }
      await sleep(EVM_LOG_FETCH_SLEEP_MS)
    }
  }

  async runHistoric(startBlock?: number, endBlock?: number): Promise<void> {
    const firstUnhandledBlock = await this.firstUnhandledBlock(startBlock)
    if (startBlock === undefined || firstUnhandledBlock > startBlock) {
      startBlock = firstUnhandledBlock
    }
    const lastBlockToHandle = await this.lastBlockToHandle()
    if (endBlock === undefined || endBlock > lastBlockToHandle) {
      endBlock = lastBlockToHandle
    }
    for (let i = startBlock; i <= endBlock; i += EVM_LOG_FETCH_SIZE + 1) {
      const endLoopBlock = Math.min(endBlock, i + EVM_LOG_FETCH_SIZE)
      const logs = await this.eventScraper.getLogs(i, endLoopBlock)
      await this.storeLogs(logs)
      await this.setFirstUnhandledBlock(endLoopBlock + 1)
      logger.info(`indexer processed ${this.context.chain} logs from block ${i} to ${endLoopBlock}`)
      if (endLoopBlock < endBlock) await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

  async lastBlockToHandle(): Promise<number> {
    const blockHeight = await this.context.provider.getBlockNumber()
    return blockHeight - EVM_BLOCK_HEIGHT_OFFSET
  }

  async firstUnhandledBlock(startBlock?: number): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), this.firstUnhandledEventBlockName)
    const aux = firstUnhandled !== null ? parseInt(firstUnhandled.value!) : startBlock
    return aux !== undefined ? aux: await this.minBlockNumber()
  }

  async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), this.firstUnhandledEventBlockName, blockNumber.toString())
  }

  protected async storeLogs(logs: Log[]): Promise<void> {
    let lastHandledBlock: number | null = null
    for (const log of logs) {
      const fullLog = await this.eventParser.logToEvent(log)
      if (fullLog !== null) {
        await this.stateUpdater.processEvent(fullLog)
        // optimization: store only for processed logs
        if (lastHandledBlock === null || lastHandledBlock < log.blockNumber) {
          lastHandledBlock = log.blockNumber
          await this.setFirstUnhandledBlock(lastHandledBlock)
        }
      }
    }
  }

  protected async minBlockNumber(): Promise<number> {
    const em = this.context.orm.em.fork()
    const fromDb = await getVar(em, MIN_EVM_BLOCK_NUMBER_DB_KEY)
    if (fromDb?.value != null) {
      return parseInt(fromDb.value)
    } else {
      throw new Error(`Could not find min block number in database`)
    }
  }

}