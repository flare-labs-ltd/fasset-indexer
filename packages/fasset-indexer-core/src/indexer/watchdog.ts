import { EntityManager } from "@mikro-orm/knex"
import { sleep } from "../utils"
import { CollateralTypeAdded } from "../database/entities/events/token"
import { AgentVault } from "../database/entities/agent"
import { isUntrackedAgentVault, updateAgentVaultInfo } from "./shared"
import { Context } from "../context"
import { MID_CHAIN_FETCH_SLEEP_MS, STATE_UPDATE_SLEEP_MS } from "../config/constants"
import { FtsoPrice } from "../database/entities/state/price"
import { FAssetType } from "../database/entities/events/_bound"


export class StateWatchdog {

  constructor(public readonly context: Context) {}

  async run(): Promise<void> {
    while (true) {
      try {
        await this.context.orm.em.fork().transactional(async em => {
          await this.watchAgentInfo(em)
          await this.watchFtsoPrices(em)
        })
      } catch (e: any) {
        console.error(`error in top-level watchdog: ${e}`)
      }
      await sleep(STATE_UPDATE_SLEEP_MS)
    }
  }

  async watchAgentInfo(em: EntityManager): Promise<void> {
    const agents = await em.find(AgentVault, { destroyed: false }, { populate: ['address'] })
    for (const agent of agents) {
      const agentUntracked = await isUntrackedAgentVault(em, agent.address.hex)
      if (agentUntracked) continue
      try {
        console.log(`updating agent ${agent.address.hex} info for agent vault`)
        const assetManager = this.context.fAssetTypeToAssetManagerAddress(agent.fasset)
        await updateAgentVaultInfo(this.context, em, assetManager, agent.address.hex)
      } catch (e: any) {
        console.error(`error updating agent ${agent.address} info: ${e}`)
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
        console.log(`updating ${symbol} price`)
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
        console.error(`error updating ${symbol} price: ${err}`)
      }
    }
  }

}