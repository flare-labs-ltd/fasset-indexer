import { id as ethersId, Interface } from "ethers"
import {
  IAssetManager__factory, IERC20__factory, ICollateralPool__factory,
  IPriceChangeEmitter__factory,
  ICoreVault__factory
} from "../../chain/typechain"
import { EVENTS } from "../config/constants"
import type { IAssetManagerInterface } from "../../chain/typechain/IAssetManager"
import type { ICollateralPoolInterface } from "../../chain/typechain/ICollateralPool"
import type { IPriceChangeEmitterInterface } from "../../chain/typechain/IPriceChangeEmitter"
import type { IERC20Interface } from "../../chain/typechain/IERC20"
import type { ICoreVaultInterface } from "../../chain/typechain/ICoreVault"
import type { FAssetIface } from "../shared"


export class EventInterface {
  public interfaces: {
    assetManagerInterface: IAssetManagerInterface,
    erc20Interface: IERC20Interface,
    collateralPoolInterface: ICollateralPoolInterface,
    priceReader: IPriceChangeEmitterInterface
    coreVaultInterface: ICoreVaultInterface
  }

  constructor() {
    this.interfaces = {
      assetManagerInterface: IAssetManager__factory.createInterface(),
      erc20Interface: IERC20__factory.createInterface(),
      collateralPoolInterface: ICollateralPool__factory.createInterface(),
      priceReader: IPriceChangeEmitter__factory.createInterface(),
      coreVaultInterface: ICoreVault__factory.createInterface()
    }
  }

  getTopicToIfaceMap(eventNames?: string[]): Map<string, FAssetIface> {
    const mp = new Map<string, FAssetIface>()
    for (const contractname of Object.keys(EVENTS)) {
      const cname = contractname as keyof typeof EVENTS
      const iface = this.contractToIface(contractname)
      for (const event of Object.values(EVENTS[cname])) {
        if (eventNames?.includes(event) !== false) {
          const topic = this.getEventTopic(event, iface)
          mp.set(topic, cname)
        }
      }
    }
    return mp
  }

  getEventTopic(eventName: string, iface: Interface): string {
    const parsed = iface.getEvent(eventName)
    if (parsed === null) {
      throw new Error(`Event ${eventName} not found in interface`)
    }
    return ethersId(parsed.format('sighash'))
  }

  contractToIface(name: string): Interface {
    switch (name) {
      case "ERC20":
        return this.interfaces.erc20Interface
      case "ASSET_MANAGER":
        return this.interfaces.assetManagerInterface
      case "COLLATERAL_POOL":
        return this.interfaces.collateralPoolInterface
      case "PRICE_READER":
        return this.interfaces.priceReader
      default:
        throw new Error(`Unknown interface ${name}`)
    }
  }
}
