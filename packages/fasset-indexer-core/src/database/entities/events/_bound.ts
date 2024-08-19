import { OneToOne, Enum } from "@mikro-orm/core"
import { EvmLog } from "../evm/log"


export enum FAssetType { FXRP, FBTC, FDOGE, FLTC, FALG, FSIMCOINX }

export class EventBound {

    @OneToOne({ entity: () => EvmLog, owner: true, primary: true })
    evmLog: EvmLog

    constructor(evmLog: EvmLog) {
      this.evmLog = evmLog
    }
  }

  export class FAssetEventBound extends EventBound {

    @Enum(() => FAssetType)
    fasset: FAssetType

    constructor(evmLog: EvmLog, fasset: FAssetType) {
      super(evmLog)
      this.fasset = fasset
    }
  }