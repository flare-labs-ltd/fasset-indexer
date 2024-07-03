import { Entity, OneToOne } from "@mikro-orm/core"
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