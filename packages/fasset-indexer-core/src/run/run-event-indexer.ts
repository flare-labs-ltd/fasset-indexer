import { Context } from "../context"
import { config } from "../config/config"
import { EventIndexerParallelPopulation } from "../indexer-evm/migrations/indexer-parallel-population"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerParallelPopulation(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await indexer.run()
}

runIndexer()