import { describe, beforeEach, afterEach, it } from "mocha"
import { use, expect } from "chai"
import chaiAsPromised from "chai-as-promised"
import { unlink } from "fs"
import { BtcBlock } from "../src/database/entities/btc/block"
import { BtcTx } from "../src/database/entities/btc/transaction"
import { BtcStateUpdater } from "../src/indexer-btc/lib/btc-state-updater"
import { BtcFixture } from "./fixtures/btc"
import { Context } from "../src/context/context"
import { CONFIG } from "./fixtures/config"


use(chaiAsPromised)

describe("Bitcoin transactions", () => {
  let context: Context
  let fixture: BtcFixture
  let stateUpdater: BtcStateUpdater

  beforeEach(async () => {
    unlink(CONFIG.db.dbName!, () => { })
    context = await Context.create(CONFIG)
    stateUpdater = new BtcStateUpdater(context)
    fixture = new BtcFixture(context)
  })

  afterEach(async () => {
    await context.orm.close(true)
    unlink(CONFIG.db.dbName!, () => { })
  })

  it("should store BTC transaction", async () => {
    // add initial collateral token type
    const btcTx = await fixture.generateTx()
    await stateUpdater.processTx(btcTx)
    const em = context.orm.em.fork()
    const btcBlock = await em.findOneOrFail(BtcBlock, { index: btcTx.blockHeight })
    expect(btcBlock).to.exist
    expect(btcBlock.hash).to.equal(btcTx.blockHash)
    expect(btcBlock.timestamp).to.equal(btcTx.blockTime)
    // tx
    const btcTxEntity = await em.findOneOrFail(BtcTx, { txid: btcTx.txid }, { populate: ["inputs.address", "outputs.address"] })
    expect(btcTxEntity).to.exist
    expect(btcTxEntity.value.toString()).to.equal(btcTx.value)
    expect(btcTxEntity.valueIn.toString()).to.equal(btcTx.valueIn)
    expect(btcTxEntity.fees.toString()).to.equal(btcTx.fees)
    // tx ins
    expect(btcTxEntity.inputs).to.have.lengthOf(btcTx.vin.length)
    for (const vin of btcTx.vin) {
      const input = btcTxEntity.inputs.find(i => i.index === vin.n)
      expect(input).to.exist
      expect(input!.address.text).to.equal(vin.addresses[0])
      expect(input!.value.toString()).to.equal(vin.value)
      expect(input!.spentTxId).to.equal(vin.txid)
      expect(input!.vout).to.equal(vin.vout ?? null)
    }
    // tx outs
    for (const vout of btcTx.vout) {
      const output = btcTxEntity.outputs.find(o => o.index === vout.n)
      expect(output).to.exist
      expect(output!.address.text).to.equal(vout.addresses[0])
      expect(output!.value.toString()).to.equal(vout.value)
    }
  })

  it("should not reinsert the same BTC transaction", async () => {
    const btcTx = await fixture.generateTx()
    await stateUpdater.processTx(btcTx)
    await stateUpdater.processTx(btcTx)
    const em = context.orm.em.fork()
    const btcTxEntity = await em.findAll(BtcTx)
    expect(btcTxEntity).to.have.lengthOf(1)
  })

  it("should store BTC transaction block", async () => {
    const btcBlock = await fixture.generateBlock()
    await stateUpdater.processBlock(btcBlock)
    console.log('here')
    const em = context.orm.em.fork()
    const block = await em.findOneOrFail(BtcBlock, { index: btcBlock.height })
    expect(block).to.exist
    expect(block.hash).to.equal(btcBlock.hash)
    expect(block.timestamp).to.equal(btcBlock.time)
    // txs
    const txs = await em.find(BtcTx, { block: block }, { populate: ["inputs.address", "outputs.address"] })
    expect(txs).to.have.lengthOf(btcBlock.txs.length)
    for (const tx of txs) {
      const _tx = btcBlock.txs.find(t => t.txid === tx.txid)
      expect(_tx).to.exist
    }
  })

})