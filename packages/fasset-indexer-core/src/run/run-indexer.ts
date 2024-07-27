import { sleep } from "../utils"
import { addCollateralPoolTokens, addTransactionData, removeSelfCloseEvents } from "../indexer/migrations/scripts"
import { EventIndexerBackAndFrontInsertion } from "../indexer/migrations/back-and-front"
import { Context } from "../context"
import { config } from "../config/config"


async function runIndexer(start?: number) {
  const context = await Context.create(config)
  const indexer = new EventIndexerBackAndFrontInsertion(context)

  process.on("SIGINT", async () => {
    console.log("Stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  //await removeSelfCloseEvents(context)
  await Promise.all([
    async () => {
      while (true) {
        try {
          await addTransactionData(context)
          await addCollateralPoolTokens(context)
          break
        } catch (e) {
          console.error(`Error running migrations: ${e}`)
          await sleep(5000)
        }
      }
    },
    indexer.run()
  ])
}

runIndexer()