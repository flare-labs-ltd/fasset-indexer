import { JsonRpcProvider, FetchRequest } from "ethers"
import { createOrm } from "../database/utils"
import { ContractLookup } from "./lookup"
import { IAssetManager__factory, IERC20__factory, IAgentOwnerRegistry__factory, IPriceReader__factory } from "../../chain/typechain"
import type { IAssetManager, IERC20, IAgentOwnerRegistry, IPriceReader } from "../../chain/typechain"
import type { ORM } from "../database/interface"
import type { IConfig } from "../config/interface"


export class Context extends ContractLookup {
  public provider: JsonRpcProvider
  public contracts: {
    agentOwnerRegistryContract: IAgentOwnerRegistry
    priceReader: IPriceReader
  }

  constructor(public config: IConfig, public orm: ORM) {
    super(config.chain, config.addressesJson)
    this.provider = this.getEthersApiProvider(config.rpc.url, config.rpc.apiKey)
    this.contracts = {
      agentOwnerRegistryContract: this.getAgentOwnerRegistryContract(),
      priceReader: this.getPriceReaderContract()
    }
  }

  static async create(config: IConfig): Promise<Context> {
    const orm = await createOrm(config.db, "safe")
    return new Context(config, orm)
  }

  getAssetManagerContract(address: string): IAssetManager {
    return IAssetManager__factory.connect(address, this.provider)
  }

  getERC20(address: string): IERC20 {
    return IERC20__factory.connect(address, this.provider)
  }

  private getEthersApiProvider(rpcUrl: string, apiKey?: string): JsonRpcProvider {
    const connection = new FetchRequest(rpcUrl)
    if (apiKey !== undefined) {
      connection.setHeader('x-api-key', apiKey)
      connection.setHeader('x-apikey', apiKey)
    }
    return new JsonRpcProvider(connection)
  }

  private getAgentOwnerRegistryContract(): IAgentOwnerRegistry {
    const address = this.getContractAddress("AgentOwnerRegistry")
    return IAgentOwnerRegistry__factory.connect(address, this.provider)
  }

  private getPriceReaderContract(): IPriceReader {
    const address = this.getContractAddress("PriceReader")
    return IPriceReader__factory.connect(address, this.provider)
  }

}