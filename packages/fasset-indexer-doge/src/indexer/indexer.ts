import { getVar, setVar, type EntityManager } from "fasset-indexer-core/database"
import { DogeAddress, DogeBlock, DogeVoutReference } from "fasset-indexer-core/entities"
import { logger } from "fasset-indexer-core/logger"
import { DogeDeforker } from "./deforker"
import { FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY, MIN_DOGE_BLOCK_NUMBER_DB_KEY } from "../config/constants"
import type { IDogeBlock, IDogeVout } from "../client/interface"
import type { DogeContext } from "../context"


export class DogeIndexer {
  public readonly deforker: DogeDeforker

  constructor(public readonly context: DogeContext) {
    this.deforker = new DogeDeforker(context)
  }

  async runHistoricWithDefork(startBlock?: number, endBlock?: number) {
    await this.deforker.defork()
    await this.runHistoric(startBlock, endBlock)
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
    for (let i = startBlock; i <= endBlock; i += 1) {
      const blockhash = await this.context.dogecoin.dogeBlockHash(i)
      const block = await this.context.dogecoin.dogeBlock(blockhash)
      await this.processBlock(block)
      await this.setFirstUnhandledBlock(i + 1)
      logger.info(`indexer processed block ${blockhash} at height ${i}`)
    }
  }

  async firstUnhandledBlock(startBlock?: number): Promise<number> {
    const block = await getVar(this.context.orm.em.fork(), FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY)
    const blockNum = block !== null ? Number(block.value!) : startBlock
    return blockNum !== undefined ? blockNum : await this.minBlock()
  }

  async lastBlockToHandle(): Promise<number> {
    return await this.context.dogecoin.dogeBlockHeight()
  }

  async minBlock(): Promise<number> {
    const fromDb = await getVar(this.context.orm.em.fork(), MIN_DOGE_BLOCK_NUMBER_DB_KEY)
    if (fromDb?.value != null) return Number(fromDb.value)
    throw new Error('No min block number found in the database')
  }

  protected async setFirstUnhandledBlock(block: number): Promise<void> {
    const em = this.context.orm.em.fork()
    await setVar(em, FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY, block.toString())
  }

  protected async processBlock(block: IDogeBlock): Promise<void> {
    await this.context.orm.em.transactional(async em => {
      const blockEnt = await this.storeDogeBlock(em, block)
      for (const tx of block.tx) {
        await this.processTx(em, tx, blockEnt)
      }
    })
  }

  protected async processTx(em: EntityManager, txhash: string, block: DogeBlock): Promise<void> {
    const tx = await this.context.dogecoin.dogeTransaction(txhash)
    for (const vout of tx.vout) {
      const data = this.extractReferenceWithAddress(vout)
      if (data === null) continue
      const [reference, address] = data
      console.log(reference)
      const addr = await this.getOrCreateAddress(em, address)
      await this.storeVoutReference(em, reference, txhash, addr, block)
      logger.info(`stored reference ${reference} for address ${address}`)
    }
  }

  private async storeDogeBlock(em: EntityManager, dogeBlock: IDogeBlock): Promise<DogeBlock> {
    const block = new DogeBlock(dogeBlock.hash, dogeBlock.height, dogeBlock.time)
    em.persist(block)
    return block
  }

  private async storeVoutReference(
    em: EntityManager, reference: string, txhash: string, address: DogeAddress, block: DogeBlock
  ): Promise<DogeVoutReference> {
    const ref = new DogeVoutReference(reference, txhash, address, block)
    em.persist(ref)
    return ref
  }

  private async getOrCreateAddress(em: EntityManager, address: string): Promise<DogeAddress> {
    const existing = await em.findOne(DogeAddress, { hash: address })
    if (existing !== null) return existing
    const addr = new DogeAddress(address)
    em.persist(addr)
    return addr
  }

  private extractReferenceWithAddress(vout: IDogeVout): [string, string] | null {
    const candidate = vout?.scriptPubKey?.asm
    if (typeof candidate !== 'string' || !candidate.startsWith('OP_RETURN ')) {
      return null
    }
    const address = vout?.scriptPubKey?.addresses?.[0]
    if (typeof address !== 'string') return null
    return [candidate.slice(10), address]
  }
}