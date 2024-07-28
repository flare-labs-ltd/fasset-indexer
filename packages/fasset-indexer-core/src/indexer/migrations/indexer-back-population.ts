import chalk from "chalk"
import { sleep } from "../../utils"
import { getVar, setVar } from "../shared"
import { EventIndexer } from "../indexer"
import {
  COLLATERAL_POOL_ENTER, COLLATERAL_POOL_EXIT, SELF_CLOSE, ERC20_TRANSFER,
  LOG_FETCH_SLEEP_MS, MIN_BLOCK_NUMBER,
  END_EVENT_BLOCK__UPDATE_1, FIRST_UNHANDLED_EVENT_BLOCK__UPDATE_1
} from "../../config/constants"
import type { Log } from "ethers"
import type { Context } from "../../context"


const INSERTION_EVENTS: string[] = [
  COLLATERAL_POOL_ENTER,
  COLLATERAL_POOL_EXIT,
  SELF_CLOSE,
  ERC20_TRANSFER
]

export class EventIndexerBackPopulation extends EventIndexer {

  constructor(context: Context) {
    super(context)
    this.color = chalk.yellow
  }

  override async run(startBlock?: number): Promise<void> {
    console.log(chalk.cyan('starting indexer with back-insertions'))
    while (true) {
      try {
        await this.runHistoric(startBlock)
        console.log(this.color('finished with back-insertions'))
        return
      } catch (e: any) {
        console.error(`Error running indexer insertion: ${e}`)
      }
      await sleep(LOG_FETCH_SLEEP_MS)
    }
  }

  override async lastBlockToHandle(): Promise<number> {
    const endBlock = await getVar(this.context.orm.em.fork(), END_EVENT_BLOCK__UPDATE_1)
    if (endBlock === null) {
      const endBlock = await super.getFirstUnhandledBlock()
      await setVar(this.context.orm.em.fork(), END_EVENT_BLOCK__UPDATE_1, endBlock.toString())
      return endBlock
    }
    return parseInt(endBlock.value!)
  }

  override async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK__UPDATE_1)
    return firstUnhandled !== null ? parseInt(firstUnhandled!.value!) : MIN_BLOCK_NUMBER
  }

  override async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), FIRST_UNHANDLED_EVENT_BLOCK__UPDATE_1, blockNumber.toString())
  }

  protected override async storeLogs(logs: Log[]): Promise<void> {
    logs = logs.filter(async log => {
      const desc = await this.parseLog(log)
      return desc !== null && INSERTION_EVENTS.includes(desc.name)
    })
    await super.storeLogs(logs)
  }
}

