import { EventIndexer } from "../indexer/indexer"
import { ensureConfigIntegrity } from "./integrity"
import { ConfigLoader } from "../config/config"
import { Context } from "../context/context"
import { logger } from "../logger"
import { IndexerRunner } from "../indexer/runner"
import { EVENTS } from "../config"


const eventnames = Object.keys(EVENTS).map(iface => Object.values(EVENTS[iface as keyof typeof EVENTS])).flat()
  .filter(x => !x.startsWith('RedemptionTicket'))

async function runIndexer(start?: number) {
  const config = new ConfigLoader()
  const context = await Context.create(config)
  const indexer = new EventIndexer(context, eventnames)
  const runner = new IndexerRunner(indexer, 'event indexer')

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  logger.info("ensuring configuration integrity...")
  await ensureConfigIntegrity(context)
  logger.info(`starting FAsset ${context.chain} indexer...`)
  await runner.run(start)
}

runIndexer()