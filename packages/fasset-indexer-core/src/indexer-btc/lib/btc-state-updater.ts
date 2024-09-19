import { AddressType } from "../../database/entities/address"
import { BtcTx, BtcTxInput, BtcTxOutput } from "../../database/entities/btc/transaction"
import { BtcBlock } from "../../database/entities/btc/block"
import { Blockbook } from "../blockbook/blockbook"
import { findOrCreateUnderlyingAddress } from "../../utils"
import type { EntityManager } from "@mikro-orm/knex"
import type { Context } from "../../context"
import type { BlockbookBlock, BlockbookTx, BlockbookTxInput, BlockbookTxOutput } from "../blockbook/interface"


export class BtcStateUpdater {
  blockbook: Blockbook

  constructor(public readonly context: Context) {
    this.blockbook = new Blockbook(context.config.btcRpc.url)
  }

  async processAddress(_address: string): Promise<void> {
    const em = this.context.orm.em.fork()
    const txs = await this.blockbook.addressInfo(_address)
    for (const txid of txs.txids) {
      if (!await this.txExists(em, txid)) {
        const tx = await this.blockbook.tx(txid)
        await this.processTx(tx)
      }
    }
  }

  async processBlock(block: BlockbookBlock): Promise<void> {
    await this.context.orm.em.fork().transactional(async (em) => {
      await this._processBlock(em, block)
    })
  }

  async processTx(tx: BlockbookTx): Promise<void> {
    await this.context.orm.em.fork().transactional(async (em) => {
      await this._storeTx(em, tx)
    })
  }

  protected async _processBlock(em: EntityManager, _block: BlockbookBlock): Promise<void> {
    for (const _tx of _block.txs) {
      await this._storeTx(em, _tx)
    }
  }

  protected async _storeTx(em: EntityManager, _tx: BlockbookTx): Promise<void> {
    const block = new BtcBlock(_tx.blockHeight, _tx.blockHash, _tx.blockTime)
    em.upsert(block)
    const tx = new BtcTx(block, _tx.txid, BigInt(_tx.value), BigInt(_tx.valueIn), BigInt(_tx.fees))
    em.upsert(tx)
    await this._storeTxInputs(em, _tx.vin, tx)
    await this._storeTxOutputs(em, _tx.vout, tx)
  }

  protected async _storeTxInputs(em: EntityManager, inputTxs: BlockbookTxInput[], btcTx: BtcTx): Promise<void> {
    for (const _inputTx of inputTxs) {
      const address = await findOrCreateUnderlyingAddress(em, _inputTx.addresses[0], AddressType.USER)
      const inputTx = new BtcTxInput(btcTx, address, BigInt(_inputTx.value), _inputTx.n, _inputTx.spentTxId, _inputTx.vout)
      em.upsert(inputTx)
    }
  }

  protected async _storeTxOutputs(em: EntityManager, outputTxs: BlockbookTxOutput[], btcTx: BtcTx): Promise<void> {
    for (const _outputTx of outputTxs) {
      const address = await findOrCreateUnderlyingAddress(em, _outputTx.addresses[0], AddressType.USER)
      const inputTx = new BtcTxOutput(btcTx, address, BigInt(_outputTx.value), _outputTx.n)
      em.upsert(inputTx)
    }
  }

  private async txExists(em: EntityManager, txid: string): Promise<boolean> {
    const tx = await em.findOne(BtcTx, { txid })
    return tx !== null
  }

}