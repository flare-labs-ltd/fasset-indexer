import { Entity, PrimaryKey, Property } from "@mikro-orm/core"


@Entity()
export class BtcBlock {

  @PrimaryKey({ type: "number" })
  index: number

  @Property({ type: "text", unique: true })
  hash: string

  @Property({ type: "number" })
  timestamp: number

  constructor(index: number, hash: string, timestamp: number) {
    this.index = index
    this.hash = hash
    this.timestamp = timestamp
  }
}