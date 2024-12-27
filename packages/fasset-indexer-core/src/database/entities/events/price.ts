import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { EventBound } from './_bound'
import type { EvmLog } from '../evm/log'


@Entity()
export class PricesPublished extends EventBound {

  @Property({ type: 'number' })
  votingRoundId: number

  constructor(evmLog: EvmLog, votingRoundId: number) {
    super(evmLog)
    this.votingRoundId = votingRoundId
  }
}

@Entity()
export class PricePublished {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => PricesPublished })
  pricesPublished: PricesPublished

  @Property({ type: 'text' })
  symbol: string

  @Property({ type: 'bigint' })
  price: bigint

  @Property({ type: 'number' })
  decimals: number

  constructor(pricesPublished: PricesPublished, symbol: string, price: bigint, decimals: number) {
    this.pricesPublished = pricesPublished
    this.symbol = symbol
    this.price = price
    this.decimals = decimals
  }
}