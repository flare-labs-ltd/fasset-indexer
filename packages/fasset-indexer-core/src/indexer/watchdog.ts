import { sleep } from "../utils"
import { CollateralTypeAdded } from "../database/entities/events/token"
import { AgentVault } from "../database/entities/agent"
import { FtsoPrice } from "../database/entities/state/price"
import { isUntrackedAgentVault, updateAgentVaultInfo } from "./shared"
import { Context } from "../context/context"
import { MID_CHAIN_FETCH_SLEEP_MS, EVM_STATE_UPDATE_SLEEP_MS } from "../config/constants"
import { logger } from "../logger"
import type { EntityManager } from "@mikro-orm/knex"
import type { FAssetType } from "../shared"


export class EvmStateWatchdog {

  constructor(public readonly context: Context) {}

  async run(): Promise<void> {
    while (true) {
      try {
        await this.context.orm.em.fork().transactional(async em => {
          await this.watchAgentInfo(em)
          await this.watchFtsoPrices(em)
        })
      } catch (e: any) {
        logger.error(`error in top-level Flare watchdog: ${e}`)
      }
      await sleep(EVM_STATE_UPDATE_SLEEP_MS)
    }
  }

  async watchAgentInfo(em: EntityManager): Promise<void> {
    const agents = await em.find(AgentVault, { destroyed: false }, { populate: ['address'] })
    for (const agent of agents) {
      const agentUntracked = await isUntrackedAgentVault(em, agent.address.hex)
      if (agentUntracked) continue
      try {
        logger.info(`updating agent ${agent.address.hex} info for agent vault`)
        const assetManager = this.context.fAssetTypeToAssetManagerAddress(agent.fasset)
        await updateAgentVaultInfo(this.context, em, assetManager, agent.address.hex)
      } catch (e: any) {
        logger.error(`error updating agent ${agent.address} info: ${e}`)
      }
      await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

  async watchFtsoPrices(em: EntityManager): Promise<void> {
    const collateralTypes = await em.findAll(CollateralTypeAdded)
    const collateralSymbols = new Map<string, FAssetType>()
    for (const collateralType of collateralTypes) {
      collateralSymbols.set(collateralType.tokenFtsoSymbol, collateralType.fasset)
      collateralSymbols.set(collateralType.assetFtsoSymbol, collateralType.fasset)
    }
    for (const [symbol, fasset] of collateralSymbols) {
      try {
        logger.info(`updating ${symbol} price`)
        const assetManagerAddress = this.context.fAssetTypeToAssetManagerAddress(fasset)
        const assetManager = this.context.getAssetManagerContract(assetManagerAddress)
        const priceReaderAddress = await assetManager.priceReader()
        const priceReader = this.context.getPriceReaderContract(priceReaderAddress)
        const { _price, _priceDecimals, _timestamp } = await priceReader.getPrice(symbol)
        em.upsert(FtsoPrice, {
          symbol: symbol,
          price: _price,
          decimals: Number(_priceDecimals),
          timestamp: Number(_timestamp)
        })
      } catch (err: any) {
        logger.error(`error updating ${symbol} price: ${err}`)
      }
    }
  }

}