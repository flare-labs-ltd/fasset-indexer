import { Entity, ManyToOne, OneToOne, Property, Unique } from "@mikro-orm/core"
import { uint256, uint64 } from "../../custom/uint"
import { AgentVault } from "../agent"
import { FAssetEventBound } from "./_bound"
import type { EvmLog } from "../evm/log"
import type { FAssetType } from "../../../shared"


@Entity()
@Unique({ properties: ['fasset', 'redemptionTicketId'] })
export class RedemptionTicketCreated extends FAssetEventBound {

  @ManyToOne(() => AgentVault)
  agentVault: AgentVault

  @Property({ type: new uint64() })
  redemptionTicketId: bigint

  @Property({ type: new uint256() })
  ticketValueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, redemptionTicketId: bigint, ticketValueUBA: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.redemptionTicketId = redemptionTicketId
    this.ticketValueUBA = ticketValueUBA
  }
}

@Entity()
export class RedemptionTicketUpdated extends FAssetEventBound {

  @ManyToOne(() => RedemptionTicketCreated)
  redemptionTicketCreated: RedemptionTicketCreated

  @Property({ type: new uint256() })
  ticketValueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, redemptionTicketCreated: RedemptionTicketCreated, ticketValueUBA: bigint) {
    super(evmLog, fasset)
    this.redemptionTicketCreated = redemptionTicketCreated
    this.ticketValueUBA = ticketValueUBA
  }
}

@Entity()
export class RedemptionTicketDeleted extends FAssetEventBound {

  @OneToOne(() => RedemptionTicketCreated, { owner: true })
  redemptionTicketCreated: RedemptionTicketCreated

  constructor(evmLog: EvmLog, fasset: FAssetType, redemptionTicketCreated: RedemptionTicketCreated) {
    super(evmLog, fasset)
    this.redemptionTicketCreated = redemptionTicketCreated
  }
}