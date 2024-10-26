import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "../database/utils"
import { Contracts } from "./contracts"
import {
  IAssetManager__factory, ERC20__factory,
  IAgentOwnerRegistry__factory, ICollateralPool__factory,
  IPriceReader__factory
} from "../../chain/typechain"
import type { IAssetManager, ERC20, IAgentOwnerRegistry, IPriceReader } from "../../chain/typechain"
import type { IAssetManagerInterface } from "../../chain/typechain/IAssetManager"
import type { ICollateralPoolInterface } from "../../chain/typechain/ICollateralPool"
import type { ERC20Interface } from "../../chain/typechain/ERC20"
import type { ORM } from "../database/interface"
import type { IConfig } from "../config/interface"


export class Context extends Contracts {
  provider: JsonRpcProvider
  assetManagerInterface: IAssetManagerInterface
  collateralPoolInterface: ICollateralPoolInterface
  agentOwnerRegistryContract: IAgentOwnerRegistry
  erc20Interface: ERC20Interface

  constructor(public config: IConfig, public orm: ORM) {
    super()
    this.provider = this.getEthersApiProvider(config.flrRpc.url, config.flrRpc.apiKey)
    this.assetManagerInterface = IAssetManager__factory.createInterface()
    this.agentOwnerRegistryContract = this.getAgentOwnerRegistryContract()
    this.collateralPoolInterface = ICollateralPool__factory.createInterface()
    this.erc20Interface = ERC20__factory.createInterface()
  }

  static async create(config: IConfig): Promise<Context> {
    const orm = await createOrm(config.db, "safe")
    return new Context(config, orm)
  }

  getAssetManagerContract(address: string): IAssetManager {
    return IAssetManager__factory.connect(address, this.provider)
  }

  getPriceReaderContract(address: string): IPriceReader {
    return IPriceReader__factory.connect(address, this.provider)
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

  private getAgentOwnerRegistryContract(): IAgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return IAgentOwnerRegistry__factory.connect(address, this.provider)
  }
}