import { Entity, ManyToOne, Property, PrimaryKey, Unique } from "@mikro-orm/core"
import { DogeBlock } from "./block"
import { UnderlyingAddress } from "../address"


@Entity()
@Unique({ properties: ['block', 'reference', 'transactionHash'] })
export class DogeVoutReference {

  @PrimaryKey({ autoincrement: true, type: 'integer' })
  id!: number

  @Property({ type: 'text' })
  reference: string

  @Property({ type: 'text' })
  transactionHash: string

  @ManyToOne(() => UnderlyingAddress)
  address: UnderlyingAddress

  @ManyToOne(() => DogeBlock)
  block: DogeBlock

  constructor(reference: string, transactionHash: string, address: UnderlyingAddress, block: DogeBlock) {
    this.reference = reference
    this.transactionHash = transactionHash
    this.address = address
    this.block = block
  }

}