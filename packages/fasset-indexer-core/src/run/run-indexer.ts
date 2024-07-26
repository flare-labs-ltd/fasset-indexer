import { Context } from "../context"
import { config } from "../config/config"
import { addTransactionData } from "../indexer/insertion/add-tx-data"
import { EventIndexerBackAndFrontInsertion } from "../indexer/insertion/back-and-front"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerBackAndFrontInsertion(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await addTransactionData(context)
  await indexer.run()
}

runIndexer()