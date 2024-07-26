import { Entity, ManyToOne, PrimaryKey, Property, OneToOne } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { EvmAddress, UnderlyingAddress } from "../address"
import { AgentVault } from "../agent"
import { EvmLog, EventBound } from "../logs"
import { BYTES32_LENGTH } from "../../../config/constants"


@Entity()
export class RedemptionRequested extends EventBound {

  @PrimaryKey({ type: 'number' })
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

  @Property({ type: 'text', length: BYTES32_LENGTH, unique: true })
  paymentReference: string

  @ManyToOne({ entity: () => EvmAddress })
  executor: EvmAddress

  @Property({ type: new uint256() })
  executorFeeNatWei: bigint

  constructor(
    evmLog: EvmLog,
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
    super(evmLog)
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
export class RedemptionPerformed extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionRequested })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH, unique: true })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  constructor(
    evmLog: EvmLog,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint
  ) {
    super(evmLog)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
  }
}

@Entity()
export class RedemptionDefault extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionRequested })
  redemptionRequested: RedemptionRequested

  @Property({ type: new uint256() })
  redeemedVaultCollateralWei: bigint

  @Property({ type: new uint256() })
  redeemedPoolCollateralWei: bigint

  constructor(
    evmLog: EvmLog,
    redemptionRequested: RedemptionRequested,
    redeemedVaultCollateralWei: bigint,
    redeemedPoolCollateralWei: bigint
  ) {
    super(evmLog)
    this.redemptionRequested = redemptionRequested
    this.redeemedVaultCollateralWei = redeemedVaultCollateralWei
    this.redeemedPoolCollateralWei = redeemedPoolCollateralWei
  }
}

@Entity()
export class RedemptionRejected extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionRequested })
  redemptionRequested: RedemptionRequested

  constructor(evmLog: EvmLog, redemptionRequested: RedemptionRequested) {
    super(evmLog)
    this.redemptionRequested = redemptionRequested
  }
}

@Entity()
export class RedemptionPaymentBlocked extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionRequested })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  constructor(
    evmLog: EvmLog,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint
  ) {
    super(evmLog)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
  }
}

@Entity()
export class RedemptionPaymentFailed extends EventBound {

  @OneToOne({ primary: true, owner: true, entity: () => RedemptionRequested })
  redemptionRequested: RedemptionRequested

  @Property({ type: 'text', length: BYTES32_LENGTH })
  transactionHash: string

  @Property({ type: new uint256() })
  spentUnderlyingUBA: bigint

  @Property({ type: 'text' })
  failureReason: string

  constructor(
    evmLog: EvmLog,
    redemptionRequested: RedemptionRequested,
    transactionHash: string,
    spentUnderlyingUBA: bigint,
    failureReason: string
  ) {
    super(evmLog)
    this.redemptionRequested = redemptionRequested
    this.transactionHash = transactionHash
    this.spentUnderlyingUBA = spentUnderlyingUBA
    this.failureReason = failureReason
  }
}

@Entity()
export class RedemptionRequestIncomplete extends EventBound {

  @PrimaryKey({ type: "number", autoincrement: true })
  id!: number

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @Property({ type: new uint256() })
  remainingLots: bigint

  constructor(evmLog: EvmLog, redeemer: EvmAddress, remainingLots: bigint) {
    super(evmLog)
    this.redeemer = redeemer
    this.remainingLots = remainingLots
  }
}