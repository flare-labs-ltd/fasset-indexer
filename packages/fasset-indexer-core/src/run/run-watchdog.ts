import { EvmStateWatchdog } from "../indexer/watchdog"
import { ensureDatabaseIntegrity } from "./integrity"
import { Context } from "../context/context"
import { config } from "../config/config"


async function runWatchdog() {
  const context = await Context.create(config)
  const watchdog = new EvmStateWatchdog(context)
  process.on("SIGINT", async () => {
    console.log("Stopping watchdog...")
    await context.orm.close()
    process.exit(0)
  })
  console.log('starting watchdog')
  await ensureDatabaseIntegrity(context)
  await watchdog.run()
}

runWatchdog()