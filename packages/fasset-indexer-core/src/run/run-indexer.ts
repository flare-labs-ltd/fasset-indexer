import { AgentVault } from "../orm/entities/agent"
import { EventIndexer } from "../indexer/indexer"
import { ensureConfigIntegrity } from "./integrity"
import { ConfigLoader } from "../config/config"
import { Context } from "../context/context"
import { logger } from "../logger"
import { IndexerRunner } from "../indexer/runner"

async function fillCollateralPoolTokens(context: Context) {
  const em = context.orm.em.fork()
  const agentVaults = await em.findAll(AgentVault, { populate: ['collateralPoolToken'] })
  for (const agentVault of agentVaults) {
    const collateralPoolToken = context.getERC20(agentVault.collateralPoolToken.hex)
    agentVault.collateralPoolTokenSymbol = await collateralPoolToken.symbol()
    await em.persistAndFlush(agentVault)
  }
}

async function runIndexer(start?: number) {
  const config = new ConfigLoader()
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)
  const runner = new IndexerRunner(indexer, 'event indexer')

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await fillCollateralPoolTokens(context)

  logger.info("ensuring configuration integrity...")
  await ensureConfigIntegrity(context)
  logger.info(`starting FAsset ${context.chain} indexer...`)
  await runner.run(start)
}

runIndexer()