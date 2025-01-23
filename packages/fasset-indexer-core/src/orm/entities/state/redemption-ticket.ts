import { Entity, OneToOne, Property } from "@mikro-orm/core"
import { RedemptionTicketCreated } from "../events/redemption-ticket"
import { uint256 } from "../../custom/uint"

@Entity()
export class RedemptionTicket {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionTicketCreated })
  redemptionTicketCreated: RedemptionTicketCreated

  @Property({ type: new uint256() })
  ticketValueUBA: bigint

  @Property({ type: 'boolean' })
  destroyed: boolean

  constructor(redemptionTicketCreated: RedemptionTicketCreated, ticketValueUBA: bigint) {
    this.redemptionTicketCreated = redemptionTicketCreated
    this.ticketValueUBA = ticketValueUBA
    this.destroyed = false
  }

}