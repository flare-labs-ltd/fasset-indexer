import { EntityManager } from "@mikro-orm/knex"
import { sleep } from "../utils"
import { AgentVault } from "../database/entities/agent"
import { isUntrackedAgentVault, updateAgentVaultInfo } from "./shared"
import { Context } from "../context"
import { MID_CHAIN_FETCH_SLEEP_MS, STATE_UPDATE_SLEEP_MS } from "../config/constants"


export class StateWatchdog {

  constructor(public readonly context: Context) {}

  async run(): Promise<void> {
    while (true) {
      await this.watchAgentInfo(this.context.orm.em.fork())
      await sleep(STATE_UPDATE_SLEEP_MS)
    }
  }

  async watchAgentInfo(em: EntityManager): Promise<void> {
    const agents = await em.find(AgentVault, { destroyed: false }, { populate: ['address'] })
    for (const agent of agents) {
      const agentUntracked = await isUntrackedAgentVault(em, agent.address.hex)
      if (agentUntracked) continue
      try {
        console.log(`updating agent info for agent vault ${agent.address.hex}`)
        const assetManager = this.context.fAssetTypeToAssetManagerAddress(agent.fasset)
        await updateAgentVaultInfo(this.context, em, assetManager, agent.address.hex)
      } catch (e: any) {
        console.error(`error updating agent info for ${agent.address}: ${e}`)
      }
      await sleep(MID_CHAIN_FETCH_SLEEP_MS)
    }
  }

}