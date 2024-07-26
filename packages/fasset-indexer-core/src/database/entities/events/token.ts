import { Entity, Property, OneToOne } from "@mikro-orm/core"
import { EvmAddress } from "../address"
import { EventBound, EvmLog } from "../logs"


@Entity()
export class CollateralType extends EventBound {

  @OneToOne({ entity: () => EvmAddress, owner: true, primary: true })
  address: EvmAddress

  @Property({ type: 'number' })
  decimals: number

  @Property({ type: 'boolean' })
  directPricePair: boolean

  @Property({ type: 'text' })
  assetFtsoSymbol: string

  @Property({ type: 'text' })
  tokenFtsoSymbol: string

  @Property({ type: 'number' })
  collateralClass: number

  constructor(
    evmLog: EvmLog,
    collateralClass: number,
    address: EvmAddress,
    decimals: number,
    directPricePair: boolean,
    assetFtsoSymbol: string,
    tokenFtsoSymbol: string
  ) {
    super(evmLog)
    this.collateralClass = collateralClass
    this.address = address
    this.decimals = decimals
    this.directPricePair = directPricePair
    this.assetFtsoSymbol = assetFtsoSymbol
    this.tokenFtsoSymbol = tokenFtsoSymbol
  }
}