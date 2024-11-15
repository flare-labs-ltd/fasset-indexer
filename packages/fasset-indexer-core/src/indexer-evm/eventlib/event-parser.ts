import { AgentVault } from "../../database/entities/agent"
import { Context } from "../../context/context"
import { EVENTS, IGNORE_EVENTS } from "../../config/constants"
import type { EntityManager } from "@mikro-orm/knex"
import type { Log, LogDescription } from "ethers"
import type { Event } from "./event-scraper"

interface Block {
  index: number
  timestamp: number
}

interface Transaction {
  hash: string
  source: string
  target: string | null
}

export class EventParser {
  private supportedEvents: Set<string>
  private supportedTopics: Set<string> = new Set()
  // cache
  private blockCache: Block | null = null
  private transactionCache: Transaction | null = null

  constructor(public readonly context: Context) {
    this.supportedEvents = new Set(Object.values(EVENTS))
    for (const event of IGNORE_EVENTS) {
      this.supportedEvents.delete(event)
    }
    for (const event of this.supportedEvents) {
      const topic = this.context.getEventTopic(event)
      if (topic === null) {
        throw new Error(`Failed to find topic for event ${event}`)
      }
      this.supportedTopics.add(topic)
    }
  }

  async logToEvent(log: Log): Promise<Event | null> {
    if (this.ignoreLog(log.topics[0]))
      return null
    const logDescription = await this.parseLog(log)
    if (logDescription === null)
      return null
    const block = await this.getBlock(log.blockNumber)
    const transaction = await this.getTransaction(log.transactionHash)
    return {
      name: logDescription.name,
      args: logDescription.args,
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      logIndex: log.index,
      source: log.address,
      blockTimestamp: block.timestamp,
      transactionHash: log.transactionHash,
      transactionSource: transaction.source,
      transactionTarget: transaction.target
    }
  }

  async parseLog(log: Log): Promise<LogDescription | null> {
    if (this.context.isAssetManager(log.address)) {
      return this.context.interfaces.assetManagerInterface.parseLog(log)
    } else if (this.context.isFAssetToken(log.address)) {
      return this.context.interfaces.erc20Interface.parseLog(log)
    }
    const em = this.context.orm.em.fork()
    // collateral pool token
    if (await this.isCollateralPoolToken(em, log.address)) {
      return this.context.interfaces.erc20Interface.parseLog(log)
    }
    // collateral pool
    if (await this.isCollateralPool(em, log.address)) {
      return this.context.interfaces.collateralPoolInterface.parseLog(log)
    }
    return null
  }

  protected ignoreLog(topic: string): boolean {
    return !this.supportedTopics.has(topic)
  }

  protected async isCollateralPool(em: EntityManager, address: string): Promise<boolean> {
    const pool = await em.findOne(AgentVault, { collateralPool: { hex: address } })
    return pool !== null
  }

  protected async isCollateralPoolToken(em: EntityManager, address: string): Promise<boolean> {
    const pool = await em.findOne(AgentVault, { collateralPoolToken: { hex: address } })
    return pool !== null
  }

  private async getBlock(blockNumber: number): Promise<Block> {
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
    return this.blockCache
  }

  private async getTransaction(transactionHash: string): Promise<Transaction> {
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
    return this.transactionCache
  }

}