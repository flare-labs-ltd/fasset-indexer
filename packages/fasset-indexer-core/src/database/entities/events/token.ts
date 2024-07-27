import { Entity, Property, OneToOne, ManyToOne, PrimaryKey } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
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

@Entity()
export class ERC20Transfer extends EventBound {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => EvmAddress })
  from: EvmAddress

  @ManyToOne({ entity: () => EvmAddress })
  to: EvmAddress

  @Property({ type: new uint256() })
  value: bigint

  constructor(evmLog: EvmLog, from: EvmAddress, to: EvmAddress, value: bigint) {
    super(evmLog)
    this.from = from
    this.to = to
    this.value = value
  }

}