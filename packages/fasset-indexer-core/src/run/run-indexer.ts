import { EventIndexer } from "../indexer/indexer"
import { Context } from "../context"
import { config } from "../config"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const eventIndexer = new EventIndexer(context)
  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })
  console.log('starting indexer')
  await eventIndexer.run(start)
}

runIndexer()