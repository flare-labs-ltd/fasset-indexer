import { Context } from "../context/context"
import { config } from "../config/config"
import { ensureDatabaseIntegrity } from "./db-integrity"
import { EventIndexer } from "../indexer/indexer"
import { logger } from "../logger"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  logger.info("ensuring database integrity...")
  await ensureDatabaseIntegrity(context)
  logger.info("starting indexer...")
  await indexer.run()
}

runIndexer()