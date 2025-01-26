import { Entity, ManyToOne, Property, PrimaryKey, Unique, Enum } from "@mikro-orm/core"
import { UnderlyingBlock } from "./block"
import { UnderlyingAddress } from "../underlying/address"
import { FAssetType } from "../../../shared"


@Entity()
@Unique({ properties: ['fasset', 'block', 'reference', 'transactionHash'] })
export class UnderlyingVoutReference {

  @PrimaryKey({ autoincrement: true, type: 'integer' })
  id!: number

  @Enum(() => FAssetType)
  fasset: FAssetType

  @Property({ type: 'text' })
  reference: string

  @Property({ type: 'text' })
  transactionHash: string

  @ManyToOne(() => UnderlyingAddress)
  address: UnderlyingAddress

  @ManyToOne(() => UnderlyingBlock)
  block: UnderlyingBlock

  constructor(fasset: FAssetType, reference: string, transactionHash: string, address: UnderlyingAddress, block: UnderlyingBlock) {
    this.fasset = fasset
    this.reference = reference
    this.transactionHash = transactionHash
    this.address = address
    this.block = block
  }

}