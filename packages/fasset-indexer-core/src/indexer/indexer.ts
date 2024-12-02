import chalk, { Chalk } from 'chalk'
import { sleep } from '../utils'
import { getVar, setVar } from '../utils'
import { StateUpdater } from './eventlib/state-updater'
import { EventParser } from './eventlib/event-parser'
import { EventScraper } from './eventlib/event-scraper'
import {
  FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY, EVM_LOG_FETCH_SIZE,
  MID_CHAIN_FETCH_SLEEP_MS, EVM_LOG_FETCH_SLEEP_MS,
  EVM_BLOCK_HEIGHT_OFFSET
} from '../config/constants'
import type { Log } from 'ethers'
import type { Context } from '../context/context'


export class EventIndexer {
  color: Chalk = chalk.green
  readonly eventScraper: EventScraper
  readonly eventParser: EventParser
  readonly stateUpdater: StateUpdater

  constructor(public readonly context: Context) {
    this.eventScraper = new EventScraper(context)
    this.eventParser = new EventParser(context)
    this.stateUpdater = new StateUpdater(context)
  }

  async run(startBlock?: number): Promise<void> {
    console.log(chalk.cyan('starting event indexer'))
    while (true) {
      try {
        await this.runHistoric(startBlock)
      } catch (e: any) {
        console.error(`Error running event indexer: ${e}`)
        await sleep(MID_CHAIN_FETCH_SLEEP_MS)
        continue
      }
      await sleep(EVM_LOG_FETCH_SLEEP_MS)
    }
  }

  async runHistoric(startBlock?: number, endBlock?: number): Promise<void> {
    const firstUnhandledBlock = await this.getFirstUnhandledBlock()
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
      console.log(this.color(`Processed logs from block ${i} to block ${endLoopBlock}`))
      if (endLoopBlock < endBlock) await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

  async lastBlockToHandle(): Promise<number> {
    const blockHeight = await this.context.provider.getBlockNumber()
    return blockHeight - EVM_BLOCK_HEIGHT_OFFSET
  }

  async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY)
    return firstUnhandled !== null ? parseInt(firstUnhandled.value!) : await this.context.minBlockNumber()
  }

  async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK_DB_KEY, blockNumber.toString())
  }

  async storeLogs(logs: Log[]): Promise<void> {
    let lastHandledBlock: number | null = null
    for (const log of logs) {
      const fullLog = await this.eventParser.logToEvent(log)
      if (fullLog !== null) {
        await this.stateUpdater.processEvent(fullLog)
      }
      if (lastHandledBlock === null || lastHandledBlock < log.blockNumber) {
        lastHandledBlock = log.blockNumber
        await this.setFirstUnhandledBlock(lastHandledBlock)
      }
    }
  }

}