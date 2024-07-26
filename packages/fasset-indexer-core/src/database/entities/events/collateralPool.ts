import { Entity, Property, ManyToOne, PrimaryKey } from "@mikro-orm/core"
import { uint256 } from "../../custom/typeUint256"
import { EventBound, EvmLog } from "../logs"
import { EvmAddress } from "../address"


@Entity()
export class CollateralPoolEntered extends EventBound {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

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
    tokenHolder: EvmAddress,
    amountNatWei: bigint,
    receivedTokensWei: bigint,
    addedFAssetFeeUBA: bigint,
    newFAssetFeeDebt: bigint,
    timelockExpiresAt: number
  ) {
    super(evmLog)
    this.tokenHolder = tokenHolder
    this.amountNatWei = amountNatWei
    this.receivedTokensWei = receivedTokensWei
    this.addedFAssetFeeUBA = addedFAssetFeeUBA
    this.newFAssetFeeDebt = newFAssetFeeDebt
    this.timelockExpiresAt = timelockExpiresAt
  }
}

@Entity()
export class CollateralPoolExited extends EventBound {

  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number

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
    tokenHolder: EvmAddress,
    burnedTokensWei: bigint,
    receivedNatWei: bigint,
    receivedFAssetFeesUBA: bigint,
    closedFAssetsUBA: bigint,
    newFAssetFeeDebt: bigint
  ) {
    super(evmLog)
    this.tokenHolder = tokenHolder
    this.burnedTokensWei = burnedTokensWei
    this.receivedNatWei = receivedNatWei
    this.receivedFAssetFeesUBA = receivedFAssetFeesUBA
    this.closedFAssetsUBA = closedFAssetsUBA
    this.newFAssetFeeDebt = newFAssetFeeDebt
  }
}