import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "./database/utils"
import { AssetManager__factory, AMEvents__factory, ERC20__factory, AgentOwnerRegistry__factory, CollateralPool__factory } from "../chain/typechain"
import type { AssetManager, ERC20, AgentOwnerRegistry } from "../chain/typechain"
import type { AMEventsInterface } from "../chain/typechain/AMEvents"
import type { CollateralPool, CollateralPoolInterface } from "../chain/typechain/CollateralPool"
import type { ERC20Interface } from "../chain/typechain/ERC20"
import type { ORM } from "./database/interface"
import type { IConfig } from "./config/interface"
import { FAssetType } from "./database/entities/events/_bound"


export class Context {
  provider: JsonRpcProvider
  assetManagerEventInterface: AMEventsInterface
  collateralPoolInterface: CollateralPoolInterface
  agentOwnerRegistryContract: AgentOwnerRegistry
  erc20Interface: ERC20Interface
  orm: ORM

  constructor(public config: IConfig, orm: ORM) {
    this.provider = this.getEthersApiProvider(config.rpc.url, config.rpc.apiKey)
    this.assetManagerEventInterface = AMEvents__factory.createInterface()
    this.agentOwnerRegistryContract = this.getAgentOwnerRegistryContract()
    this.collateralPoolInterface = CollateralPool__factory.createInterface()
    this.erc20Interface = ERC20__factory.createInterface()
    this.orm = orm
  }

  static async create(config: IConfig): Promise<Context> {
    const orm = await createOrm(config.db, "safe")
    return new Context(config, orm)
  }

  isAssetManagerAddress(address: string): boolean {
    for (const contract of this.config.contracts.addresses) {
      if (contract.address === address && contract.name.startsWith('AssetManager_')) {
        return true
      }
    }
    return false
  }

  isFAssetToken(address: string): boolean {
    for (const contract of this.config.contracts.addresses) {
      if (contract.address === address && contract.contractName === "FAsset.sol") {
        return true
      }
    }
    return false
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

  getCollateralPool(address: string): CollateralPool {
    return CollateralPool__factory.connect(address, this.provider)
  }

  addressToFAssetType(address: string): FAssetType {
    for (const contract of this.config.contracts.addresses) {
      if (contract.address === address) {
        if (contract.name.startsWith('FTestXRP')) {
          return FAssetType.FXRP
        } else if (contract.name.startsWith('FTestBTC')) {
          return FAssetType.FBTC
        } else if (contract.name.startsWith('FTestDOGE')) {
          return FAssetType.FDOGE
        }
      }
    }
    throw new Error(`No FAsset found for address ${address}`)
  }

  private getEthersApiProvider(rpcUrl: string, apiKey?: string): JsonRpcProvider {
    const connection = new FetchRequest(rpcUrl)
    if (apiKey !== undefined) {
      connection.setHeader('x-api-key', apiKey)
    }
    return new JsonRpcProvider(connection)
  }

  private getAgentOwnerRegistryContract(): AgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return AgentOwnerRegistry__factory.connect(address, this.provider)
  }
}