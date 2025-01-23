import { Entity, ManyToOne, OneToOne, Property } from "@mikro-orm/core"
import { uint256, uint64 } from "../../custom/uint"
import { EvmLog } from "../evm/log"
import { FAssetEventBound } from "./_bound"
import { AgentVault } from "../agent"
import type { FAssetType } from "../../../shared"


@Entity()
export class AgentVaultCreated extends FAssetEventBound {

  @OneToOne({ entity: () => AgentVault, owner: true })
  agentVault: AgentVault

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault) {
    super(evmLog, fasset)
    this.agentVault = agentVault
  }
}

@Entity()
export class AgentSettingChanged extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: 'text' })
  name: string

  @Property({ type: new uint256() })
  value: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, name: string, value: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.name = name
    this.value = value
  }
}

@Entity()
export class SelfClose extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint256() })
  valueUBA: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, valueUBA: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.valueUBA = valueUBA
  }
}

@Entity()
export class VaultCollateralWithdrawalAnnounced extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint256() })
  amountWei: bigint

  @Property({ type: new uint64() })
  allowedAt: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, amountWei: bigint, allowedAt: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.amountWei = amountWei
    this.allowedAt = allowedAt
  }
}

@Entity()
export class PoolTokenRedemptionAnnounced extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint256() })
  amountWei: bigint

  @Property({ type: new uint64() })
  allowedAt: bigint

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, amountWei: bigint, allowedAt: bigint) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.amountWei = amountWei
    this.allowedAt = allowedAt
  }
}

@Entity()
export class UnderlyingWithdrawalAnnounced extends FAssetEventBound {

  @ManyToOne({ entity: () => AgentVault })
  agentVault: AgentVault

  @Property({ type: new uint64() })
  announcementId: bigint

  @Property({ type: 'string' })
  paymentReference: string

  constructor(evmLog: EvmLog, fasset: FAssetType, agentVault: AgentVault, announcementId: bigint, paymentReference: string) {
    super(evmLog, fasset)
    this.agentVault = agentVault
    this.announcementId = announcementId
    this.paymentReference = paymentReference
  }
}

@Entity()
export class UnderlyingWithdrawalConfirmed extends FAssetEventBound {

  @OneToOne({ entity: () => UnderlyingWithdrawalAnnounced })
  underlyingWithdrawalAnnounced: UnderlyingWithdrawalAnnounced

  @Property({ type: new uint256() })
  spendUBA: bigint

  @Property({ type: 'string' })
  transactionHash: string

  constructor(evmLog: EvmLog, fasset: FAssetType,
    underlyingWithdrawalAnnounced: UnderlyingWithdrawalAnnounced,
    spendUBA: bigint,
    transactionHash: string
  ) {
    super(evmLog, fasset)
    this.underlyingWithdrawalAnnounced = underlyingWithdrawalAnnounced
    this.spendUBA = spendUBA
    this.transactionHash = transactionHash
  }
}