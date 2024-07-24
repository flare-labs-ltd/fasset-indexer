import { Entity, PrimaryKey, Property, Unique, OneToOne, ManyToOne } from "@mikro-orm/core"
import { BYTES32_LENGTH } from "../../config/constants"
import { EvmAddress } from "./address"

@Entity()
@Unique({ properties: ['blockNumber', 'transactionIndex', 'logIndex'] })
export class EvmLog {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @Property({ type: "number" })
  blockNumber: number

  @Property({ type: "number" })
  transactionIndex: number

  @Property({ type: "number" })
  logIndex: number

  @Property({ type: "text" })
  name: string

  @ManyToOne({ entity: () => EvmAddress })
  address: EvmAddress

  @Property({ type: 'number' })
  timestamp: number

  @Property({ type: "text", length: BYTES32_LENGTH })
  transaction: string

  @ManyToOne({ entity: () => EvmAddress, nullable: true })
  transactionSource: EvmAddress

  @ManyToOne({ entity: () => EvmAddress, nullable: true })
  transactionTarget?: EvmAddress

  constructor(
    blockNumber: number,
    transactionIndex: number,
    logIndex: number,
    name: string,
    address: EvmAddress,
    timestamp: number,
    transaction: string,
    transactionSource: EvmAddress,
    transactionTarget: EvmAddress | null
  ) {
    this.blockNumber = blockNumber
    this.transactionIndex = transactionIndex
    this.logIndex = logIndex
    this.name = name
    this.address = address
    this.timestamp = timestamp
    this.transaction = transaction
    this.transactionSource = transactionSource
    if (transactionTarget !== null) {
      this.transactionTarget = transactionTarget
    }
  }
}

export class EventBound {

  @OneToOne({ entity: () => EvmLog, owner: true, unique: true })
  evmLog: EvmLog

  constructor(evmLog: EvmLog) {
    this.evmLog = evmLog
  }

}