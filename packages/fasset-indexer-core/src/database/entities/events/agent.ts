import { Entity, ManyToOne, OneToOne, PrimaryKey, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { EvmLog, EventBound } from "../logs"
import { AgentVault } from "../agent"


@Entity()
export class AgentVaultCreated extends EventBound {

  @OneToOne({ entity: () => AgentVault, primary: true, owner: true })
  agentVault: AgentVault

  constructor(evmLog: EvmLog, agentVault: AgentVault) {
    super(evmLog)
    this.agentVault = agentVault
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

@Entity()
export class SelfClose extends EventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, agentVault: AgentVault, valueUBA: bigint) {
    super(evmLog)
    this.agentVault = agentVault
    this.valueUBA = valueUBA
  }
}