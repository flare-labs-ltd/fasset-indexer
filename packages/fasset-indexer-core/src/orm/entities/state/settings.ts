import { Entity, Enum, Property } from "@mikro-orm/core"
import { uint256 } from "../../custom/uint"
import { FAssetType } from "../../../shared"

@Entity()
export class AssetManagerSettings {

  @Enum({ type: () => FAssetType, primary: true })
  fasset: FAssetType

  @Property({ type: new uint256() })
  lotSizeAmg: bigint

  constructor(fasset: FAssetType, lotSizeAmg: bigint) {
    this.fasset = fasset
    this.lotSizeAmg = lotSizeAmg
  }

}