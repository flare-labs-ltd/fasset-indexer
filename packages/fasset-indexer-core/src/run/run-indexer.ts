import { Context } from "../context/context"
import { config } from "../config/config"
import { ensureDatabaseIntegrity } from "./integrity"
import { EventIndexer } from "../indexer/indexer"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await ensureDatabaseIntegrity(context)
  await indexer.run()
}

runIndexer()