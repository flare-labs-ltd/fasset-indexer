import { Entity, Property, ManyToOne, OneToOne, Unique } from '@mikro-orm/core'
import { uint256 } from '../../custom/uint'
import { AgentVault } from '../agent'
import { EvmAddress } from '../address'
import { UnderlyingAddress } from '../underlying/address'
import { FAssetEventBound } from './_bound'
import { BYTES32_LENGTH } from '../../../config/constants'
import type { EvmLog } from '../evm/log'
import type { FAssetType } from '../../../shared'


@Entity()
@Unique({ properties: ['fasset', 'paymentReference'] })
@Unique({ properties: ['fasset', 'collateralReservationId'] })
export class CollateralReserved extends FAssetEventBound {

  @Property({ type: 'number' })
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

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @ManyToOne({ entity: () => EvmAddress })
  executor: EvmAddress

  @Property({ type: new uint256() })
  executorFeeNatWei: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
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
    super(evmLog, fasset)
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
export class MintingExecuted extends FAssetEventBound {

  @OneToOne({ entity: () => CollateralReserved, owner: true })
  collateralReserved: CollateralReserved

  @Property({ type: new uint256() })
  poolFeeUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, collateralReserved: CollateralReserved, poolFeeUBA: bigint) {
    super(evmLog, fasset)
    this.collateralReserved = collateralReserved
    this.poolFeeUBA = poolFeeUBA
  }
}

@Entity()
export class MintingPaymentDefault extends FAssetEventBound {

  @OneToOne({ entity: () => CollateralReserved, owner: true })
  collateralReserved: CollateralReserved

  constructor(evmLog: EvmLog, fasset: FAssetType, collateralReserved: CollateralReserved) {
    super(evmLog, fasset)
    this.collateralReserved = collateralReserved
  }
}

@Entity()
export class CollateralReservationDeleted extends FAssetEventBound {

  @OneToOne({ entity: () => CollateralReserved, owner: true })
  collateralReserved: CollateralReserved

  constructor(evmLog: EvmLog, fasset: FAssetType, collateralReserved: CollateralReserved) {
    super(evmLog, fasset)
    this.collateralReserved = collateralReserved
  }
}

@Entity()
export class SelfMint extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'boolean' })
  mintFromFreeUnderlying: boolean

  @Property({ type: new uint256() })
  mintedUBA: bigint

  @Property({ type: new uint256() })
  depositedUBA: bigint

  @Property({ type: new uint256() })
  poolFeeUBA: bigint


  constructor(evmLog: EvmLog, fasset: FAssetType,
    agentVault: AgentVault, mintFromFreeUnderlying: boolean,
    mintedUBA: bigint, depositedUBA: bigint, poolFeeUBA: bigint
  ) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.mintFromFreeUnderlying = mintFromFreeUnderlying
    this.mintedUBA = mintedUBA
    this.depositedUBA = depositedUBA
    this.poolFeeUBA = poolFeeUBA
  }

}