import { Entity, Enum, PrimaryKey, Property } from "@mikro-orm/core"
import { AddressType } from "../../interface"


@Entity()
export class UnderlyingAddress {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @Property({ type: 'text', unique: true })
  text: string

  @Enum(() => AddressType)
  type: AddressType

  constructor(text: string, type: AddressType) {
    this.text = text
    this.type = type
  }
}