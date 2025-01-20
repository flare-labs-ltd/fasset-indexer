import { AddressType } from "../../database/entities/address"
import { AgentManager, AgentOwner, AgentVault } from "../../database/entities/agent"
import { AgentVaultSettings } from "../../database/entities/state/agent"
import { AgentVaultCreated } from "../../database/entities/events/agent"
import { UntrackedAgentVault } from "../../database/entities/state/var"
import { CollateralTypeAdded } from "../../database/entities/events/token"
import { PricePublished, PricesPublished } from "../../database/entities/events/price"
import { updateAgentVaultInfo, findOrCreateEvmAddress } from "../shared"
import { getPriceFromDal } from "../../context/dal"
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
    const collateralPoolToken = this.context.getERC20(agentVaultEntity.collateralPoolToken.hex)
    agentVaultEntity.collateralPoolTokenSymbol = await collateralPoolToken.symbol()
    await this.updateAgentVaultInfo(em, agentVaultEntity)
    return [agentVaultEntity, avs, avc]
  }

  protected override async onPublishedPrices(em: EntityManager, evmLog: EvmLog, args: any): Promise<PricesPublished> {
    const pp = await super.onPublishedPrices(em, evmLog, args)
    await this.addPriceSnapshot(em, pp)
    return pp
  }

  protected async ensureAgentManager(em: EntityManager, address: string): Promise<AgentManager> {
    let agentManager = await em.findOne(AgentManager, { address: { hex: address }}, { populate: ['address'] })
    if (agentManager === null) {
      agentManager = await this.findOrCreateAgentManager(em, address, true)
      em.persist(agentManager)
    }
    return agentManager
  }

  protected async ensureAgentWorker(em: EntityManager, manager: AgentManager): Promise<AgentOwner> {
    let agentWorker = await em.findOne(AgentOwner, { manager })
    if (agentWorker === null) {
      const address = await this.context.contracts.agentOwnerRegistryContract.getWorkAddress(manager.address.hex)
      const evmAddress = await findOrCreateEvmAddress(em, address, AddressType.AGENT)
      agentWorker = new AgentOwner(evmAddress, manager)
      em.persist(agentWorker)
    }
    return agentWorker
  }

  protected async findOrCreateAgentManager(em: EntityManager, manager: string, full: boolean): Promise<AgentManager> {
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

  private async addPriceSnapshot(em: EntityManager, pricesPublished: PricesPublished): Promise<void> {
    const collateralTypes = await em.findAll(CollateralTypeAdded)
    const symbols = new Set(collateralTypes.map((ct) => [ct.tokenFtsoSymbol, ct.assetFtsoSymbol]).flat())
    for (let symbol of symbols) {
      const [price, decimals] = await getPriceFromDal(symbol, pricesPublished.votingRoundId)
      const priceEntity = new PricePublished(pricesPublished, symbol, price, decimals)
      em.persist(priceEntity)
    }
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