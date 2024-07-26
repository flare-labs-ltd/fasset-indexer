import { Cascade, Collection, Entity, OneToMany, OneToOne, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
import { EvmAddress, UnderlyingAddress } from "./address"


@Entity()
export class AgentManager {

  @OneToOne({ entity: () => EvmAddress, owner: true, primary: true })
  address: EvmAddress

  @Property({ type: 'text', nullable: true})
  name?: string

  @Property({ type: 'text', nullable: true })
  description?: string

  @Property({ type: 'text', nullable: true })
  iconUrl?: string

  @OneToMany(() => AgentOwner, vault => vault.manager, { cascade: [Cascade.ALL] })
  agents = new Collection<AgentOwner>(this)

  constructor(address: EvmAddress, name?: string, description?: string, iconUrl?: string) {
    this.address = address
    this.name = name
    this.description = description
    this.iconUrl = iconUrl
  }
}

@Entity()
export class AgentOwner {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne(() => EvmAddress)
  address: EvmAddress

  @ManyToOne(() => AgentManager, { fieldName: 'agents' })
  manager: AgentManager

  @OneToMany(() => AgentVault, vault => vault.owner, { cascade: [Cascade.ALL] })
  vaults = new Collection<AgentVault>(this)

  constructor(address: EvmAddress, manager: AgentManager) {
    this.address = address
    this.manager = manager
  }
}

@Entity()
export class AgentVault {

  @OneToOne({ entity: () => EvmAddress, owner: true, primary: true })
  address: EvmAddress

  @OneToOne({ entity: () => UnderlyingAddress, owner: true })
  underlyingAddress: UnderlyingAddress

  @ManyToOne({ entity: () => EvmAddress, unique: true })
  collateralPool: EvmAddress

  @ManyToOne({ entity: () => EvmAddress, unique: true, nullable: true })
  collateralPoolToken?: EvmAddress

  @ManyToOne(() => AgentOwner, { fieldName: 'vaults' })
  owner: AgentOwner

  @Property({ type: 'boolean' })
  destroyed: boolean

  constructor(
    address: EvmAddress,
    underlyingAddress: UnderlyingAddress,
    collateralPool: EvmAddress,
    owner: AgentOwner,
    destroyed: boolean,
    collateralPoolToken?: EvmAddress
  ) {
    this.address = address
    this.underlyingAddress = underlyingAddress
    this.collateralPool = collateralPool
    this.collateralPoolToken = collateralPoolToken
    this.owner = owner
    this.destroyed = destroyed
  }

}