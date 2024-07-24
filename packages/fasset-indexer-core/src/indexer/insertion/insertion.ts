import { sleep } from "../../utils"
import { deleteVar, getVar, setVar } from "../shared"
import { EventIndexer } from "../indexer"
import { COLLATERAL_POOL_ENTER, COLLATERAL_POOL_EXIT, ERC20_TRANSFER, LOG_FETCH_SLEEP_MS, MIN_BLOCK_NUMBER, SELF_CLOSE } from "../../config/constants"
import type { FullLog } from "../eventlib/event-scraper"


const START_INSERTION_BLOCK = "collateralPoolEventsAndTransactionSenders"
const END_INSERTION_BLOCK = START_INSERTION_BLOCK + "_endBlock"
const INSERTION_EVENTS: string[] = [ COLLATERAL_POOL_ENTER, COLLATERAL_POOL_EXIT, SELF_CLOSE, ERC20_TRANSFER ]

export class EventIndexerInsertion extends EventIndexer {

  override async run(startBlock?: number): Promise<void> {
    while (true) {
      try {
        await this.runHistoric(startBlock)
        // delete all data if we have caught up to the current block
        const lastToHandle = await this.lastBlockToHandle()
        const firstUnhandled = await this.getFirstUnhandledBlock()
        if (firstUnhandled >= lastToHandle) {
          await deleteVar(this.context.orm.em.fork(), END_INSERTION_BLOCK)
          await deleteVar(this.context.orm.em.fork(), START_INSERTION_BLOCK)
          break
        }
      } catch (e: any) {
        console.error(`Error running indexer insertion: ${e}`)
      }
      await sleep(LOG_FETCH_SLEEP_MS)
    }
  }

  protected override async storeLogs(logs: FullLog[]): Promise<void> {
    logs = logs.filter(log => INSERTION_EVENTS.includes(log.name))
    await super.storeLogs(logs)
  }

  protected override async lastBlockToHandle(): Promise<number> {
    const endBlock = await getVar(this.context.orm.em.fork(), END_INSERTION_BLOCK)
    if (endBlock === null) {
      const endBlock = super.getFirstUnhandledBlock()
      await setVar(this.context.orm.em.fork(), END_INSERTION_BLOCK, endBlock.toString())
      return endBlock
    }
    return parseInt(endBlock.value!)
  }

  protected override async getFirstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), START_INSERTION_BLOCK)
    return firstUnhandled !== null ? parseInt(firstUnhandled!.value!) : MIN_BLOCK_NUMBER
  }

  protected override async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), START_INSERTION_BLOCK, blockNumber.toString())
  }
}

