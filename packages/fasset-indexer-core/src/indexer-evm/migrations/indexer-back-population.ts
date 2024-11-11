import chalk from "chalk"
import { sleep, getVar, setVar } from "../../utils"
import { EventIndexer } from "../evm-indexer"
import { EVM_LOG_FETCH_SLEEP_MS, MIN_EVM_BLOCK_NUMBER } from "../../config/constants"
import type { Log } from "ethers"
import type { Context } from "../../context/context"


export class EventIndexerBackPopulation extends EventIndexer {
  private endEventBlockForCurrentUpdateKey: string
  private firstEventBlockForCurrentUpdateKey: string
  private insertionTopics: Set<string>

  constructor(context: Context, public insertionEvents: string[], public updateName: string) {
    super(context)
    this.color = chalk.yellow
    this.insertionTopics = new Set(context.eventsToTopics(insertionEvents))
    this.endEventBlockForCurrentUpdateKey = `endEventBlock_${updateName}`
    this.firstEventBlockForCurrentUpdateKey = `firstUnhandledEventBlock_${updateName}`
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
    return firstUnhandled !== null ? parseInt(firstUnhandled!.value!) : MIN_EVM_BLOCK_NUMBER
  }

  override async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), this.firstEventBlockForCurrentUpdateKey, blockNumber.toString())
  }

  override async storeLogs(logs: Log[]): Promise<void> {
    logs = logs.filter(log => this.insertionTopics.has(log.topics[0]))
    await super.storeLogs(logs)
  }
}

