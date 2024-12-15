import { AgentVault } from "../database/entities/agent"
import { EventIndexer } from "../indexer/indexer"
import { ensureConfigIntegrity } from "./integrity"
import { Context } from "../context/context"
import { config } from "../config/config"
import { logger } from "../logger"

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
  const context = await Context.create(config)
  const indexer = new EventIndexer(context)

  process.on("SIGINT", async () => {
    logger.info("stopping indexer...")
    await context.orm.close()
    process.exit(0)
  })

  await fillCollateralPoolTokens(context)

  logger.info("ensuring configuration integrity...")
  await ensureConfigIntegrity(context)
  logger.info(`starting FAsset ${context.chain} indexer...`)
  await indexer.run()
}

runIndexer()