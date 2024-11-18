import { BtcIndexer } from "../indexer-btc/btc-indexer"
import { Context } from "../context/context"
import { config } from "../config/config"


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