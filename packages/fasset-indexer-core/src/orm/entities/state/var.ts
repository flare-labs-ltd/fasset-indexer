import { Entity, PrimaryKey, Property } from "@mikro-orm/core"


@Entity()
export class Var {

  @PrimaryKey({ type: "text" })
  key: string

  @Property({ type: "text", nullable: true })
  value?: string

  constructor(key: string, value?: string) {
    this.key = key
    this.value = value
  }
}

@Entity()
export class UntrackedAgentVault {

  @PrimaryKey({ type: "text" })
  address: string

  constructor(address: string) {
    this.address = address
  }
}