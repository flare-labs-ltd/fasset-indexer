import { EvmStateWatchdog } from "../indexer/watchdog"
import { ensureConfigIntegrity } from "./integrity"
import { Context } from "../context/context"
import { config } from "../config/config"
import { logger } from "../logger"


async function runWatchdog() {
  const context = await Context.create(config)
  const watchdog = new EvmStateWatchdog(context)

  process.on("SIGINT", async () => {
    logger.info("stopping watchdog...")
    await context.orm.close()
    process.exit(0)
  })

  logger.info('ensuring configuration integrity...')
  await ensureConfigIntegrity(context)
  logger.info('starting watchdog...')
  await watchdog.run()
}

runWatchdog()