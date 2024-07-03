import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { EvmLog, EventBound } from "../logs"
import { AgentVault } from "../agent"
import { EvmAddress } from "../address"


@Entity()
export class RedemptionRequestIncomplete extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @Property({ type: new uint256() })
  remainingLots: bigint

  constructor(evmLog: EvmLog, redeemer: EvmAddress, remainingLots: bigint) {
    super(evmLog)
    this.redeemer = redeemer
    this.remainingLots = remainingLots
  }
}

@Entity()
export class AgentSettingChanged extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'string' })
  name: string

  @Property({ type: new uint256() })
  value: bigint

  constructor(evmLog: EvmLog, agentVault: AgentVault, name: string, value: bigint) {
    super(evmLog)
    this.agentVault = agentVault
    this.name = name
    this.value = value
  }
}