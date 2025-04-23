import { Entity, Property, ManyToOne } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { FAssetEventBound } from "./_bound"
import { EvmAddress } from "../evm/address"
import type { EvmLog } from "../evm/log"
import type { FAssetType } from "../../../shared"


@Entity()
export class CollateralPoolEntered extends FAssetEventBound {

  @ManyToOne({ entity: () => EvmAddress })
  tokenHolder: EvmAddress

  @Property({ type: new uint256() })
  amountNatWei: bigint

  @Property({ type: new uint256() })
  receivedTokensWei: bigint

  @Property({ type: new uint256() })
  addedFAssetFeeUBA: bigint

  @Property({ type: new uint256() })
  newFAssetFeeDebt: bigint

  @Property({ type: 'number' })
  timelockExpiresAt: number

  constructor(evmLog: EvmLog,
    fasset: FAssetType,
    tokenHolder: EvmAddress,
    amountNatWei: bigint,
    receivedTokensWei: bigint,
    addedFAssetFeeUBA: bigint,
    newFAssetFeeDebt: bigint,
    timelockExpiresAt: number
  ) {
    super(evmLog, fasset)
    this.tokenHolder = tokenHolder
    this.amountNatWei = amountNatWei
    this.receivedTokensWei = receivedTokensWei
    this.addedFAssetFeeUBA = addedFAssetFeeUBA
    this.newFAssetFeeDebt = newFAssetFeeDebt
    this.timelockExpiresAt = timelockExpiresAt
  }
}

@Entity()
export class CollateralPoolExited extends FAssetEventBound {
  @ManyToOne({ entity: () => EvmAddress })
  tokenHolder: EvmAddress

  @Property({ type: new uint256() })
  burnedTokensWei: bigint

  @Property({ type: new uint256() })
  receivedNatWei: bigint

  @Property({ type: new uint256() })
  receivedFAssetFeesUBA: bigint

  @Property({ type: new uint256() })
  closedFAssetsUBA: bigint

  @Property({ type: new uint256() })
  newFAssetFeeDebt: bigint

  constructor(evmLog: EvmLog,
    fasset: FAssetType,
    tokenHolder: EvmAddress,
    burnedTokensWei: bigint,
    receivedNatWei: bigint,
    receivedFAssetFeesUBA: bigint,
    closedFAssetsUBA: bigint,
    newFAssetFeeDebt: bigint
  ) {
    super(evmLog, fasset)
    this.tokenHolder = tokenHolder
    this.burnedTokensWei = burnedTokensWei
    this.receivedNatWei = receivedNatWei
    this.receivedFAssetFeesUBA = receivedFAssetFeesUBA
    this.closedFAssetsUBA = closedFAssetsUBA
    this.newFAssetFeeDebt = newFAssetFeeDebt
  }
}

@Entity()
export class CollateralPoolDonated extends FAssetEventBound {

  @ManyToOne({ entity: () => EvmAddress })
  donator: EvmAddress

  @Property({ type: new uint256() })
  amountNatWei: bigint

  constructor(evmLog: EvmLog,
    fasset: FAssetType,
    donator: EvmAddress,
    amountNatWei: bigint
  ) {
    super(evmLog, fasset)
    this.donator = donator
    this.amountNatWei = amountNatWei
  }
}

@Entity()
export class CollateralPoolPaidOut extends FAssetEventBound {

  @ManyToOne({ entity: () => EvmAddress })
  recipient: EvmAddress

  @Property({ type: new uint256() })
  paidNatWei: bigint

  @Property({ type: new uint256() })
  burnedTokensWei: bigint

  constructor(evmLog: EvmLog,
    fasset: FAssetType,
    recipient: EvmAddress,
    paidNatWei: bigint,
    burnedTokensWei: bigint
  ) {
    super(evmLog, fasset)
    this.recipient = recipient
    this.paidNatWei = paidNatWei
    this.burnedTokensWei = burnedTokensWei
  }
}

@Entity()
export class CollateralPoolClaimedReward extends FAssetEventBound {

  @Property({ type: new uint256() })
  amountNatWei: bigint

  @Property({ type: 'number' })
  rewardType: number

  constructor(evmLog: EvmLog,
    fasset: FAssetType,
    amountNatWei: bigint,
    rewardType: number
  ) {
    super(evmLog, fasset)
    this.amountNatWei = amountNatWei
    this.rewardType = rewardType
  }
}