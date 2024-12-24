import { ensureConfigIntegrity } from "./integrity"
import { EventIndexerParallelPopulation } from "../indexer/migrations/indexer-parallel-population"
import { EVENTS } from "../config/constants"
import { Context } from "../context/context"
import { logger } from "../logger"
import { config } from "../config/config"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerParallelPopulation(context,
    [EVENTS.PRICE_READER.PRICES_PUBLISHED, EVENTS.ERC20.TRANSFER],
    'rewardSgbDistribution'
  )

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