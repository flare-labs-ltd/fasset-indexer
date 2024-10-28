import { FAssetType } from "../shared"
import { CollateralTypeAdded } from "../database/entities/events/token"
import { FtsoPrice } from "../database/entities/state/price"
import type { EntityManager } from "@mikro-orm/core"


export function fassetDecimals(fasset: FAssetType): number {
  if (fasset == FAssetType.FXRP) {
    return 6
  } else if (fasset == FAssetType.FBTC) {
    return 8
  } else {
    throw new Error(`Unknown fasset type: ${fasset}`)
  }
}

export async function fassetToUsdPrice(em: EntityManager, fasset: FAssetType): Promise<[mul: bigint, div: bigint]> {
  const fassetToken = await em.findOneOrFail(CollateralTypeAdded, { fasset: fasset })
  const fassetPrice = await em.findOneOrFail(FtsoPrice, { symbol: fassetToken.assetFtsoSymbol })
  const fassetTokenDecimals = fassetDecimals(fasset)
  return [ fassetPrice.price, BigInt(10) ** BigInt(fassetPrice.decimals + fassetTokenDecimals) ]
}
