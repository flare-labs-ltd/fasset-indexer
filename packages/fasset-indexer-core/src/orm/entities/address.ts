import { Entity, Enum, PrimaryKey, Property } from "@mikro-orm/core"
import { AddressType } from "../interface"
import { ADDRESS_LENGTH } from "../../config/constants"


@Entity()
export class EvmAddress {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @Property({ type: 'text', length: ADDRESS_LENGTH, unique: true })
  hex: string

  @Enum(() => AddressType)
  type: AddressType

  constructor(address: string, type: AddressType) {
    this.hex = address
    this.type = type
  }
}