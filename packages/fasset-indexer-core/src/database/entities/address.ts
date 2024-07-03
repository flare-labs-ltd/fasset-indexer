import { Entity, Enum, PrimaryKey, Property } from "@mikro-orm/core"
import { ADDRESS_LENGTH } from "../../constants"


export enum AddressType { USER, AGENT, SYSTEM, SERVICE }

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