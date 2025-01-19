import { AddressType } from "../../database/entities/address"
import { AgentManager, AgentOwner, AgentVault } from "../../database/entities/agent"
import { AgentVaultSettings } from "../../database/entities/state/agent"
import { AgentVaultCreated } from "../../database/entities/events/agent"
import { UntrackedAgentVault } from "../../database/entities/state/var"
import { updateAgentVaultInfo, findOrCreateEvmAddress } from "../shared"
import { EventStorer } from "./event-storer"
import type { EntityManager } from "@mikro-orm/knex"
import type { AgentVaultCreatedEvent } from "../../../chain/typechain/IAssetManager"
import type { Context } from "../../context/context"
import type { EvmLog } from "../../database/entities/evm/log"


// binds chain reading to event storage
export class StateUpdater extends EventStorer {

  constructor(public readonly context: Context) {
    super(context.orm, context)
  }

  protected override async onAgentVaultCreated(em: EntityManager, evmLog: EvmLog, args: AgentVaultCreatedEvent.OutputTuple): Promise<[
    AgentVault, AgentVaultSettings, AgentVaultCreated
  ]> {
    const [ owner, ] = args
    const manager = await this.ensureAgentManager(em, owner)
    await this.ensureAgentWorker(em, manager)
    const [agentVaultEntity, avs, avc] = await super.onAgentVaultCreated(em, evmLog, args)
    await this.updateAgentVaultInfo(em, agentVaultEntity)
    return [agentVaultEntity, avs, avc]
  }

  private async ensureAgentManager(em: EntityManager, address: string): Promise<AgentManager> {
    let agentManager = await em.findOne(AgentManager, { address: { hex: address }}, { populate: ['address'] })
    if (agentManager === null) {
      agentManager = await this.findOrCreateAgentManager(em, address, true)
      em.persist(agentManager)
    }
    return agentManager
  }

  private async ensureAgentWorker(em: EntityManager, manager: AgentManager): Promise<AgentOwner> {
    let agentWorker = await em.findOne(AgentOwner, { manager })
    if (agentWorker === null) {
      const address = await this.context.contracts.agentOwnerRegistryContract.getWorkAddress(manager.address.hex)
      const evmAddress = await findOrCreateEvmAddress(em, address, AddressType.AGENT)
      agentWorker = new AgentOwner(evmAddress, manager)
      em.persist(agentWorker)
    }
    return agentWorker
  }

  private async findOrCreateAgentManager(em: EntityManager, manager: string, full: boolean): Promise<AgentManager> {
    let agentManager = await em.findOne(AgentManager, { address: { hex: manager }})
    if (agentManager === null) {
      const managerEvmAddress = await findOrCreateEvmAddress(em, manager, AddressType.AGENT)
      agentManager = new AgentManager(managerEvmAddress)
    }
    if (full && agentManager.name === undefined) {
      agentManager.name = await this.context.contracts.agentOwnerRegistryContract.getAgentName(manager)
      agentManager.description = await this.context.contracts.agentOwnerRegistryContract.getAgentDescription(manager)
      agentManager.iconUrl = await this.context.contracts.agentOwnerRegistryContract.getAgentIconUrl(manager)
    }
    return agentManager
  }

  private async updateAgentVaultInfo(em: EntityManager, agentVault: AgentVault): Promise<void> {
    try {
      const assetManager = this.context.fAssetTypeToAssetManagerAddress(agentVault.fasset)
      await updateAgentVaultInfo(this.context, em, assetManager, agentVault.address.hex)
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