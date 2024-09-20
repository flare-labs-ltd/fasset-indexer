import chalk, { Chalk } from 'chalk'
import { sleep } from '../utils'
import { getVar, setVar } from '../utils'
import { Blockbook } from './blockbook/blockbook'
import { BtcStateUpdater } from './lib/btc-state-updater'
import {
  MID_CHAIN_FETCH_SLEEP_MS,
  BTC_BLOCK_HEIGHT_OFFSET,
  FIRST_UNHANDLED_BTC_BLOCK,
  BTC_BLOCK_FETCH_SLEEP_MS,
  MIN_BTC_BLOCK_NUMBER
} from '../config/constants'
import type { Context } from '../context'
import type { BlockbookBlock } from './blockbook/interface'


export class BtcIndexer {
  color: Chalk = chalk.green
  private blockbook: Blockbook
  private btcTxStorer: BtcStateUpdater

  constructor(public readonly context: Context) {
    this.blockbook = new Blockbook(context.config.btcRpc.url, context.config.btcRpc.apiKey)
    this.btcTxStorer = new BtcStateUpdater(context)
  }

  async run(startBlock?: number): Promise<void> {
    console.log(chalk.cyan('starting Bitcoin indexer'))
    while (true) {
      try {
        await this.runHistoric(startBlock)
      } catch (e: any) {
        console.error(`Error running Bitcoin indexer: ${e}`)
      }
      await sleep(BTC_BLOCK_FETCH_SLEEP_MS)
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
    for (let i = startBlock; i <= endBlock; i += 1) {
      const block = await this.blockbook.block(i)
      await this.storeTransactions(block)
      await this.setFirstUnhandledBlock(i + 1)
      console.log(this.color(`Processed Bitcoin transactions from block ${i}`))
      if (i < endBlock) await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

  async lastBlockToHandle(): Promise<number> {
    const blockHeight = await this.blockbook.blockHeight()
    return blockHeight - BTC_BLOCK_HEIGHT_OFFSET
  }

  async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), FIRST_UNHANDLED_BTC_BLOCK)
    return firstUnhandled !== null ? parseInt(firstUnhandled!.value!) : MIN_BTC_BLOCK_NUMBER
  }

  async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), FIRST_UNHANDLED_BTC_BLOCK, blockNumber.toString())
  }

  async storeTransactions(block: BlockbookBlock): Promise<void> {
    await this.btcTxStorer.processBlock(block)
  }

}