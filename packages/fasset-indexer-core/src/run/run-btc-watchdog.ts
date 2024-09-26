import { OpReturn } from "../database/entities/btc/transaction"
import { Blockbook } from "../indexer-btc/blockbook/blockbook"
import { BtcStateWatchdog } from "../indexer-btc/btc-watchdog"
import { Context } from "../context"
import { config } from "../config/config"

async function fixOpReturnCodes() {
  const context = await Context.create(config)
  const blockbook = new Blockbook(context.config.btcRpc.url, context.config.btcRpc.apiKey)
  const em = context.orm.em.fork()
  const opReturns = await em.find(OpReturn, {}, { populate: ['tx'] })
  for (const opReturn of opReturns) {
    const tx = await blockbook.tx(opReturn.tx.txid)
    for (const vin of tx.vin) {
      if (vin.txid === opReturn.tx.txid) {
        opReturn.data = "0x" + vin.hex!.substring(3)
        em.persist(opReturn)
        break
      }
    }
  }
  await context.orm.close()
}

async function runWatchdog() {
  await fixOpReturnCodes()
  const context = await Context.create(config)
  const watchdog = new BtcStateWatchdog(context)
  process.on("SIGINT", async () => {
    console.log("Stopping watchdog...")
    await context.orm.close()
    process.exit(0)
  })
  console.log('starting watchdog')
  await watchdog.run()
}

runWatchdog()