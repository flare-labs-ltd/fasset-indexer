import { CollateralTypeAdded } from "../../database/entities/events/token"
import { AgentVault } from "../../database/entities/agent"
import { Context } from "../../context"
import { EVENTS, IGNORE_EVENTS } from "../../config/constants"
import type { Log, LogDescription } from "ethers"
import type { Event } from "./event-scraper"


export class EventParser {
  supportedEvents: Set<string>
  // cache
  private blockCache: {
    index: number
    timestamp: number
  } | null = null
  private transactionCache: {
    hash: string
    source: string
    target: string | null
  } | null = null

  constructor(public readonly context: Context) {
    this.supportedEvents = new Set(Object.values(EVENTS))
    for (const event of IGNORE_EVENTS) {
      this.supportedEvents.delete(event)
    }
  }

  async logToEvent(log: Log): Promise<Event | null> {
    const logDescription = await this.parseLog(log)
    if (logDescription === null)
      return null
    if (this.ignoreLog(logDescription.name))
      return null
    await this.updateCachedBlock(log.blockNumber)
    await this.updateCachedTransaction(log.transactionHash)
    return {
      name: logDescription.name,
      args: logDescription.args,
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      logIndex: log.index,
      source: log.address,
      blockTimestamp: this.blockCache!.timestamp,
      transactionHash: log.transactionHash,
      transactionSource: this.transactionCache!.source,
      transactionTarget: this.transactionCache!.target
    }
  }

  protected ignoreLog(name: string): boolean {
    return !this.supportedEvents.has(name)
  }

  protected async parseLog(log: Log): Promise<LogDescription | null> {
    if (this.context.isAssetManager(log.address)) {
      return this.context.assetManagerEventInterface.parseLog(log)
    } else if (this.context.isFAssetToken(log.address)) {
      return this.context.erc20Interface.parseLog(log)
    }
    const em = this.context.orm.em.fork()
    // is collateral token
    const collateralType = await em.findOne(CollateralTypeAdded, { address: { hex: log.address } })
    if (collateralType !== null) {
      if (collateralType.collateralClass !== 1) {
        return this.context.erc20Interface.parseLog(log)
      } else {
        return null
      }
    }
    // is collateral pool token
    const collateralPoolToken = await em.findOne(AgentVault, { collateralPoolToken: { hex: log.address }})
    if (collateralPoolToken !== null) {
      return this.context.erc20Interface.parseLog(log)
    }
    // is collateral pool
    const pool = await em.findOne(AgentVault, { collateralPool: { hex: log.address }})
    if (pool !== null) {
      return this.context.collateralPoolInterface.parseLog(log)
    }
    return null
  }

  protected async updateCachedBlock(blockNumber: number): Promise<void> {
    if (this.blockCache === null || this.blockCache.index !== blockNumber) {
      const block = await this.context.provider.getBlock(blockNumber)
      if (block === null) {
        throw new Error(`Failed to fetch block ${blockNumber}`)
      }
      this.blockCache = {
        index: blockNumber,
        timestamp: block.timestamp
      }
    }
  }

  protected async updateCachedTransaction(transactionHash: string): Promise<void> {
    if (this.transactionCache === null || this.transactionCache.hash !== transactionHash) {
      const transaction = await this.context.provider.getTransaction(transactionHash)
      if (transaction === null) {
        throw new Error(`Failed to fetch transaction ${transactionHash}`)
      }
      this.transactionCache = {
        hash: transactionHash,
        source: transaction.from,
        target: transaction.to
      }
    }
  }

}