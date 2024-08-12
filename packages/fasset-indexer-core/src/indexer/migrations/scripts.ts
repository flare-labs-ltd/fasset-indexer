import chalk from 'chalk'
import { sleep } from "../../utils"
import { AddressType } from "../../database/entities/address"
import { EvmLog } from "../../database/entities/evm/log"
import { findOrCreateEvmAddress } from "../shared"
import { Context } from "../../context"
import { MID_CHAIN_FETCH_SLEEP_MS } from "../../config/constants"
import { AgentVault } from '../../database/entities/agent'


export async function addCollateralPoolTokens(context: Context) {
  console.log(chalk.magenta('adding collateral pool tokens'))
  const vaults = await context.orm.em.fork().find(AgentVault, { collateralPoolToken: null }, { populate: ['collateralPool'] })
  for (const vault of vaults) {
    await context.orm.em.fork().transactional(async (em) => {
      try {
        const collateralPool = context.getCollateralPool(vault.collateralPool.hex)
        const collateralPoolToken = await collateralPool.token()
        vault.collateralPoolToken = await findOrCreateEvmAddress(context.orm.em.fork(), collateralPoolToken, AddressType.AGENT)
        em.persist(vault)
        await sleep(MID_CHAIN_FETCH_SLEEP_MS / 2)
      } catch (e: any) {
        console.error(`Failed to fetch collateral pool token for collateral pool ${vault.collateralPool.hex}: ${e}`)
      }
    })
  }
  console.log(chalk.magenta('finished adding collateral pool tokens'))
}

export async function removeSelfCloseEvents(context: Context) {
  const em = context.orm.em.fork()
  await em.nativeDelete(EvmLog, { name: 'SelfClose' })
  await em.flush()
}

/* import { config } from '../../config/config'

async function main() {
  const context = await Context.create(config)
  await addCollateralPoolTokens(context)
  await context.orm.close()
}

main() */