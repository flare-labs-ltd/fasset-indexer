import { Entity, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { FAssetType } from "../../../shared"
import { FAssetEventBound } from "./_bound"
import { EvmLog } from "../evm/log"


@Entity()
export class CoreVaultManagerSettingsUpdated extends FAssetEventBound {

  @Property({ type: new uint256() })
  escrowEndTimeSeconds: bigint

  @Property({ type: new uint256() })
  escrowAmount: bigint

  @Property({ type: new uint256() })
  minimalAmount: bigint

  @Property({ type: new uint256() })
  fee: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    escrowEndTimeSeconds: bigint, escrowAmount: bigint,
    minimalAmount: bigint, fee: bigint
  ) {
    super(evmLog, fasset)
    this.escrowEndTimeSeconds = escrowEndTimeSeconds
    this.escrowAmount = escrowAmount
    this.minimalAmount = minimalAmount
    this.fee = fee
  }

}