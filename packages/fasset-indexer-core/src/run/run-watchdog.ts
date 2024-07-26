import { StateWatchdog } from "../indexer/watchdog"
import { Context } from "../context"
import { config } from "../config/config"


async function runWatchdog() {
  const context = await Context.create(config)
  const watchdog = new StateWatchdog(context)
  process.on("SIGINT", async () => {
    console.log("Stopping watchdog...")
    await context.orm.close()
    process.exit(0)
  })
  console.log('starting watchdog')
  await watchdog.run()
}

runWatchdog()