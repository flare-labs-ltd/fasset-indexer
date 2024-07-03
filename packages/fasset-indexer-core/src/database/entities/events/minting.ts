import { Entity, Property, ManyToOne, PrimaryKey, OneToOne } from '@mikro-orm/core'
import { uint256 } from '../../custom/typeUint256'
import { EvmAddress, UnderlyingAddress } from '../address'
import { EvmLog, EventBound } from '../logs'
import { AgentVault } from '../agent'
import { BYTES32_LENGTH } from '../../../constants'


@Entity()
export class CollateralReserved extends EventBound {

  @PrimaryKey({ type: 'number' })
  collateralReservationId: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @ManyToOne({ entity: () => EvmAddress })
  minter: EvmAddress

  @Property({ type: new uint256() })
  valueUBA: bigint

  @Property({ type: new uint256() })
  feeUBA: bigint

  @Property({ type: 'number' })
  firstUnderlyingBlock: number

  @Property({ type: 'number' })
  lastUnderlyingBlock: number

  @Property({ type: 'number' })
  lastUnderlyingTimestamp: number

  @ManyToOne({ entity: () => UnderlyingAddress})
  paymentAddress: UnderlyingAddress

  @Property({ type: 'text', length: BYTES32_LENGTH, unique: true })
  paymentReference: string

  @ManyToOne({ entity: () => EvmAddress })
  executor: EvmAddress

  @Property({ type: new uint256() })
  executorFeeNatWei: bigint

  constructor(
    evmLog: EvmLog,
    collateralReservationId: number,
    agentVault: AgentVault,
    minter: EvmAddress,
    valueUBA: bigint,
    feeUBA: bigint,
    firstUnderlyingBlock: number,
    lastUnderlyingBlock: number,
    lastUnderlyingTimestamp: number,
    paymentAddress: UnderlyingAddress,
    paymentReference: string,
    executor: EvmAddress,
    executorFeeNatWei: bigint
  ) {
    super(evmLog)
    this.agentVault = agentVault
    this.minter = minter
    this.collateralReservationId = collateralReservationId
    this.valueUBA = valueUBA
    this.feeUBA = feeUBA
    this.firstUnderlyingBlock = firstUnderlyingBlock
    this.lastUnderlyingBlock = lastUnderlyingBlock
    this.lastUnderlyingTimestamp = lastUnderlyingTimestamp
    this.paymentAddress = paymentAddress
    this.paymentReference = paymentReference
    this.executor = executor
    this.executorFeeNatWei = executorFeeNatWei
  }
}

@Entity()
export class MintingExecuted extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => CollateralReserved })
  collateralReserved: CollateralReserved

  @Property({ type: new uint256() })
  poolFeeUBA: bigint

  constructor(evmLog: EvmLog, collateralReserved: CollateralReserved, poolFeeUBA: bigint) {
    super(evmLog)
    this.collateralReserved = collateralReserved
    this.poolFeeUBA = poolFeeUBA
  }
}

@Entity()
export class MintingPaymentDefault extends EventBound {

  @OneToOne(() => CollateralReserved, { primary: true, entity: () => CollateralReserved, owner: true })
  collateralReserved: CollateralReserved

  constructor(evmLog: EvmLog, collateralReserved: CollateralReserved) {
    super(evmLog)
    this.collateralReserved = collateralReserved
  }
}

@Entity()
export class CollateralReservationDeleted extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => CollateralReserved })
  collateralReserved: CollateralReserved

  constructor(evmLog: EvmLog, collateralReserved: CollateralReserved) {
    super(evmLog)
    this.collateralReserved = collateralReserved
  }
}