import { Context } from "../context"
import { config } from "../config/config"
import { addCollateralPoolTokens, addTransactionData, removeSelfCloseEvents } from "../indexer/migrations/scripts"
import { EventIndexerBackAndFrontInsertion } from "../indexer/migrations/back-and-front"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerBackAndFrontInsertion(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await removeSelfCloseEvents(context)
  await addTransactionData(context)
  await addCollateralPoolTokens(context)
  await indexer.run()
}

runIndexer()