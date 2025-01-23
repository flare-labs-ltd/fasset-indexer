import { Entity, Property } from "@mikro-orm/core"
import { FAssetEventBound } from "./_bound"
import type { FAssetType } from "../../../shared"
import type { EvmLog } from "../evm/log"


@Entity()
export class CurrentUnderlyingBlockUpdated extends FAssetEventBound {

  @Property({ type: 'number' })
  underlyingBlockNumber: number

  @Property({ type: 'number' })
  underlyingBlockTimestamp: number

  @Property({ type: 'number' })
  updatedAt: number

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    underlyingBlockNumber: number,
    underlyingBlockTimestamp: number,
    updatedAt: number
  ) {
    super(evmLog, fasset)
    this.underlyingBlockNumber = underlyingBlockNumber
    this.underlyingBlockTimestamp = underlyingBlockTimestamp
    this.updatedAt = updatedAt
  }

}