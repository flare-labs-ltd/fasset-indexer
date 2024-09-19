import { Entity, Property, ManyToOne, PrimaryKey, OneToMany, Cascade, Collection, Unique } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { UnderlyingAddress } from "../address"
import { BtcBlock } from "./block"


@Entity()
export class BtcTx {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

  @ManyToOne(() => BtcBlock)
  block: BtcBlock

  @Property({ type: 'text', unique: true })
  txid: string

  @OneToMany(() => BtcTxInput, input => input.tx, { cascade: [Cascade.ALL] })
  inputs = new Collection<BtcTxInput>(this)

  @OneToMany(() => BtcTxOutput, output => output.tx, { cascade: [Cascade.ALL] })
  outputs = new Collection<BtcTxOutput>(this)

  @Property({ type: new uint256() })
  value: bigint

  @Property({ type: new uint256() })
  valueIn: bigint

  @Property({ type: new uint256() })
  fees: bigint

  constructor(block: BtcBlock, txid: string, value: bigint, valueIn: bigint, fees: bigint) {
    this.block = block
    this.txid = txid
    this.value = value
    this.valueIn = valueIn
    this.fees = fees
  }

}

@Entity()
@Unique({ properties: ['tx', 'index'] })
export class OpReturn {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

  @ManyToOne(() => BtcTx)
  tx: BtcTx

  @Property({ type: 'number' })
  index: number

  @Property({ type: new uint256() })
  value: bigint

  @Property({ type: 'text' })
  data: string

  constructor(tx: BtcTx, index: number, data: string, value: bigint) {
    this.tx = tx
    this.index = index
    this.data = data
    this.value = value
  }
}

class BtcTxIO {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

  @ManyToOne(() => BtcTx)
  tx: BtcTx

  @ManyToOne(() => UnderlyingAddress)
  address: UnderlyingAddress

  // 52 bits should be enough tho (total BTC supply = 21M)
  @Property({ type: new uint256() })
  value: bigint

  @Property({ type: 'number' })
  index: number

  constructor(tx: BtcTx, address: UnderlyingAddress, value: bigint, index: number) {
    this.tx = tx
    this.address = address
    this.value = value
    this.index = index
  }
}

@Entity()
@Unique({ properties: ['tx', 'index'] })
export class BtcTxOutput extends BtcTxIO {}

@Entity()
@Unique({ properties: ['tx', 'index'] })
export class BtcTxInput extends BtcTxIO {

  @Property({ type: 'text', nullable: true })
  spentTxId?: string

  @Property({ type: 'number', nullable: true })
  vout?: number

  constructor(tx: BtcTx, address: UnderlyingAddress, value: bigint, index: number, spentTxId?: string, vout?: number) {
    super(tx, address, value, index)
    this.spentTxId = spentTxId
    this.vout = vout
  }
}