import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "./database/utils"
import { AgentVault } from "./database/entities/agent"
import { AssetManager__factory, AMEvents__factory, ERC20__factory, AgentOwnerRegistry__factory, CollateralPool__factory } from "../chain/typechain"
import type { AssetManager, ERC20, AgentOwnerRegistry } from "../chain/typechain"
import type { AMEventsInterface } from "../chain/typechain/AMEvents"
import type { CollateralPoolInterface } from "../chain/typechain/CollateralPool"
import type { ORM } from "./database/interface"
import type { IConfig } from "./config/interface"


export class Context {
  provider: JsonRpcProvider
  assetManagerEventInterface: AMEventsInterface
  collateralPoolInterface: CollateralPoolInterface
  agentOwnerRegistryContract: AgentOwnerRegistry
  orm: ORM

  constructor(public config: IConfig, orm: ORM) {
    this.provider = this.getEthersApiProvider(config.rpc.url, config.rpc.apiKey)
    this.assetManagerEventInterface = this.getAssetManagerEventInterface()
    this.agentOwnerRegistryContract = this.getAgentOwnerRegistryContract()
    this.collateralPoolInterface = this.getCollateralPoolInterface()
    this.orm = orm
  }

  static async create(config: IConfig): Promise<Context> {
    const orm = await createOrm(config.db, "safe")
    return new Context(config, orm)
  }

  getAssetManagerContract(fAsset: string): AssetManager {
    const contractName = `AssetManager_${fAsset}`
    const address = this.getContractAddress(contractName)
    return AssetManager__factory.connect(address, this.provider)
  }

  getContractAddress(name: string): string {
    for (const contract of this.config.contracts.addresses) {
      if (contract.name === name)
        return contract.address
    }
    throw new Error(`Contract address not found for ${name}`)
  }

  getLogTopic(name: string): string | undefined {
    return this.assetManagerEventInterface.getEvent(name as any)?.topicHash
  }

  ignoreLog(name: string): boolean {
    for (const ignored of this.config.ignoreEvents ?? []) {
      if (ignored === name) return true
    }
    return false
  }

  getERC20(address: string): ERC20 {
    return ERC20__factory.connect(address, this.provider)
  }

  // define which source addresses the indexer is tracking
  async trackedSourceAddresses(): Promise<string[]> {
    const collateralPools = await this.orm.em.fork().find(
      AgentVault, { destroyed: false }, { populate: ['collateralPool'] })
    const addresses = collateralPools.map(pool => pool.collateralPool.hex)
    addresses.push(this.getContractAddress('AssetManager_FTestXRP'))
    addresses.push(this.getContractAddress('FTestXRP'))
    return addresses
  }

  private getEthersApiProvider(rpcUrl: string, apiKey?: string): JsonRpcProvider {
    const connection = new FetchRequest(rpcUrl)
    if (apiKey !== undefined) {
      connection.setHeader('x-api-key', apiKey)
    }
    return new JsonRpcProvider(connection)
  }

  private getAssetManagerEventInterface(): AMEventsInterface {
    return AMEvents__factory.createInterface()
  }

  private getCollateralPoolInterface(): CollateralPoolInterface {
    return CollateralPool__factory.createInterface()
  }

  private getAgentOwnerRegistryContract(): AgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return AgentOwnerRegistry__factory.connect(address, this.provider)
  }
}