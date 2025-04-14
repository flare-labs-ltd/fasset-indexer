import { Entity, ManyToOne, Property, Unique } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { FAssetType } from "../../../shared"
import { FAssetEventBound } from "./_bound"
import { EvmLog } from "../evm/log"
import { BYTES32_LENGTH } from "../../../config/constants"
import { UnderlyingAddress } from "../underlying/address"


@Entity()
export class CoreVaultManagerSettingsUpdated extends FAssetEventBound {

  @Property({ type: new uint256() })
  escrowEndTimeSeconds: bigint

  @Property({ type: new uint256() })
  escrowAmount: bigint

  @Property({ type: new uint256() })
  minimalAmount: bigint

  @Property({ type: new uint256() })
  fee: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    escrowEndTimeSeconds: bigint, escrowAmount: bigint,
    minimalAmount: bigint, fee: bigint
  ) {
    super(evmLog, fasset)
    this.escrowEndTimeSeconds = escrowEndTimeSeconds
    this.escrowAmount = escrowAmount
    this.minimalAmount = minimalAmount
    this.fee = fee
  }

}

@Entity()
@Unique({ properties: ['fasset', 'transactionId'] })
export class CoreVaultManagerPaymentConfirmed extends FAssetEventBound {

  @Property({ type: 'text', length: BYTES32_LENGTH, unique: true })
  transactionId: string

  @Property({ type: 'text' })
  paymentReference: string

  @Property({ type: new uint256() })
  amount: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, transactionId: string, paymentReference: string, amount: bigint) {
    super(evmLog, fasset)
    this.transactionId = transactionId
    this.paymentReference = paymentReference
    this.amount = amount
  }
}

@Entity()
export class CoreVaultManagerPaymentInstructions extends FAssetEventBound {

  @Property({ type: new uint256() })
  sequence: bigint

  @ManyToOne({ entity: () => UnderlyingAddress })
  account: UnderlyingAddress

  @ManyToOne({ entity: () => UnderlyingAddress })
  destination: UnderlyingAddress

  @Property({ type: new uint256() })
  amount: bigint

  @Property({ type: new uint256() })
  fee: bigint

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  constructor(evmLog: EvmLog, fasset: FAssetType,
    sequence: bigint, account: UnderlyingAddress, destination: UnderlyingAddress,
    amount: bigint, fee: bigint, paymentReference: string
  ) {
    super(evmLog, fasset)
    this.sequence = sequence
    this.account = account
    this.destination = destination
    this.amount = amount
    this.fee = fee
    this.paymentReference = paymentReference
  }

}

@Entity()
export class CoreVaultManagerEscrowInstructions extends FAssetEventBound {

  @Property({ type: new uint256() })
  sequence: bigint

  @Property({ type: 'text', length: BYTES32_LENGTH })
  preimageHash: string

  @ManyToOne({ entity: () => UnderlyingAddress })
  account: UnderlyingAddress

  @ManyToOne({ entity: () => UnderlyingAddress })
  destination: UnderlyingAddress

  @Property({ type: new uint256() })
  amount: bigint

  @Property({ type: new uint256() })
  fee: bigint

  @Property({ type: new uint256() })
  cancelAfterTs: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    sequence: bigint, preimageHash: string, account: UnderlyingAddress,
    destination: UnderlyingAddress, amount: bigint, fee: bigint, cancelAfterTs: bigint
  ) {
    super(evmLog, fasset)
    this.sequence = sequence
    this.preimageHash = preimageHash
    this.account = account
    this.destination = destination
    this.amount = amount
    this.fee = fee
    this.cancelAfterTs = cancelAfterTs
  }
}

@Entity()
export class CoreVaultManagerTransferRequested extends FAssetEventBound {

  @ManyToOne({ entity: () => UnderlyingAddress })
  destination: UnderlyingAddress

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @Property({ type: new uint256() })
  amount: bigint

  @Property({ type: 'boolean' })
  cancelable: boolean

  constructor(evmLog: EvmLog, fasset: FAssetType,
    destination: UnderlyingAddress, paymentReference: string,
    amount: bigint, cancelable: boolean
  ) {
    super(evmLog, fasset)
    this.destination = destination
    this.paymentReference = paymentReference
    this.amount = amount
    this.cancelable = cancelable
  }
}

@Entity()
export class CoreVaultManagerTransferRequestCanceled extends FAssetEventBound {

  @ManyToOne({ entity: () => UnderlyingAddress })
  destination: UnderlyingAddress

  @Property({ type: 'text', length: BYTES32_LENGTH })
  paymentReference: string

  @Property({ type: new uint256() })
  amount: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType,
    destination: UnderlyingAddress, paymentReference: string, amount: bigint
  ) {
    super(evmLog, fasset)
    this.destination = destination
    this.paymentReference = paymentReference
    this.amount = amount
  }

}

@Entity()
export class CoreVaultManagerNotAllEscrowsProcessed extends FAssetEventBound {}

@Entity()
export class EscrowFinished extends FAssetEventBound {

  @Property({ type: 'text', length: BYTES32_LENGTH })
  preimageHash: string

  @Property({ type: new uint256() })
  amount: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, preimageHash: string, amount: bigint) {
    super(evmLog, fasset)
    this.preimageHash = preimageHash
    this.amount = amount
  }
}

@Entity()
export class CoreVaultManagerCustodianAddressUpdated extends FAssetEventBound {

  @ManyToOne({ entity: () => UnderlyingAddress })
  custodian: UnderlyingAddress

  constructor(evmLog: EvmLog, fasset: FAssetType, custodian: UnderlyingAddress) {
    super(evmLog, fasset)
    this.custodian = custodian
  }
}