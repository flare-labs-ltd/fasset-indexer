import { EventIndexer } from "../indexer/indexer"
import { EventIndexerInsertion } from "../indexer/insertion/insertion"
import { Context } from "../context"
import { config } from "../config/config"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const eventIndexer = new EventIndexer(context)
  const eventIndexerInsertion = new EventIndexerInsertion(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })
  console.log('starting indexer with back-insertions')

  await Promise.all([
    eventIndexerInsertion.run(start),
    eventIndexer.run(start),
  ])
}

runIndexer()