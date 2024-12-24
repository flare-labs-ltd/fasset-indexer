import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { EvmLog } from "../evm/log"
import { FAssetEventBound } from "./_bound"
import { AgentVault } from "../agent"
import type { FAssetType } from "../../../shared"


@Entity()
export class AgentVaultCreated extends FAssetEventBound {

  @OneToOne({ entity: () => AgentVault, owner: true })
  agentVault: AgentVault

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault) {
    super(evmLog, fasset)
    this.agentVault = agentVault
  }
}

@Entity()
export class AgentSettingChanged extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'text' })
  name: string

  @Property({ type: new uint256() })
  value: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, name: string, value: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.name = name
    this.value = value
  }
}

@Entity()
export class SelfClose extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, valueUBA: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.valueUBA = valueUBA
  }
}