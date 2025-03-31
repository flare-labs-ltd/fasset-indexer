import { Entity, ManyToOne, OneToOne, Property, Unique } from "@mikro-orm/core"
import { uint256, uint64 } from "../../custom/uint"
import { FAssetType } from "../../../shared"
import { FAssetEventBound } from "./_bound"
import { EvmLog } from "../evm/log"
import { EvmAddress } from "../address"
import { UnderlyingAddress } from "../underlying/address"
import { AgentVault } from "../agent"
import { BYTES32_LENGTH } from "../../../config/constants"


@Entity()
@Unique({ properties: ['fasset', 'transferRedemptionRequestId'] })
export class TransferToCoreVaultStarted extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'number' })
  transferRedemptionRequestId: number

  @Property({ type: new uint64() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, transferRedemptionRequestId: number, valueUBA: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.transferRedemptionRequestId = transferRedemptionRequestId
    this.valueUBA = valueUBA
  }
}

@Entity()
export class TransferToCoreVaultCancelled extends FAssetEventBound {

  @OneToOne({ entity: () => TransferToCoreVaultStarted, owner: true })
  transferToCoreVaultStarted: TransferToCoreVaultStarted

  constructor(evmLog: EvmLog, fasset: FAssetType, transferToCoreVaultStarted: TransferToCoreVaultStarted) {
    super(evmLog, fasset)
    this.transferToCoreVaultStarted = transferToCoreVaultStarted
  }
}

@Entity()
export class TransferToCoreVaultSuccessful extends FAssetEventBound {

  @OneToOne({ entity: () => TransferToCoreVaultStarted, owner: true })
  transferToCoreVaultStarted: TransferToCoreVaultStarted

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, transferToCoreVaultStarted: TransferToCoreVaultStarted, valueUBA: bigint) {
    super(evmLog, fasset)
    this.transferToCoreVaultStarted = transferToCoreVaultStarted
    this.valueUBA = valueUBA
  }
}

@Entity()
@Unique({ properties: ['fasset', 'requestId'] })
export class ReturnFromCoreVaultRequested extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'number' })
  requestId: number

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, requestId: number, paymentReference: string, valueUBA: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.requestId = requestId
    this.paymentReference = paymentReference
    this.valueUBA = valueUBA
  }
}

@Entity()
export class ReturnFromCoreVaultCancelled extends FAssetEventBound {

  @OneToOne({ entity: () => ReturnFromCoreVaultRequested, owner: true })
  returnFromCoreVaultRequested: ReturnFromCoreVaultRequested

  constructor(evmLog: EvmLog, fasset: FAssetType, returnFromCoreVaultRequested: ReturnFromCoreVaultRequested) {
    super(evmLog, fasset)
    this.returnFromCoreVaultRequested = returnFromCoreVaultRequested
  }
}

@Entity()
export class ReturnFromCoreVaultConfirmed extends FAssetEventBound {

  @OneToOne({ entity: () => ReturnFromCoreVaultRequested, owner: true })
  returnFromCoreVaultRequested: ReturnFromCoreVaultRequested

  @Property({ type: new uint256() })
  receivedUnderlyingUBA: bigint

  @Property({ type: new uint256() })
  remintedUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    returnFromCoreVaultRequested: ReturnFromCoreVaultRequested,
    receivedUnderlyingUBA: bigint,
    remintedUBA: bigint
  ) {
    super(evmLog, fasset)
    this.returnFromCoreVaultRequested = returnFromCoreVaultRequested
    this.receivedUnderlyingUBA = receivedUnderlyingUBA
    this.remintedUBA = remintedUBA
  }
}

@Entity()
export class CoreVaultRedemptionRequested extends FAssetEventBound {

  @ManyToOne({ entity: () => EvmAddress })
  redeemer: EvmAddress

  @ManyToOne({ entity: () => UnderlyingAddress })
  paymentAddress: UnderlyingAddress

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @Property({ type: new uint256() })
  valueUBA: bigint

  @Property({ type: new uint256() })
  feeUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    redeemer: EvmAddress,
    paymentAddress: UnderlyingAddress,
    paymentReference: string,
    valueUBA: bigint, feeUBA: bigint
  ) {
    super(evmLog, fasset)
    this.redeemer = redeemer
    this.paymentAddress = paymentAddress
    this.paymentReference = paymentReference
    this.valueUBA = valueUBA
    this.feeUBA = feeUBA
  }
}