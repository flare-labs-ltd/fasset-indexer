import { Entity, ManyToOne, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { EventBound, EvmLog } from "../logs"
import { EvmAddress } from "../address"


@Entity()
export class ERC20Transfer extends EventBound {

  @ManyToOne({ entity: () => EvmAddress })
  from: EvmAddress

  @ManyToOne({ entity: () => EvmAddress })
  to: EvmAddress

  @Property({ type: new uint256() })
  value: bigint

  constructor(evmLog: EvmLog, from: EvmAddress, to: EvmAddress, value: bigint) {
    super(evmLog)
    this.from = from
    this.to = to
    this.value = value
  }

}