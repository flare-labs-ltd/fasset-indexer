import { deleteVar } from "../utils"
import { BtcIndexer } from "../indexer-btc/btc-indexer"
import { Context } from "../context"
import { FIRST_UNHANDLED_BTC_BLOCK } from "../config/constants"
import { config } from "../config/config"


async function deleteBtcTables() {
  const context = await Context.create(config)
  const em = context.orm.em.fork()
  await em.getConnection().execute('DROP TABLE op_return, btc_tx_input, btc_tx_output, btc_tx, btc_block')
  await deleteVar(em, FIRST_UNHANDLED_BTC_BLOCK)
  await context.orm.close()
}

async function runBtcIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new BtcIndexer(context)

  process.on("SIGINT", async () => {
    console.log("Stopping BTC indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await indexer.run(start)
}

runBtcIndexer()