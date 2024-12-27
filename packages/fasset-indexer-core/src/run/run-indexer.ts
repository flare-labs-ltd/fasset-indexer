import { ensureConfigIntegrity } from "./integrity"
import { EventIndexerParallelPopulation } from "../indexer/migrations/indexer-parallel-population"
import { EVENTS } from "../config/constants"
import { Context } from "../context/context"
import { logger } from "../logger"
import { config } from "../config/config"

const events = [
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_CREATED,
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_UPDATED,
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_DELETED
]

const updateName = 'redemptionTicketsAndWithdrawAnnouncments'

async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerParallelPopulation(
    context, events, updateName,
    Object.values(EVENTS).map(x => Object.values(x)).flat().filter(x => !events.includes(x))
  )

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  logger.info("ensuring configuration integrity...")
  await ensureConfigIntegrity(context, updateName)
  logger.info(`starting FAsset ${context.chain} indexer...`)
  await indexer.run()
}

runIndexer()