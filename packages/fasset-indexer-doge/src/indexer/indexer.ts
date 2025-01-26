import { FAssetType } from "fasset-indexer-core"
import { getVar, setVar, findOrCreateUnderlyingAddress, AddressType, type EntityManager } from "fasset-indexer-core/orm"
import { UnderlyingBlock, UnderlyingAddress, UnderlyingVoutReference } from "fasset-indexer-core/entities"
import { PaymentReference } from "fasset-indexer-core/utils"
import { logger } from "fasset-indexer-core/logger"
import { DogeDeforker } from "./deforker"
import { FIRST_UNHANDLED_DOGE_BLOCK_DB_KEY, MIN_DOGE_BLOCK_NUMBER_DB_KEY } from "../config/constants"
import type { IDogeBlock, IDogeTx, IDogeVout } from "../client/interface"
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
      logger.info(`doge indexer processed block ${blockhash} at height ${i}`)
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

  protected async processTx(em: EntityManager, txhash: string, block: UnderlyingBlock): Promise<void> {
    const tx = await this.context.dogecoin.dogeTransaction(txhash)
    for (const vout of tx.vout) {
      const reference = this.extractReference(vout)
      if (reference == null) continue
      const sender = await this.extractTransactionSender(tx)
      const address = await findOrCreateUnderlyingAddress(em, sender, AddressType.AGENT)
      await this.storeVoutReference(em, reference, txhash, address, block)
      logger.info(`stored reference ${reference} for sender ${sender}`)
      break
    }
  }

  private async storeDogeBlock(em: EntityManager, dogeBlock: IDogeBlock): Promise<UnderlyingBlock> {
    const block = new UnderlyingBlock(dogeBlock.hash, dogeBlock.height, dogeBlock.time)
    em.persist(block)
    return block
  }

  private async storeVoutReference(
    em: EntityManager, reference: string, txhash: string, address: UnderlyingAddress, block: UnderlyingBlock
  ): Promise<UnderlyingVoutReference> {
    const ref = new UnderlyingVoutReference(FAssetType.FDOGE, reference, txhash, address, block)
    em.persist(ref)
    return ref
  }

  private extractReference(vout: IDogeVout): string | null {
    const candidate = vout?.scriptPubKey?.asm
    if (typeof candidate != 'string' || !candidate.startsWith('OP_RETURN ')) {
      return null
    }
    const formattedReference = '0x' + candidate.slice(10)
    const isValid = PaymentReference.isValid(formattedReference)
    return isValid ? formattedReference : null
  }

  private async extractTransactionSender(tx: IDogeTx): Promise<string> {
    const vin = tx.vin[0]
    const txid = vin.txid
    const vout = vin.vout
    const txDetails = await this.context.dogecoin.dogeTransaction(txid)
    return txDetails.vout[vout].scriptPubKey.addresses[0]
  }
}