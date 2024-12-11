import { Context } from "../context/context"
import { config } from "../config/config"
import { ensureChainIntegrity, ensureDatabaseIntegrity } from "./integrity"
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

  logger.info("ensuring configuration integrity...")
  await ensureDatabaseIntegrity(context)
  await ensureChainIntegrity(context)
  logger.info("starting indexer...")
  await indexer.run()
}

runIndexer()