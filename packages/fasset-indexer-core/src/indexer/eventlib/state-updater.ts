import { EntityManager } from "@mikro-orm/knex"
import { AddressType } from "../../database/entities/address"
import { AgentManager, AgentOwner, AgentVault } from "../../database/entities/agent"
import { UntrackedAgentVault } from "../../database/entities/state/var"
import { updateAgentVaultInfo, findOrCreateEvmAddress } from "../shared"
import { EventStorer } from "./event-storer"
import type { AgentVaultCreatedEvent } from "../../../chain/typechain/AMEvents"
import type { Event } from "./event-scraper"
import type { Context } from "../../context"
import type { EvmLog } from "../../database/entities/logs"


// binds chain reading to event storage
export class StateUpdater extends EventStorer {

  constructor(public readonly context: Context) {
    super()
  }

  async onNewEvent(log: Event): Promise<void> {
    if (this.context.ignoreLog(log.name)) return
    await this.context.orm.em.fork().transactional(async (em) => {
      await this.processEvent(em, log)
    })
  }

  protected override async onAgentVaultCreated(em: EntityManager, evmLog: EvmLog, args: AgentVaultCreatedEvent.OutputTuple): Promise<AgentVault> {
    const [ owner,, collateralPool ] = args
    const manager = await this.ensureAgentManager(em, owner)
    await this.ensureAgentOwner(em, manager)
    const collateralPoolToken = await this.getCollateralPoolToken(collateralPool)
    const agentVaultEntity = await super.onAgentVaultCreated(em, evmLog, args, collateralPoolToken)
    await this.updateAgentVaultInfo(em, agentVaultEntity)
    return agentVaultEntity
  }

  private async getCollateralPoolToken(collateralPool: string): Promise<string | undefined> {
    const collateralPoolContract = this.context.getCollateralPool(collateralPool)
    try {
      return collateralPoolContract.token()
    } catch (e: any) {
      console.error(`Failed to fetch collateral pool token for collateral pool ${collateralPool}: ${e}`)
    }
  }

  private async ensureAgentManager(em: EntityManager, address: string): Promise<AgentManager> {
    let agentManager = await em.findOne(AgentManager, { address: { hex: address }}, { populate: ['address'] })
    if (agentManager === null) {
      agentManager = await this.findOrCreateAgentManager(em, address, true)
      em.persist(agentManager)
    }
    return agentManager
  }

  private async ensureAgentOwner(em: EntityManager, manager: AgentManager): Promise<AgentOwner> {
    let agentOwner = await em.findOne(AgentOwner, { manager })
    if (agentOwner === null) {
      const address = await this.context.agentOwnerRegistryContract.getWorkAddress(manager.address.hex)
      const evmAddress = await findOrCreateEvmAddress(em, address, AddressType.AGENT)
      agentOwner = new AgentOwner(evmAddress, manager)
      em.persist(agentOwner)
    }
    return agentOwner
  }

  private async findOrCreateAgentManager(em: EntityManager, manager: string, full: boolean): Promise<AgentManager> {
    let agentManager = await em.findOne(AgentManager, { address: { hex: manager }})
    if (agentManager === null) {
      const managerEvmAddress = await findOrCreateEvmAddress(em, manager, AddressType.AGENT)
      agentManager = new AgentManager(managerEvmAddress)
    }
    if (full && agentManager.name === undefined) {
      agentManager.name = await this.context.agentOwnerRegistryContract.getAgentName(manager)
      agentManager.description = await this.context.agentOwnerRegistryContract.getAgentDescription(manager)
      agentManager.iconUrl = await this.context.agentOwnerRegistryContract.getAgentIconUrl(manager)
    }
    return agentManager
  }

  private async updateAgentVaultInfo(em: EntityManager, agentVault: AgentVault): Promise<void> {
    try {
      await updateAgentVaultInfo(this.context, em, agentVault.address.hex)
    } catch (e: any) {
      if (e?.reason === 'invalid agent vault address') {
        return await em.transactional(async (em) => {
          const address = e.invocation.args[0]
          const untrackedAgentVault = new UntrackedAgentVault(address)
          agentVault.destroyed = true
          em.persist(untrackedAgentVault)
        })
      }
      throw e
    }
  }

}