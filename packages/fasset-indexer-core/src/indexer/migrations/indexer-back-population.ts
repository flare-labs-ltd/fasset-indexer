import { getVar, setVar } from "../../utils"
import { EventIndexer } from "../indexer"
import type { Context } from "../../context/context"


export class EventIndexerBackPopulation extends EventIndexer {
  private endEventBlockForCurrentUpdateKey: string
  private firstEventBlockForCurrentUpdateKey: string

  constructor(context: Context, public insertionEvents: string[], public updateName: string) {
    super(context, insertionEvents)
    this.endEventBlockForCurrentUpdateKey = `endEventBlock_${updateName}`
    this.firstEventBlockForCurrentUpdateKey = `firstUnhandledEventBlock_${updateName}`
  }

  override async lastBlockToHandle(): Promise<number> {
    const endBlock = await getVar(this.context.orm.em.fork(), this.endEventBlockForCurrentUpdateKey)
    if (endBlock === null) {
      const endBlock = await super.firstUnhandledBlock()
      await setVar(this.context.orm.em.fork(), this.endEventBlockForCurrentUpdateKey, endBlock.toString())
      return endBlock
    }
    return parseInt(endBlock.value!)
  }

  override async firstUnhandledBlock(): Promise<number> {
    const firstUnhandled = await getVar(this.context.orm.em.fork(), this.firstEventBlockForCurrentUpdateKey)
    return firstUnhandled !== null ? parseInt(firstUnhandled.value!) : await this.minBlockNumber()
  }

  override async setFirstUnhandledBlock(blockNumber: number): Promise<void> {
    await setVar(this.context.orm.em.fork(), this.firstEventBlockForCurrentUpdateKey, blockNumber.toString())
  }
}

