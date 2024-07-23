import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "./database/utils"
import { AssetManager__factory, AMEvents__factory, ERC20__factory, AgentOwnerRegistry__factory } from "../chain/typechain"
import type { AssetManager, ERC20 } from "../chain/typechain"
import type { AMEventsInterface } from "../chain/typechain/AMEvents"
import type { AgentOwnerRegistry } from "../chain/typechain"
import type { ORM } from "./database/interface"
import type { IConfig } from "./config/interface"


export class Context {
  provider: JsonRpcProvider
  assetManagerEventInterface: AMEventsInterface
  agentOwnerRegistryContract: AgentOwnerRegistry
  orm: ORM

  constructor(public config: IConfig, orm: ORM) {
    this.provider = this.getEthersApiProvider(config.rpc.url, config.rpc.apiKey)
    this.assetManagerEventInterface = this.getAssetManagerEventInterface()
    this.agentOwnerRegistryContract = this.getAgentOwnerRegistryContract()
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

  private getAgentOwnerRegistryContract(): AgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return AgentOwnerRegistry__factory.connect(address, this.provider)
  }
}