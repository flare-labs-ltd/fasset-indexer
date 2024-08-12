import { Entity, PrimaryKey, Property } from "@mikro-orm/core"


@Entity()
export class EvmBlock {

  @PrimaryKey({ type: "number", primary: true })
  index: number

  @Property({ type: "number" })
  timestamp: number

  constructor(index: number, timestamp: number) {
    this.index = index
    this.timestamp = timestamp
  }
}