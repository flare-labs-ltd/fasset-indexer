import { ensureConfigIntegrity } from "./integrity"
import { EventIndexer } from "../indexer/indexer"
import { ConfigLoader } from "../config"
import { Context } from "../context/context"
import { logger } from "../logger"


async function runIndexer(start?: number) {
  const config = new ConfigLoader()
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  logger.info("ensuring configuration integrity...")
  await ensureConfigIntegrity(context)
  logger.info(`starting FAsset ${context.chain} indexer...`)
  await indexer.run()
}

runIndexer()