import { id as ethersId, Interface } from "ethers"
import { IAssetManager__factory, ERC20__factory, ICollateralPool__factory } from "../../chain/typechain"
import { EVENTS } from "../config/constants"
import type { IAssetManagerInterface } from "../../chain/typechain/IAssetManager"
import type { ICollateralPoolInterface } from "../../chain/typechain/ICollateralPool"
import type { ERC20Interface } from "../../chain/typechain/ERC20"
import type { FAssetIface } from "../shared"


export class EventInterface {
  public interfaces: {
    assetManagerInterface: IAssetManagerInterface,
    erc20Interface: ERC20Interface,
    collateralPoolInterface: ICollateralPoolInterface
  }

  constructor() {
    this.interfaces = {
      assetManagerInterface: IAssetManager__factory.createInterface(),
      erc20Interface: ERC20__factory.createInterface(),
      collateralPoolInterface: ICollateralPool__factory.createInterface()
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
      default:
        throw new Error(`Unknown interface ${name}`)
    }
  }
}
