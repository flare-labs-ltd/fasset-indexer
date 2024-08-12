import { Entity, PrimaryKey, Property, Unique, ManyToOne } from "@mikro-orm/core"
import { EvmAddress } from "../address"
import { BYTES32_LENGTH } from "../../../config/constants"
import { EvmBlock } from "./block"


@Entity()
@Unique({ properties: ['block', 'index'] })
export class EvmTransaction {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @Property({ type: "text", length: BYTES32_LENGTH })
  hash: string

  @ManyToOne({ entity: () => EvmBlock })
  block: EvmBlock

  @Property({ type: "number" })
  index: number

  @ManyToOne({ entity: () => EvmAddress })
  source: EvmAddress

  @ManyToOne({ entity: () => EvmAddress, nullable: true })
  target?: EvmAddress

  constructor(
    hash: string,
    block: EvmBlock,
    index: number,
    source: EvmAddress,
    target?: EvmAddress
  ) {
    this.hash = hash
    this.index = index
    this.block = block
    this.source = source
    this.target = target
  }
}