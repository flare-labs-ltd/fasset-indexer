import { Entity, PrimaryKey, Property } from "@mikro-orm/core"


@Entity()
export class DogeAddress {

  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number

  @Property({ type: 'text', unique: true })
  hash: string

  constructor(hash: string) {
    this.hash = hash
  }

}