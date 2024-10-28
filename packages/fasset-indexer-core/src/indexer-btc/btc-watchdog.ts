import { sleep } from "../utils"
import { FAssetType } from "../shared"
import { AgentVault } from "../database/entities/agent"
import { BtcStateUpdater } from "./lib/btc-state-updater"
import { Context } from "../context/context"
import { BTC_STATE_UPDATE_SLEEP_MS } from "../config/constants"

export class BtcStateWatchdog {
  stateUpdater: BtcStateUpdater

  constructor(private readonly context: Context) {
    this.stateUpdater = new BtcStateUpdater(context)
  }

  async run(): Promise<void> {
    while (true) {
      try {
        await this.updateAgents()
      } catch (e: any) {
        console.error(`error in top-level Bitcoin watchdog: ${e}`)
      }
      await sleep(BTC_STATE_UPDATE_SLEEP_MS)
    }
  }

  async updateAgents(): Promise<void> {
    const em = this.context.orm.em.fork()
    const vaults = await em.find(AgentVault,
      { fasset: FAssetType.FBTC },
      { populate: ['underlyingAddress' ] }
    )
    for (const vault of vaults) {
      try {
        console.log(`updating Bitcoin txs for ${vault.underlyingAddress.text}`)
        await this.stateUpdater.processAddress(vault.underlyingAddress.text)
      } catch (e: any) {
        console.error(`error updating Bitcoin txs for ${vault.underlyingAddress.text} agent: ${e}`)
      }
    }
  }

}