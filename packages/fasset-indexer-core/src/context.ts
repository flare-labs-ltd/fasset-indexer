import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "./database/utils"
import {
  IAssetManager__factory, IAssetManagerEvents__factory, ERC20__factory,
  IAgentOwnerRegistry__factory, ICollateralPool__factory
} from "../chain/typechain"
import { FAssetType } from "./database/entities/events/_bound"
import type { IAssetManager, ERC20, IAgentOwnerRegistry } from "../chain/typechain"
import type { IAssetManagerEventsInterface } from "../chain/typechain/IAssetManagerEvents"
import type { ICollateralPoolInterface } from "../chain/typechain/ICollateralPool"
import type { ERC20Interface } from "../chain/typechain/ERC20"
import type { ORM } from "./database/interface"
import type { IConfig } from "./config/interface"


export class Context {
  provider: JsonRpcProvider
  assetManagerEventInterface: IAssetManagerEventsInterface
  collateralPoolInterface: ICollateralPoolInterface
  agentOwnerRegistryContract: IAgentOwnerRegistry
  erc20Interface: ERC20Interface
  orm: ORM
  // caches
  private assetManagerToFAsset__cache: Map<string, FAssetType> = new Map()
  private fAssetToAssetManager__cache: Map<FAssetType, string> = new Map()
  private isAssetManager__cache: Set<string> = new Set()
  private isFAssetToken__cache: Set<string> = new Set()

  constructor(public config: IConfig, orm: ORM) {
    this.provider = this.getEthersApiProvider(config.rpc.url, config.rpc.apiKey)
    this.assetManagerEventInterface = IAssetManagerEvents__factory.createInterface()
    this.agentOwnerRegistryContract = this.getAgentOwnerRegistryContract()
    this.collateralPoolInterface = ICollateralPool__factory.createInterface()
    this.erc20Interface = ERC20__factory.createInterface()
    this.orm = orm
    // populate caches for faster lookups
    this.populateAssetManagerToFAssetCache()
    this.populateIsAssetManagerCache()
    this.populateIsFAssetTokenCache()
  }

  static async create(config: IConfig): Promise<Context> {
    const orm = await createOrm(config.db, "safe")
    return new Context(config, orm)
  }

  getAssetManagerContract(address: string): IAssetManager {
    return IAssetManager__factory.connect(address, this.provider)
  }

  getERC20(address: string): ERC20 {
    return ERC20__factory.connect(address, this.provider)
  }

  isAssetManager(address: string): boolean {
    return this.isAssetManager__cache.has(address)
  }

  isFAssetToken(address: string): boolean {
    return this.isFAssetToken__cache.has(address)
  }

  addressToFAssetType(address: string): FAssetType {
    if (this.assetManagerToFAsset__cache.has(address)) {
      return this.assetManagerToFAsset__cache.get(address)!
    } else {
      throw new Error(`No FAsset found for address ${address}`)
    }
  }

  fAssetTypeToAssetManagerAddress(type: FAssetType): string {
    if (this.fAssetToAssetManager__cache.has(type)) {
      return this.fAssetToAssetManager__cache.get(type)!
    } else {
      throw new Error(`No AssetManager found for type ${type}`)
    }
  }

  getContractAddress(name: string): string {
    for (const contract of this.config.contracts.addresses) {
      if (contract.name === name)
        return contract.address
    }
    throw new Error(`Contract address not found for ${name}`)
  }

  protected populateAssetManagerToFAssetCache(): void {
    for (const contract of this.config.contracts.addresses) {
      let fasset = null
      if (contract.name === 'AssetManager_FTestXRP') {
        fasset = FAssetType.FXRP
      } else if (contract.name === 'AssetManager_FTestBTC') {
        fasset = FAssetType.FBTC
      } else if (contract.name === 'AssetManager_FTestDOGE') {
        fasset = FAssetType.FDOGE
      } else if (contract.name === 'AssetManager_FSimCoinX') {
        fasset = FAssetType.FSIMCOINX
      } else {
        continue
      }
      this.assetManagerToFAsset__cache.set(contract.address, fasset)
      this.fAssetToAssetManager__cache.set(fasset, contract.address)
    }
  }

  protected populateIsAssetManagerCache(): void {
    for (const contract of this.config.contracts.addresses) {
      if (contract.name.startsWith('AssetManager_')) {
        this.isAssetManager__cache.add(contract.address)
      }
    }
  }

  protected populateIsFAssetTokenCache(): void {
    for (const contract of this.config.contracts.addresses) {
      if (contract.contractName === "FAssetProxy.sol") {
        this.isFAssetToken__cache.add(contract.address)
      }
    }
  }

  private getEthersApiProvider(rpcUrl: string, apiKey?: string): JsonRpcProvider {
    const connection = new FetchRequest(rpcUrl)
    if (apiKey !== undefined) {
      connection.setHeader('x-api-key', apiKey)
    }
    return new JsonRpcProvider(connection)
  }

  private getAgentOwnerRegistryContract(): IAgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return IAgentOwnerRegistry__factory.connect(address, this.provider)
  }
}