import type { Context } from "../../context"
import type { Log, LogDescription } from "ethers"


export type EventArgs = any[]

export interface FullLog {
  name: string
  args: EventArgs
  blockNumber: number
  transactionIndex: number
  logIndex: number
  source: string
  blockTimestamp: number
  transactionHash: string
  transactionSource: string
  transactionTarget: string | null
}

interface LogUri {
  blockNumber: number
  transactionIndex: number
  index: number
}

export class EventScraper {
  constructor(public readonly context: Context) { }

  async getLogs(from: number, to: number, sources: string[]): Promise<FullLog[]> {
    const rawLogs = await this.getRawLogs(from, to)
    return this.expandToFullLogs(rawLogs
      .filter(log => sources.includes(log.address))
      .sort(EventScraper.logOrder)
    )
  }

  async getRawLogs(fromBlock: number, toBlock: number): Promise<Log[]> {
    return this.context.provider.getLogs({ fromBlock, toBlock })
  }

  protected async expandToFullLogs(rawLogs: Log[]): Promise<FullLog[]> {
    let blockTimestamp: number | null = null
    let lastBlockNumber: number | null = null
    const logs: FullLog[] = []
    for (const log of rawLogs) {
      const logDescription = this.parseRawLog(log)
      if (logDescription === null) continue
      if (blockTimestamp === null || lastBlockNumber !== log.blockNumber) {
        const block = await this.context.provider.getBlock(log.blockNumber)
        if (block === null) {
          throw new Error(`Failed to fetch block ${log.blockNumber}`)
        }
        blockTimestamp = block.timestamp
        lastBlockNumber = log.blockNumber
      }
      const transaction = await this.context.provider.getTransaction(log.transactionHash)
      if (transaction === null) {
        throw new Error(`Failed to fetch transaction ${log.transactionHash}`)
      }
      logs.push({
        name: logDescription.name,
        args: logDescription.args,
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.index,
        source: log.address,
        blockTimestamp: blockTimestamp,
        transactionHash: log.transactionHash,
        transactionSource: transaction.from,
        transactionTarget: transaction.to
      })
    }
    return logs
  }

  protected parseRawLog(rawLog: Log): LogDescription | null {
    let desc = this.context.assetManagerEventInterface.parseLog(rawLog)
    if (desc === null) {
      desc = this.context.collateralPoolInterface.parseLog(rawLog)
    }
    return desc
  }

  private static logOrder(log1: LogUri, log2: LogUri): number {
    if (log1.blockNumber !== log2.blockNumber) {
        return log1.blockNumber - log2.blockNumber;
    } else if (log1.transactionIndex !== log2.transactionIndex) {
        return log1.transactionIndex - log2.transactionIndex;
    } else {
        return log1.index - log2.index;
    }
  }
}