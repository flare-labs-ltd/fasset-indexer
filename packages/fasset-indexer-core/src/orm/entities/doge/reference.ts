import { Entity, ManyToOne, Property, PrimaryKey, Unique } from "@mikro-orm/core"
import { DogeAddress } from "./address"
import { DogeBlock } from "./block"


@Entity()
@Unique({ properties: ['block', 'reference', 'transactionHash'] })
export class DogeVoutReference {

  @PrimaryKey({ autoincrement: true, type: 'integer' })
  id!: number

  @Property({ type: 'text' })
  reference: string

  @Property({ type: 'text' })
  transactionHash: string

  @ManyToOne(() => DogeAddress)
  address: DogeAddress

  @ManyToOne(() => DogeBlock)
  block: DogeBlock

  constructor(reference: string, transactionHash: string, address: DogeAddress, block: DogeBlock) {
    this.reference = reference
    this.transactionHash = transactionHash
    this.address = address
    this.block = block
  }

}