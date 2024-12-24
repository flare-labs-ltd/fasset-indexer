import { Entity, ManyToOne, Property, OneToOne, Unique } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { EvmAddress, UnderlyingAddress } from "../address"
import { EvmLog } from "../evm/log"
import { AgentVault } from "../agent"
import { FAssetEventBound } from "./_bound"
import { BYTES32_LENGTH } from "../../../config/constants"
import type { FAssetType } from "../../../shared"


@Entity()
@Unique({ properties: ['fasset', 'requestId'] })
@Unique({ properties: ['fasset', 'paymentReference'] })
export class RedemptionRequested extends FAssetEventBound {

  @Property({ type: 'number' })
  requestId: number

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @ManyToOne({ entity: () => UnderlyingAddress })
  paymentAddress: UnderlyingAddress

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

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @ManyToOne({ entity: () => EvmAddress })
  executor: EvmAddress

  @Property({ type: new uint256() })
  executorFeeNatWei: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    agentVault: AgentVault,
    redeemer: EvmAddress,
    requestId: number,
    paymentAddress: UnderlyingAddress,
    valueUBA: bigint,
    feeUBA: bigint,
    firstUnderlyingBlock: number,
    lastUnderlyingBlock: number,
    lastUnderlyingTimestamp: number,
    paymentReference: string,
    executor: EvmAddress,
    executorFeeNatWei: bigint
  ) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.redeemer = redeemer
    this.requestId = requestId
    this.paymentAddress = paymentAddress
    this.valueUBA = valueUBA
    this.feeUBA = feeUBA
    this.firstUnderlyingBlock = firstUnderlyingBlock
    this.lastUnderlyingBlock = lastUnderlyingBlock
    this.lastUnderlyingTimestamp = lastUnderlyingTimestamp
    this.paymentReference = paymentReference
    this.executor = executor
    this.executorFeeNatWei = executorFeeNatWei
  }
}

@Entity()
export class RedemptionPerformed extends FAssetEventBound {

  @OneToOne({ entity: () => RedemptionRequested, owner: true })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH, unique: true })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint
  ) {
    super(evmLog, fasset)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
  }
}

@Entity()
export class RedemptionDefault extends FAssetEventBound {

  @OneToOne({ entity: () => RedemptionRequested, owner: true })
  redemptionRequested: RedemptionRequested

  @Property({ type: new uint256() })
  redeemedVaultCollateralWei: bigint

  @Property({ type: new uint256() })
  redeemedPoolCollateralWei: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    redemptionRequested: RedemptionRequested,
    redeemedVaultCollateralWei: bigint,
    redeemedPoolCollateralWei: bigint
  ) {
    super(evmLog, fasset)
    this.redemptionRequested = redemptionRequested
    this.redeemedVaultCollateralWei = redeemedVaultCollateralWei
    this.redeemedPoolCollateralWei = redeemedPoolCollateralWei
  }
}

@Entity()
export class RedemptionRejected extends FAssetEventBound {

  @OneToOne({ entity: () => RedemptionRequested, owner: true })
  redemptionRequested: RedemptionRequested

  constructor(evmLog: EvmLog, fasset: FAssetType, redemptionRequested: RedemptionRequested) {
    super(evmLog, fasset)
    this.redemptionRequested = redemptionRequested
  }
}

@Entity()
export class RedemptionPaymentBlocked extends FAssetEventBound {

  @OneToOne({ entity: () => RedemptionRequested, owner: true })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint
  ) {
    super(evmLog, fasset)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
  }
}

@Entity()
export class RedemptionPaymentFailed extends FAssetEventBound {

  @OneToOne({ entity: () => RedemptionRequested, owner: true })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  @Property({ type: 'text' })
  failureReason: string

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint,
    failureReason: string
  ) {
    super(evmLog, fasset)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
    this.failureReason = failureReason
  }
}

@Entity()
export class RedemptionRequestIncomplete extends FAssetEventBound {

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @Property({ type: new uint256() })
  remainingLots: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, redeemer: EvmAddress, remainingLots: bigint) {
    super(evmLog, fasset)
    this.redeemer = redeemer
    this.remainingLots = remainingLots
  }
}

@Entity()
export class RedeemedInCollateral extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @Property({ type: new uint256() })
  redemptionAmountUBA: bigint

  @Property({ type: new uint256() })
  paidVaultCollateralWei: bigint

  constructor(
    evmLog: EvmLog,
    fasset: FAssetType,
    agentVault: AgentVault,
    redeemer: EvmAddress,
    redemptionAmountUBA: bigint,
    paidVaultCollateralWei: bigint
  ) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.redeemer = redeemer
    this.redemptionAmountUBA = redemptionAmountUBA
    this.paidVaultCollateralWei = paidVaultCollateralWei
  }
}