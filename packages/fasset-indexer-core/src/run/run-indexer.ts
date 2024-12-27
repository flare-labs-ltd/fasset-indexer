import { ensureConfigIntegrity } from "./integrity"
import { EventIndexerParallelRacePopulation } from "../indexer/migrations/indexer-parallel-race-population"
import { EVENTS } from "../config/constants"
import { Context } from "../context/context"
import { logger } from "../logger"
import { config } from "../config/config"

const events = [
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_CREATED,
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_UPDATED,
  EVENTS.ASSET_MANAGER.REDEMPTION_TICKET_DELETED,
  EVENTS.ASSET_MANAGER.VAULT_COLLATERAL_WITHDRAWAL_ANNOUNCED,
  EVENTS.ASSET_MANAGER.POOL_TOKEN_REDEMPTION_ANNOUNCED,
  EVENTS.ASSET_MANAGER.UNDERLYING_WITHDRAWAL_ANNOUNCED,
  EVENTS.ASSET_MANAGER.UNDERLYING_WITHDRAWAL_CONFIRMED
]

const updateName = 'redemptionTicketsAndWithdrawAnnouncments'

async function runIndexer(start?: number) {
  const allEvents = Object.values(EVENTS).map(x => Object.values(x)).flat()
  const context = await Context.create(config)
  const indexer = new EventIndexerParallelRacePopulation(
    context, allEvents, updateName,
    allEvents.filter(x => !events.includes(x))
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